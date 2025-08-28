import React from 'react';
import {
  Bot,
  Scale,
  Sparkles,
  ShieldAlert,
  Gavel,
  Target,
  Brain,
  Lightbulb,
  Shield,
} from 'lucide-react';
import { AgentConfig } from './types';

export const GPT5_MODELS = [
  'gpt-5-nano-2025-08-07',
  'gpt-5-mini-2025-08-07',
  'gpt-5-2025-08-07',
];

export const DEFAULT_AGENT_ROLES: AgentConfig[] = [
  {
    key: 'moderator',
    name: 'Moderator',
    icon: React.createElement(Scale, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du er moderator. Oppsummer kort idéen, sett spilleregler (kort, presis, respektfull), fordel talere dynamisk per runde, og oppsummer kort.',
    model: 'gpt-5-mini-2025-08-07',
    temperature: null,
    dataScopes: [],
  },
  {
    key: 'optimist',
    name: 'Optimist',
    icon: React.createElement(Sparkles, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du er optimist. Løft frem muligheter, quick wins, og lavthengende frukter. Vær konkret og handlingsorientert.',
    model: 'gpt-5-mini-2025-08-07',
    temperature: null,
    dataScopes: ['artikler'],
  },
  {
    key: 'devils_advocate',
    name: 'Djevelens advokat',
    icon: React.createElement(ShieldAlert, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du er kritisk og stiller vanskelige spørsmål. Identifiser risiko, antakelser og fallgruver. Foreslå tester som falsifiserer hypoteser.',
    model: 'gpt-5-mini-2025-08-07',
    temperature: null,
    dataScopes: ['artikler'],
  },
  {
    key: 'lawyer',
    name: 'Advokat',
    icon: React.createElement(Gavel, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du er advokat. Vurder juss, personvern (GDPR), kontrakter og ansvar. Snakk som en advokat: presis, forbehold ved usikkerhet.',
    model: 'gpt-5-2025-08-07',
    temperature: null,
    dataScopes: ['lover','forskrifter','rundskriv','lovkommentarer','artikler'],
  },
  {
    key: 'auditor',
    name: 'Revisor',
    icon: React.createElement(Target, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du er revisor. Bruk ISA/RS-tenkning: vesentlighet, risiko, kontroller, bevis. Foreslå konkrete revisjonshandlinger.',
    model: 'gpt-5-mini-2025-08-07',
    temperature: null,
    dataScopes: ['artikler'],
  },
  {
    key: 'engineer',
    name: 'IT-utvikler',
    icon: React.createElement(Brain, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du er utvikler. Foreslå teknisk arkitektur, datamodeller, APIer og tradeoffs. Kort og pragmatisk.',
    model: 'gpt-5-mini-2025-08-07',
    temperature: null,
    dataScopes: [],
  },
  {
    key: 'creative',
    name: 'Kreativ',
    icon: React.createElement(Lightbulb, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du er kreativ idé-maker. Kom med utradisjonelle vinkler, navn, pitch-lines og visuelle konsepter.',
    model: 'gpt-5-mini-2025-08-07',
    temperature: null,
    dataScopes: ['artikler'],
  },
  {
    key: 'user_rep',
    name: 'Forbruker/bruker',
    icon: React.createElement(Bot, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du representerer sluttbruker. Fokuser på nytte, enkelhet og tillit. Hva vil forvirre eller glede?',
    model: 'gpt-5-mini-2025-08-07',
    temperature: null,
    dataScopes: [],
  },
  {
    key: 'strategist',
    name: 'Strateg',
    icon: React.createElement(Shield, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du er strateg. Marked, posisjonering, budsjettrammer, risiko/avkastning. Prioriter neste steg.',
    model: 'gpt-5-mini-2025-08-07',  
    temperature: null,
    dataScopes: ['artikler'],
  },
  {
    key: 'notetaker',
    name: 'Referent',
    icon: React.createElement(Bot, { className: 'h-3.5 w-3.5' }),
    systemPrompt:
      'Du tar notater. Ikke delta i debatt. Lever til slutt: sammendrag, beslutninger, åpne spørsmål, neste steg.',
    model: 'gpt-5-mini-2025-08-07',
    temperature: null,
    dataScopes: [],
  },
];