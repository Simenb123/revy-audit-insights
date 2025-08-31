import { logger } from '@/utils/logger';
import { AdvancedContextAnalyzer } from './advancedContextAnalyzer';
import { advancedCacheManager } from './advancedCacheManager';
import type { AgentConfig, DiscussionSettings, TranscriptMessage } from '@/components/AI/MultiAgentStudio/types';
import type { RevyContext } from '@/types/revio';

interface AgentSelectionResult {
  recommendedAgents: AgentConfig[];
  reasoning: string;
  confidence: number;
  contextInsights: any;
}

interface ConversationFlowState {
  currentSpeaker: string;
  nextSpeaker?: string;
  topicFocus: string;
  conversationStage: 'opening' | 'exploration' | 'analysis' | 'synthesis' | 'conclusion';
  participationBalance: Record<string, number>;
  qualityScore: number;
}

interface AgentPerformanceMetrics {
  contributionQuality: number;
  topicRelevance: number;
  collaborationScore: number;
  responseTime: number;
  knowledgeDepth: number;
}

export class IntelligentAgentCoordinator {
  private contextAnalyzer: AdvancedContextAnalyzer;
  private conversationState: ConversationFlowState | null = null;
  private agentMetrics: Map<string, AgentPerformanceMetrics> = new Map();

  constructor() {
    this.contextAnalyzer = new AdvancedContextAnalyzer();
  }

  /**
   * Analyze context and recommend optimal agent configuration
   */
  async recommendAgents(
    topic: string,
    context: RevyContext,
    clientData?: any,
    documentContext?: any
  ): Promise<AgentSelectionResult> {
    const cacheKey = `agent-recommendation-${this.hashInput(topic, context, clientData)}`;
    
    try {
      // Try cache first
      const cached = await advancedCacheManager.get<AgentSelectionResult>(
        cacheKey, 
        'context-analysis'
      );
      if (cached) {
        logger.log('🎯 Agent recommendation from cache');
        return cached;
      }

      // Perform context analysis
      const analysis = await this.contextAnalyzer.analyzeContext({
        currentContext: context,
        userRole: 'employee',
        documentContext,
        clientData,
        sessionHistory: [],
        recentActivity: []
      });

      // Generate agent recommendations based on analysis
      const recommendedAgents = this.selectOptimalAgents(topic, analysis);
      const reasoning = this.generateRecommendationReasoning(analysis, recommendedAgents);
      
      const result: AgentSelectionResult = {
        recommendedAgents,
        reasoning,
        confidence: this.calculateRecommendationConfidence(analysis),
        contextInsights: analysis
      };

      // Cache the result
      await advancedCacheManager.set(cacheKey, result, 'context-analysis');
      
      logger.log(`🤖 Recommended ${recommendedAgents.length} agents for topic: ${topic}`);
      return result;

    } catch (error) {
      logger.error('Agent recommendation failed:', error);
      
      // Fallback to basic recommendation
      return {
        recommendedAgents: this.getDefaultAgents(),
        reasoning: 'Bruker standard agenter på grunn av analysefeil',
        confidence: 0.5,
        contextInsights: null
      };
    }
  }

  /**
   * Coordinate conversation flow and determine next speaker
   */
  determineNextSpeaker(
    transcript: TranscriptMessage[],
    agents: AgentConfig[],
    settings: DiscussionSettings
  ): { nextAgent: AgentConfig; reason: string; priority: 'high' | 'medium' | 'low' } {
    
    // Update conversation state
    this.updateConversationState(transcript, agents);
    
    if (!this.conversationState) {
      return {
        nextAgent: agents.find(a => a.key === settings.moderatorKey) || agents[0],
        reason: 'Moderator starter diskusjonen',
        priority: 'high'
      };
    }

    // Intelligent speaker selection based on multiple factors
    const speakerScores = agents.map(agent => {
      const score = this.calculateSpeakerScore(agent, transcript, this.conversationState!);
      return { agent, score };
    });

    // Sort by score (highest first)
    speakerScores.sort((a, b) => b.score - a.score);
    
    const nextAgent = speakerScores[0].agent;
    const reason = this.generateSpeakerSelectionReason(nextAgent, this.conversationState);
    const priority = this.determineSpeakerPriority(nextAgent, this.conversationState);

    logger.log(`🎭 Next speaker: ${nextAgent.name} (score: ${speakerScores[0].score.toFixed(2)})`);
    
    return { nextAgent, reason, priority };
  }

  /**
   * Analyze conversation quality and suggest improvements
   */
  analyzeConversationQuality(transcript: TranscriptMessage[]): {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    participationBalance: Record<string, number>;
    topicCoverage: string[];
  } {
    const analysis = {
      overallScore: 0,
      strengths: [] as string[],
      improvements: [] as string[],
      participationBalance: {} as Record<string, number>,
      topicCoverage: [] as string[]
    };

    if (transcript.length === 0) return analysis;

    // Calculate participation balance
    const speakerCounts = transcript.reduce((acc, msg) => {
      const speaker = msg.agentName || 'unknown';
      acc[speaker] = (acc[speaker] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalMessages = transcript.length;
    analysis.participationBalance = Object.fromEntries(
      Object.entries(speakerCounts).map(([speaker, count]) => [
        speaker, 
        Math.round((count / totalMessages) * 100)
      ])
    );

    // Analyze conversation quality factors
    const uniqueSpeakers = Object.keys(speakerCounts).length;
    const averageMessageLength = transcript.reduce((sum, msg) => sum + msg.content.length, 0) / totalMessages;
    const hasModeratorControl = transcript.some(msg => msg.agentKey === 'moderator');
    
    // Calculate overall score (0-100)
    let score = 50; // Base score

    // Participation diversity
    if (uniqueSpeakers >= 3) {
      score += 15;
      analysis.strengths.push('God deltakelse fra flere agenter');
    } else {
      analysis.improvements.push('Flere agenter bør delta i diskusjonen');
    }

    // Message quality (length as proxy)
    if (averageMessageLength > 100 && averageMessageLength < 500) {
      score += 10;
      analysis.strengths.push('Balanserte bidragslengder');
    } else if (averageMessageLength <= 100) {
      analysis.improvements.push('Agenter bør gi mer detaljerte svar');
    } else {
      analysis.improvements.push('Agenter bør være mer konsise');
    }

    // Moderator presence
    if (hasModeratorControl) {
      score += 10;
      analysis.strengths.push('Strukturert diskusjon med moderator');
    } else {
      analysis.improvements.push('Mangler moderator for å styre diskusjonen');
    }

    // Topic coverage (simplified analysis)
    const allContent = transcript.map(m => m.content).join(' ').toLowerCase();
    const topics = this.extractTopics(allContent);
    analysis.topicCoverage = topics;
    
    if (topics.length >= 3) {
      score += 10;
      analysis.strengths.push(`Dekker ${topics.length} hovedtemaer`);
    } else {
      analysis.improvements.push('Diskusjonen kunne dekket flere aspekter');
    }

    analysis.overallScore = Math.min(100, Math.max(0, score));
    
    return analysis;
  }

  /**
   * Generate intelligent conversation summary
   */
  async generateIntelligentSummary(
    transcript: TranscriptMessage[],
    originalTopic: string
  ): Promise<{
    executiveSummary: string;
    keyPoints: string[];
    decisions: string[];
    actionItems: string[];
    participantContributions: Record<string, string>;
    followUpTopics: string[];
  }> {
    const cacheKey = `conversation-summary-${this.hashTranscript(transcript)}`;
    
    try {
      const cached = await advancedCacheManager.get<{
        executiveSummary: string;
        keyPoints: string[];
        decisions: string[];
        actionItems: string[];
        participantContributions: Record<string, string>;
        followUpTopics: string[];
      }>(cacheKey, 'ai-responses');
      if (cached) return cached;

      // Generate summary using conversation analysis
      const quality = this.analyzeConversationQuality(transcript);
      
      const summary = {
        executiveSummary: this.generateExecutiveSummary(transcript, originalTopic, quality),
        keyPoints: this.extractKeyPoints(transcript),
        decisions: this.extractDecisions(transcript),
        actionItems: this.extractActionItems(transcript),
        participantContributions: this.summarizeContributions(transcript),
        followUpTopics: this.suggestFollowUpTopics(transcript, originalTopic)
      };

      await advancedCacheManager.set(cacheKey, summary, 'ai-responses');
      return summary;

    } catch (error) {
      logger.error('Summary generation failed:', error);
      
      // Fallback summary
      return {
        executiveSummary: `Diskusjon om ${originalTopic} med ${transcript.length} innlegg fra ulike perspektiver.`,
        keyPoints: ['Diskusjonen dekket flere viktige aspekter'],
        decisions: ['Ingen spesifikke beslutninger identifisert'],
        actionItems: ['Vurder oppfølging basert på diskusjonen'],
        participantContributions: {},
        followUpTopics: ['Fordyp deg i spesifikke aspekter fra diskusjonen']
      };
    }
  }

  // Private helper methods

  private selectOptimalAgents(topic: string, analysis: any): AgentConfig[] {
    const agents: AgentConfig[] = [];
    
    // Always include moderator for structured discussion
    agents.push({
      key: 'moderator',
      name: 'Diskusjonsleder',
      systemPrompt: 'Du er en erfaren diskusjonsleder som holder samtalen strukturert, sikrer at alle får komme til orde, og oppsummerer viktige punkter. Stil oppfølgingsspørsmål og hold fokus på hovedtemaet.',
      model: 'gpt-5-2025-08-07',
      temperature: 0.7,
      dataScopes: ['artikler', 'forskrifter']
    });

    // Add domain-specific agents based on context analysis
    if (analysis.documentInsights?.types?.includes('legal') || topic.toLowerCase().includes('lov')) {
      agents.push({
        key: 'lawyer',
        name: 'Juridisk rådgiver',
        systemPrompt: 'Du er en erfaren jurist med spesialkompetanse innen norsk rett. Analyser juridiske aspekter, referer til relevante lovbestemmelser, og vurder rettslige implikasjoner. Vær presis og faktabasert.',
        model: 'gpt-5-2025-08-07',
        temperature: 0.3,
        dataScopes: ['lover', 'forskrifter', 'rundskriv', 'lovkommentarer']
      });
    }

    if (analysis.documentInsights?.types?.includes('financial') || analysis.primaryContext?.includes('audit')) {
      agents.push({
        key: 'auditor',
        name: 'Revisor',
        systemPrompt: 'Du er en autorisert revisor med bred erfaring innen revisjon og regnskapsføring. Fokuser på internkontroll, risikovurdering, og etterlevelse av revisjonsstandarder. Henvis til ISA-standarder når relevant.',
        model: 'gpt-5-2025-08-07',
        temperature: 0.4,
        dataScopes: ['artikler', 'forskrifter']
      });
    }

    // Add critical thinking perspective
    if (analysis.documentInsights?.complexity === 'high' || agents.length <= 2) {
      agents.push({
        key: 'devils_advocate',
        name: 'Kritisk røst',
        systemPrompt: 'Du stiller kritiske spørsmål, utfordrer antakelser, og peker på potensielle problemer eller svakheter i argumenter. Vær konstruktiv i din kritikk og foreslå alternative løsninger.',
        model: 'gpt-5-mini-2025-08-07',
        temperature: 0.8,
        dataScopes: ['artikler']
      });
    }

    // Add note-taker for comprehensive discussions
    if (agents.length >= 3) {
      agents.push({
        key: 'notetaker',
        name: 'Referent',
        systemPrompt: 'Du oppsummerer viktige punkter fra diskusjonen, holder oversikt over beslutninger og handlingsplaner, og sikrer at ingenting viktig går tapt. Lag strukturerte sammendrag.',
        model: 'gpt-5-mini-2025-08-07',
        temperature: 0.2,
        dataScopes: ['artikler']
      });
    }

    return agents.slice(0, 5); // Limit to max 5 agents for manageable discussions
  }

  private calculateSpeakerScore(
    agent: AgentConfig, 
    transcript: TranscriptMessage[], 
    state: ConversationFlowState
  ): number {
    let score = 0;

    // Participation balance - favor agents who haven't spoken much
    const agentMessages = transcript.filter(m => m.agentKey === agent.key).length;
    const totalMessages = transcript.length;
    const expectedParticipation = totalMessages / Object.keys(state.participationBalance).length;
    
    if (agentMessages < expectedParticipation) {
      score += 20; // Bonus for underrepresented agents
    } else if (agentMessages > expectedParticipation * 1.5) {
      score -= 10; // Penalty for overparticipation
    }

    // Role-specific bonuses based on conversation stage
    switch (state.conversationStage) {
      case 'opening':
        if (agent.key === 'moderator') score += 30;
        break;
      case 'exploration':
        if (agent.key === 'optimist' || agent.key === 'creative') score += 15;
        break;
      case 'analysis':
        if (agent.key === 'auditor' || agent.key === 'lawyer') score += 20;
        break;
      case 'synthesis':
        if (agent.key === 'strategist' || agent.key === 'moderator') score += 15;
        break;
      case 'conclusion':
        if (agent.key === 'notetaker' || agent.key === 'moderator') score += 25;
        break;
    }

    // Recent activity penalty (avoid immediate back-and-forth)
    const lastMessage = transcript[transcript.length - 1];
    if (lastMessage?.agentKey === agent.key) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private updateConversationState(transcript: TranscriptMessage[], agents: AgentConfig[]): void {
    if (transcript.length === 0) {
      this.conversationState = null;
      return;
    }

    const participationBalance = transcript.reduce((acc, msg) => {
      const key = msg.agentKey || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Determine conversation stage based on message count and content
    let stage: ConversationFlowState['conversationStage'] = 'exploration';
    const messageCount = transcript.length;
    
    if (messageCount <= 2) stage = 'opening';
    else if (messageCount <= Math.ceil(agents.length * 1.5)) stage = 'exploration';
    else if (messageCount <= Math.ceil(agents.length * 2.5)) stage = 'analysis';
    else if (messageCount <= Math.ceil(agents.length * 3.5)) stage = 'synthesis';
    else stage = 'conclusion';

    this.conversationState = {
      currentSpeaker: transcript[transcript.length - 1]?.agentKey || '',
      nextSpeaker: undefined,
      topicFocus: this.extractCurrentTopic(transcript),
      conversationStage: stage,
      participationBalance,
      qualityScore: this.calculateCurrentQualityScore(transcript)
    };
  }

  private generateRecommendationReasoning(analysis: any, recommendedAgents: AgentConfig[]): string {
    const reasons = [];
    
    if (analysis.documentInsights?.types?.includes('legal')) {
      reasons.push('Juridisk rådgiver anbefales på grunn av juridisk innhold');
    }
    
    if (analysis.documentInsights?.types?.includes('financial')) {
      reasons.push('Revisor inkludert for finansiell ekspertise');
    }
    
    if (analysis.documentInsights?.complexity === 'high') {
      reasons.push('Kritisk røst lagt til for å utfordre komplekse antakelser');
    }
    
    if (recommendedAgents.some(a => a.key === 'moderator')) {
      reasons.push('Moderator sikrer strukturert diskusjon');
    }

    return reasons.length > 0 
      ? reasons.join('. ') + '.'
      : 'Standard agentsammensetning basert på tema og kontekst.';
  }

  private calculateRecommendationConfidence(analysis: any): number {
    let confidence = 0.6; // Base confidence
    
    if (analysis.contextConfidence > 80) confidence += 0.2;
    if (analysis.documentInsights?.types?.length > 0) confidence += 0.1;
    if (analysis.primaryContext !== 'general') confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  private getDefaultAgents(): AgentConfig[] {
    return [
      {
        key: 'moderator',
        name: 'Diskusjonsleder',
        systemPrompt: 'Du leder diskusjonen og holder fokus på hovedtemaet.',
        model: 'gpt-5-mini-2025-08-07'
      },
      {
        key: 'optimist',
        name: 'Positiv bidragsyter',
        systemPrompt: 'Du fokuserer på muligheter og positive aspekter.',
        model: 'gpt-5-mini-2025-08-07'
      },
      {
        key: 'devils_advocate',
        name: 'Kritisk røst',
        systemPrompt: 'Du stiller kritiske spørsmål og utfordrer antakelser.',
        model: 'gpt-5-mini-2025-08-07'
      }
    ];
  }

  private generateSpeakerSelectionReason(agent: AgentConfig, state: ConversationFlowState): string {
    const roleReasons: Record<string, string> = {
      'moderator': 'Styrer diskusjonen og sikrer struktur',
      'lawyer': 'Bidrar med juridisk ekspertise',
      'auditor': 'Gir revisjonsfaglig perspektiv',
      'devils_advocate': 'Utfordrer antakelser og stiller kritiske spørsmål',
      'notetaker': 'Oppsummerer og strukturerer hovedpunkter',
      'optimist': 'Fokuserer på muligheter og positive aspekter'
    };

    const baseReason = roleReasons[agent.key as string] || `${agent.name} bidrar med sitt perspektiv`;
    const stageReason = ` (${state.conversationStage}-fase)`;
    
    return baseReason + stageReason;
  }

  private determineSpeakerPriority(agent: AgentConfig, state: ConversationFlowState): 'high' | 'medium' | 'low' {
    if (agent.key === 'moderator' && state.conversationStage === 'opening') return 'high';
    if (agent.key === 'notetaker' && state.conversationStage === 'conclusion') return 'high';
    if (state.participationBalance[agent.key as string] < 2) return 'medium';
    return 'low';
  }

  // Simplified helper methods for text analysis
  private extractTopics(content: string): string[] {
    const commonTopics = [
      'risiko', 'kontroll', 'etterlevelse', 'regnskapsføring', 'revisjon',
      'juridisk', 'lover', 'forskrifter', 'dokumentasjon', 'kvalitetssikring'
    ];
    
    return commonTopics.filter(topic => 
      content.includes(topic.toLowerCase())
    );
  }

  private extractCurrentTopic(transcript: TranscriptMessage[]): string {
    if (transcript.length === 0) return 'generell diskusjon';
    
    const recentMessages = transcript.slice(-3).map(m => m.content).join(' ');
    const topics = this.extractTopics(recentMessages.toLowerCase());
    
    return topics[0] || 'generell diskusjon';
  }

  private calculateCurrentQualityScore(transcript: TranscriptMessage[]): number {
    if (transcript.length === 0) return 0;
    
    const avgLength = transcript.reduce((sum, m) => sum + m.content.length, 0) / transcript.length;
    const uniqueSpeakers = new Set(transcript.map(m => m.agentKey)).size;
    
    let score = 50;
    if (avgLength > 100 && avgLength < 400) score += 20;
    if (uniqueSpeakers >= 3) score += 20;
    if (transcript.length >= 5) score += 10;
    
    return Math.min(100, score);
  }

  private generateExecutiveSummary(
    transcript: TranscriptMessage[], 
    originalTopic: string, 
    quality: any
  ): string {
    const participantCount = Object.keys(quality.participationBalance).length;
    const messageCount = transcript.length;
    
    return `Diskusjon om ${originalTopic} med ${participantCount} deltakere og ${messageCount} innlegg. ` +
           `Kvalitetsvurdering: ${quality.overallScore}/100. ` +
           `Hovedtemaer dekket: ${quality.topicCoverage.join(', ') || 'generelle aspekter'}.`;
  }

  private extractKeyPoints(transcript: TranscriptMessage[]): string[] {
    // Simplified key point extraction
    return transcript
      .filter(msg => msg.content.length > 100)
      .map(msg => msg.content.split('.')[0] + '.')
      .slice(0, 5);
  }

  private extractDecisions(transcript: TranscriptMessage[]): string[] {
    const decisionKeywords = ['besluttet', 'konkludert', 'enige om', 'vedtak'];
    return transcript
      .filter(msg => 
        decisionKeywords.some(keyword => 
          msg.content.toLowerCase().includes(keyword)
        )
      )
      .map(msg => msg.content.split('.')[0] + '.')
      .slice(0, 3);
  }

  private extractActionItems(transcript: TranscriptMessage[]): string[] {
    const actionKeywords = ['må', 'bør', 'skal', 'neste steg', 'oppfølging'];
    return transcript
      .filter(msg => 
        actionKeywords.some(keyword => 
          msg.content.toLowerCase().includes(keyword)
        )
      )
      .map(msg => msg.content.split('.')[0] + '.')
      .slice(0, 4);
  }

  private summarizeContributions(transcript: TranscriptMessage[]): Record<string, string> {
    const contributions: Record<string, string> = {};
    
    transcript.forEach(msg => {
      const speaker = msg.agentName || 'Ukjent';
      if (!contributions[speaker]) {
        contributions[speaker] = msg.content.substring(0, 150) + '...';
      }
    });
    
    return contributions;
  }

  private suggestFollowUpTopics(transcript: TranscriptMessage[], originalTopic: string): string[] {
    const topics = this.extractTopics(transcript.map(m => m.content).join(' '));
    return [
      `Dypere analyse av ${originalTopic}`,
      ...topics.map(topic => `Utforsk ${topic} aspektet nærmere`),
      'Implementering av diskuterte løsninger',
      'Risikovurdering av foreslåtte tiltak'
    ].slice(0, 4);
  }

  private hashInput(...inputs: any[]): string {
    return btoa(JSON.stringify(inputs)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private hashTranscript(transcript: TranscriptMessage[]): string {
    const content = transcript.map(m => m.content).join('|');
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }
}

export const intelligentAgentCoordinator = new IntelligentAgentCoordinator();