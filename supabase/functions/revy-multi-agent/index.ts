import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');

    const { idea, agents, settings, context } = await req.json();

    // Create conversation record
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        client_id: context?.clientId || null,
        title: idea.slice(0, 100),
        idea,
        settings,
        agents,
        status: 'running'
      })
      .select()
      .single();

    if (convError) throw convError;

    const agentByKey: Record<string, any> = Object.fromEntries(agents.map((a: any) => [a.key, a]));

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OPENAI_API_KEY mangler');

    const callOpenAI = async (model: string, messages: any[], opts: any = {}) => {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, ...opts }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error?.message || 'OpenAI feil');
      return data.choices[0].message.content as string;
    };

    const transcript: any[] = [];
    let runningSummary = '';

    const fixedOrder = agents
      .filter((a: any) => a.key !== settings.moderatorKey && a.key !== settings.noteTakerKey)
      .map((a: any) => a.key);

    const pickOrderDynamically = async (roundIdx: number): Promise<string[]> => {
      const remaining = fixedOrder.slice();
      const moderator = agentByKey[settings.moderatorKey];
      const sys = `Du er ${moderator.name}. Du styrer talerrekkefølgen dynamisk. Returner KUN et JSON-array med agentnøkler i den rekkefølgen som bør snakke denne runden. Ingen forklaring.`;
      const contextMsg = [
        { role: 'system', content: sys },
        { role: 'user', content: `Agenter tilgjengelig: ${JSON.stringify(remaining)}\nIdé: ${idea}\nSiste oppsummering: ${runningSummary || 'Ingen'}\nRunde: ${roundIdx + 1}` },
      ];
      try {
        const raw = await callOpenAI(moderator.model || 'gpt-5-mini-2025-08-07', contextMsg, { 
          max_completion_tokens: 120 
        });
        const parsed = JSON.parse(raw);
        const cleaned = parsed.filter((k: string) => remaining.includes(k));
        if (cleaned.length) return cleaned;
      } catch {}
      // fallback: enkel shuffle
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      return remaining;
    };

    for (let r = 0; r < settings.rounds; r++) {
      // 1) Moderator
      const mod = agentByKey[settings.moderatorKey];
      const systemPromptModerator = [
        `Du er ${mod.name}.`,
        mod.systemPrompt,
        `Oppgave/Idé: ${idea}`,
        context?.clientId ? `Klient-ID: ${context.clientId}` : '',
        context?.documentContext ? `Dokument-kontekst: ${context.documentContext}` : '',
        settings.autoSummarize && runningSummary ? `Siste oppsummering: ${runningSummary}` : '',
        `Skriv maks ${settings.maxTokensPerTurn} tokens. Norsk språk.`,
      ].filter(Boolean).join('\n\n');

      const modHistory = transcript.slice(-12).map(m => ({ role: 'user', content: `${m.agentName}: ${m.content}` }));
      const modMsg = [ 
        { role: 'system', content: systemPromptModerator }, 
        ...modHistory, 
        { role: 'user', content: r === 0 ? 'Start med å oppsummere idéen og sett rammene.' : 'Før ordet videre og fokuser diskusjonen.' } 
      ];
      
      const modContent = await callOpenAI(mod.model || 'gpt-5-mini-2025-08-07', modMsg, { 
        max_completion_tokens: settings.maxTokensPerTurn 
      });
      
      const modMessage = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        agentKey: settings.moderatorKey, 
        agentName: mod.name, 
        content: modContent, 
        turnIndex: r, 
        createdAt: new Date().toISOString() 
      };
      
      transcript.push(modMessage);

      // Store message in database
      await supabase.from('ai_messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        agent_key: settings.moderatorKey,
        agent_name: mod.name,
        content: modContent,
        turn_index: r
      });

      // 2) Dynamic order eller fast fallback
      const order = settings.moderatorControlsOrder ? await pickOrderDynamically(r) : fixedOrder;

      for (const agentKey of order) {
        const agent = agentByKey[agentKey];
        const historyWindow = transcript.slice(-12).map(m => ({ role: 'user', content: `${m.agentName}: ${m.content}` }));
        const roleSystem = agent.systemPrompt;
        const systemPrompt = [
          `Du er ${agent.name}.`,
          roleSystem,
          `Oppgave/Idé: ${idea}`,
          settings.autoSummarize && runningSummary ? `Siste oppsummering: ${runningSummary}` : '',
          `Skriv maks ${settings.maxTokensPerTurn} tokens. Norsk språk.`,
        ].filter(Boolean).join('\n\n');
        
        const messages = [ 
          { role: 'system', content: systemPrompt }, 
          ...historyWindow, 
          { role: 'user', content: 'Gi ditt korte bidrag.' } 
        ];
        
        const content = await callOpenAI(agent.model || 'gpt-5-mini-2025-08-07', messages, { 
          max_completion_tokens: settings.maxTokensPerTurn 
        });
        
        const agentMessage = { 
          id: crypto.randomUUID(), 
          role: 'assistant', 
          agentKey, 
          agentName: agent.name, 
          content, 
          turnIndex: r, 
          createdAt: new Date().toISOString() 
        };
        
        transcript.push(agentMessage);

        // Store message in database
        await supabase.from('ai_messages').insert({
          conversation_id: conversation.id,
          role: 'assistant',
          agent_key: agentKey,
          agent_name: agent.name,
          content,
          turn_index: r
        });
      }

      // 3) Runde-oppsummering (Referent)
      if (settings.autoSummarize) {
        const note = agentByKey[settings.noteTakerKey];
        const lastRound = transcript.filter(t => t.turnIndex === r).map(t => `${t.agentName}: ${t.content}`).join('\n');
        const sumMsg = [ 
          { role: 'system', content: 'Du er referent. Oppsummer runden i 3–5 punkt, samt 1–3 neste steg. Kort og tydelig. Norsk.' }, 
          { role: 'user', content: lastRound } 
        ];
        
        const summary = await callOpenAI(note.model || 'gpt-5-mini-2025-08-07', sumMsg, { 
          max_completion_tokens: 220 
        });
        
        runningSummary = summary;
        
        const summaryMessage = { 
          id: crypto.randomUUID(), 
          role: 'assistant', 
          agentKey: 'notetaker', 
          agentName: 'Referent', 
          content: summary, 
          turnIndex: r, 
          createdAt: new Date().toISOString() 
        };
        
        transcript.push(summaryMessage);

        // Store summary message
        await supabase.from('ai_messages').insert({
          conversation_id: conversation.id,
          role: 'assistant',
          agent_key: 'notetaker',
          agent_name: 'Referent',
          content: summary,
          turn_index: r
        });
      }
    }

    // 4) Endelig totalreferat
    if (settings.autoSummarize) {
      const note = agentByKey[settings.noteTakerKey];
      const all = transcript.map(t => `${t.agentName}: ${t.content}`).join('\n');
      const finalMsg = [ 
        { role: 'system', content: 'Du er referent. Lever ET endelig totalreferat: 1) Sammendrag (5–8 punkt), 2) Beslutninger, 3) Åpne spørsmål/risiko, 4) Anbefalte neste steg. Kort, tydelig, og gruppert. Norsk.' }, 
        { role: 'user', content: all } 
      ];
      
      const finalSummary = await callOpenAI(note.model || 'gpt-5-mini-2025-08-07', finalMsg, { 
        max_completion_tokens: 400 
      });
      
      const finalMessage = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        agentKey: 'notetaker', 
        agentName: 'Referent', 
        content: finalSummary, 
        turnIndex: settings.rounds, 
        createdAt: new Date().toISOString() 
      };
      
      transcript.push(finalMessage);

      // Store final summary
      await supabase.from('ai_messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        agent_key: 'notetaker',
        agent_name: 'Referent',
        content: finalSummary,
        turn_index: settings.rounds
      });
    }

    // Mark conversation as completed
    await supabase
      .from('ai_conversations')
      .update({ status: 'completed' })
      .eq('id', conversation.id);

    return new Response(JSON.stringify({ transcript, conversationId: conversation.id }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error('revy-multi-agent error', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});