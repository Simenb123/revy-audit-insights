import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

// Document search functionality
async function performDocumentSearch(supabase: any, clientId: string, query: string): Promise<any[]> {
  try {
    console.log(`🔍 Searching for: "${query}" (client: ${clientId})`);
    
    const { data, error } = await supabase.functions.invoke('enhanced-semantic-search', {
      body: {
        term: query,
        clientId: clientId,
        limit: 5,
        filters: {
          category: null,
          subjectArea: null,
          dateRange: null,
          aiValidation: null,
          confidenceLevel: 0.6
        }
      }
    });

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    console.log(`📄 Found ${data?.results?.length || 0} documents for query: "${query}"`);
    return data?.results || [];
  } catch (error) {
    console.error('Document search failed:', error);
    return [];
  }
}

// Smart keyword detection for when to perform searches
function shouldPerformSearch(content: string): string[] {
  const searchTriggers = [
    // Legal terms
    /regnskapslov(?:en)?|§\s*\d+/gi,
    /revisjonsloven?|revisjonsstandard/gi,
    /ISA\s*\d+|RS\s*\d+/gi,
    /bokføringsloven?/gi,
    /aksjeloven?|allmennaksjeloven?/gi,
    
    // Audit terms
    /intern[e]?\s*kontroll/gi,
    /risikovurdering/gi,
    /vesentlighet/gi,
    /substanstest/gi,
    /kontrolltest/gi,
    
    // Accounting terms
    /regnskapsprinsipp/gi,
    /avskrivning/gi,
    /goodwill/gi,
    /nedskrivning/gi,
    /konsernregnskap/gi
  ];

  const queries: string[] = [];
  for (const trigger of searchTriggers) {
    const matches = content.match(trigger);
    if (matches) {
      queries.push(...matches.map(match => match.trim()));
    }
  }

  return [...new Set(queries)]; // Remove duplicates
}

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
      agentKeys: agents?.map((a: any) => a.key),
      allowBackgroundDocs: settings?.allowBackgroundDocs,
      clientId: context?.clientId
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

    const callOpenAI = async (model: string, messages: any[], opts: any = {}, agentKey?: string): Promise<{ content: string; modelUsed: string; fallbackUsed: boolean; sources?: string[] }> => {
      const primaryModel = model;
      let fallbackUsed = false;

      const tryModel = async (modelName: string, isRetry = false): Promise<string> => {
        const requestBody = { model: modelName, messages, ...opts };
        
        console.log(`🔄 OpenAI ${isRetry ? 'FALLBACK' : 'PRIMARY'} request:`, { 
          model: modelName, 
          messageCount: messages.length, 
          opts: opts,
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
        let content = await tryModel(primaryModel);
        
        // Perform document search if enabled and relevant keywords detected
        let sources: string[] = [];
        if (settings.allowBackgroundDocs && context?.clientId && content) {
          const searchQueries = shouldPerformSearch(content);
          if (searchQueries.length > 0) {
            console.log(`🔍 Agent ${agentKey} triggered search for:`, searchQueries);
            
            for (const query of searchQueries.slice(0, 3)) { // Limit to 3 searches per response
              const searchResults = await performDocumentSearch(supabase, context.clientId, query);
              if (searchResults.length > 0) {
                sources.push(...searchResults.map((r: any) => `${r.file_name}: ${r.summary || 'Relevant dokument'}`));
                
                // Enhance content with search context
                const contextInfo = searchResults.slice(0, 2).map((r: any) => 
                  `[Fra ${r.file_name}]: ${r.summary || r.match_reasons || 'Relevant informasjon'}`
                ).join('\n');
                
                content += `\n\n*Basert på dokumenter: ${contextInfo}*`;
              }
            }
          }
        }
        
        if (content && content.trim() !== '') {
          console.log(`🎉 Suksess med modell: ${primaryModel}`, sources.length > 0 ? `(${sources.length} kilder)` : '');
          return { content, modelUsed: primaryModel, fallbackUsed: false, sources: sources.slice(0, 5) };
        }
        throw new Error('Tomt svar fra modell');
      } catch (error) {
        console.error(`❌ Modell ${primaryModel} feilet:`, error.message);
        throw new Error(`AI-modell utilgjengelig: ${error.message}`);
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
          max_tokens: 150 
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
        max_tokens: Math.max(150, settings.maxTokensPerTurn),
        temperature: 0.7
      }, settings.moderatorKey);
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
          fallbackUsed: modResult.fallbackUsed,
          sources: modResult.sources || []
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
          max_tokens: Math.max(150, settings.maxTokensPerTurn),
          temperature: 0.7
        }, agentKey);
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
          fallbackUsed: agentResult.fallbackUsed,
          sources: agentResult.sources || []
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
          max_tokens: 300,
          temperature: 0.5
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
        max_tokens: 400,
        temperature: 0.5
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