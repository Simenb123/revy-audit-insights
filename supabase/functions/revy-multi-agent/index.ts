import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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
    
    console.log('Multi-agent discussion started:', { 
      idea: idea?.slice(0, 100), 
      agentCount: agents?.length,
      settings: settings,
      agentKeys: agents?.map((a: any) => a.key)
    });

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

    const callOpenAI = async (model: string, messages: any[], opts: any = {}): Promise<{ content: string; modelUsed: string; fallbackUsed: boolean }> => {
      let primaryModel = model;
      let fallbackModel = 'gpt-4o-mini';
      let fallbackUsed = false;
      
      // For legacy models, convert max_completion_tokens to max_tokens
      const requestOpts = { ...opts };
      if (model?.includes('gpt-4o') && requestOpts.max_completion_tokens) {
        requestOpts.max_tokens = requestOpts.max_completion_tokens;
        delete requestOpts.max_completion_tokens;
      }

      const tryModel = async (modelName: string, isRetry = false): Promise<string> => {
        const requestBody = { model: modelName, messages, ...requestOpts };
        
        console.log(`🔄 OpenAI ${isRetry ? 'FALLBACK' : 'PRIMARY'} request:`, { 
          model: modelName, 
          messageCount: messages.length, 
          opts: requestOpts,
          systemPrompt: messages[0]?.content?.slice(0, 100) + '...',
          isRetry
        });

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        const data = await resp.json();
        
        console.log(`📥 OpenAI response (${modelName}):`, {
          status: resp.status,
          ok: resp.ok,
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length || 0,
          error: data.error || null,
          usage: data.usage || null
        });

        if (!resp.ok) {
          console.error(`❌ OpenAI API Error (${modelName}):`, data);
          throw new Error(data?.error?.message || `OpenAI feil for ${modelName}`);
        }
        
        const content = data.choices?.[0]?.message?.content || '';
        
        console.log(`✅ OpenAI content received (${modelName}):`, {
          contentLength: content.length,
          isEmpty: content.trim() === '',
          preview: content.slice(0, 150) + (content.length > 150 ? '...' : '')
        });

        if (!content || content.trim() === '') {
          console.warn(`⚠️ ${modelName} returnerte tomt innhold!`);
          if (!isRetry) {
            throw new Error(`Tomt svar fra ${modelName}`);
          }
        }
        
        return content;
      };

      try {
        // Prøv primærmodell først
        const content = await tryModel(primaryModel);
        if (content && content.trim() !== '') {
          console.log(`🎉 Suksess med primærmodell: ${primaryModel}`);
          return { content, modelUsed: primaryModel, fallbackUsed: false };
        }
        throw new Error('Tomt svar fra primærmodell');
      } catch (primaryError) {
        console.warn(`⚠️ Primærmodell ${primaryModel} feilet:`, primaryError.message);
        console.log(`🔄 Prøver fallback til ${fallbackModel}...`);
        
        try {
          // Konverter opts for fallback-modell
          const fallbackOpts = { ...opts };
          if (fallbackModel.includes('gpt-4o') && fallbackOpts.max_completion_tokens) {
            fallbackOpts.max_tokens = fallbackOpts.max_completion_tokens;
            delete fallbackOpts.max_completion_tokens;
          }
          
          const content = await tryModel(fallbackModel, true);
          fallbackUsed = true;
          
          console.log(`🎉 Fallback suksess med ${fallbackModel}`);
          return { content, modelUsed: fallbackModel, fallbackUsed: true };
        } catch (fallbackError) {
          console.error(`❌ Både ${primaryModel} og ${fallbackModel} feilet!`, {
            primaryError: primaryError.message,
            fallbackError: fallbackError.message
          });
          throw new Error(`AI-modeller utilgjengelig: ${primaryError.message}`);
        }
      }
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
        const orderResult = await callOpenAI(moderator.model || 'gpt-5-mini', contextMsg, { 
          max_completion_tokens: 150 
        });
        const raw = orderResult.content;
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
      
      const modResult = await callOpenAI(mod.model || 'gpt-5-mini', modMsg, { 
        max_completion_tokens: Math.max(150, settings.maxTokensPerTurn)
      });
      const modContent = modResult.content;
      
      const modMessage = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        agentKey: settings.moderatorKey, 
        agentName: mod.name, 
        content: modContent, 
        turnIndex: r, 
        createdAt: new Date().toISOString(),
        modelUsed: modResult.modelUsed,
        fallbackUsed: modResult.fallbackUsed
      };
      
      transcript.push(modMessage);

      // Store message in database
      console.log('Storing moderator message:', { 
        agent: mod.name, 
        contentLength: modContent?.length || 0,
        isEmpty: !modContent || modContent.trim() === ''
      });
      
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
        
        const agentResult = await callOpenAI(agent.model || 'gpt-5-mini', messages, { 
          max_completion_tokens: Math.max(150, settings.maxTokensPerTurn)
        });
        const content = agentResult.content;
        
        const agentMessage = { 
          id: crypto.randomUUID(), 
          role: 'assistant', 
          agentKey, 
          agentName: agent.name, 
          content, 
          turnIndex: r, 
          createdAt: new Date().toISOString(),
          modelUsed: agentResult.modelUsed,
          fallbackUsed: agentResult.fallbackUsed
        };
        
        transcript.push(agentMessage);

        // Store message in database
        console.log('Storing agent message:', { 
          agent: agent.name, 
          contentLength: content?.length || 0,
          isEmpty: !content || content.trim() === ''
        });
        
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
        console.log('Note taker found:', { 
          noteTakerKey: settings.noteTakerKey, 
          noteExists: !!note,
          noteModel: note?.model 
        });
        
        if (!note) {
          console.error('Note taker not found for key:', settings.noteTakerKey);
          throw new Error(`Note taker agent not found for key: ${settings.noteTakerKey}`);
        }
        
        const lastRound = transcript.filter(t => t.turnIndex === r).map(t => `${t.agentName}: ${t.content}`).join('\n');
        const sumMsg = [ 
          { role: 'system', content: 'Du er referent. Oppsummer runden i 3–5 punkt, samt 1–3 neste steg. Kort og tydelig. Norsk.' }, 
          { role: 'user', content: lastRound } 
        ];
        
        const summaryResult = await callOpenAI(note.model || 'gpt-5-mini', sumMsg, { 
          max_completion_tokens: 300
        });
        const summary = summaryResult.content;
        
        runningSummary = summary;
        
        const summaryMessage = { 
          id: crypto.randomUUID(), 
          role: 'assistant', 
          agentKey: 'notetaker', 
          agentName: 'Referent', 
          content: summary, 
          turnIndex: r, 
          createdAt: new Date().toISOString(),
          modelUsed: summaryResult.modelUsed,
          fallbackUsed: summaryResult.fallbackUsed
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
      console.log('Final summary - Note taker found:', { 
        noteTakerKey: settings.noteTakerKey, 
        noteExists: !!note 
      });
      
      if (!note) {
        console.error('Note taker not found for final summary:', settings.noteTakerKey);
        throw new Error(`Note taker agent not found for final summary: ${settings.noteTakerKey}`);
      }
      
      const all = transcript.map(t => `${t.agentName}: ${t.content}`).join('\n');
      const finalMsg = [ 
        { role: 'system', content: 'Du er referent. Lever ET endelig totalreferat: 1) Sammendrag (5–8 punkt), 2) Beslutninger, 3) Åpne spørsmål/risiko, 4) Anbefalte neste steg. Kort, tydelig, og gruppert. Norsk.' }, 
        { role: 'user', content: all } 
      ];
      
      const finalResult = await callOpenAI(note.model || 'gpt-5-mini', finalMsg, { 
        max_completion_tokens: 400 
      });
      const finalSummary = finalResult.content;
      
      const finalMessage = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        agentKey: 'notetaker', 
        agentName: 'Referent', 
        content: finalSummary, 
        turnIndex: settings.rounds, 
        createdAt: new Date().toISOString(),
        modelUsed: finalResult.modelUsed,
        fallbackUsed: finalResult.fallbackUsed
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

    // Samle fallback-statistikk
    const fallbackCount = transcript.filter(m => m.fallbackUsed).length;
    
    return new Response(JSON.stringify({ 
      transcript, 
      conversationId: conversation.id,
      metadata: {
        totalMessages: transcript.length,
        fallbackUsed: fallbackCount > 0,
        fallbackCount
      }
    }), { 
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