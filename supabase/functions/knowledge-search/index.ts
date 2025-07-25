import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../../src/integrations/supabase/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeSearchRequest {
  query: string;
}

interface SearchArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  reference_code: string | null;
  view_count: number | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  similarity?: number;
  category?: { name: string; id: string } | null;
}

// Norwegian audit terminology mapping for better search
const norwegianAuditTerms: Record<string, string[]> = {
  'revisjon': ['audit', 'kontroll', 'gjennomgang', 'vurdering'],
  'revisor': ['auditor', 'kontrollør'],
  'inntekter': ['revenue', 'omsetning', 'salg', 'inntekt'],
  'kostnader': ['expenses', 'utgifter', 'kostnad'],
  'balanse': ['balance', 'balanceføring', 'balanseposter'],
  'vesentlighet': ['materiality', 'materialitet', 'vesentlig'],
  'risiko': ['risk', 'fare', 'usikkerhet'],
  'kontroll': ['control', 'styring', 'kontrollsystem'],
  'bekreftelse': ['confirmation', 'bekrefting', 'stadfesting'],
  'dokumentasjon': ['documentation', 'dokumenter', 'bevis'],
  'vurdering': ['assessment', 'evaluering', 'bedømmelse'],
  'isa': ['international standards on auditing', 'revisjonsstandard'],
  'tilsyn': ['supervision', 'overvåking', 'kontroll'],
  'kvalitet': ['quality', 'kvalitetssikring', 'kvalitetskontroll'],
  'uavhengighet': ['independence', 'selvstendighet', 'objektivitet'],
  'rapportering': ['reporting', 'rapport', 'beretning'],
  'regnskapsføring': ['accounting', 'bokføring', 'regnskap'],
  'misligheter': ['fraud', 'bedrageri', 'underslag'],
  'fortsatt drift': ['going concern', 'fortsettelse', 'levedyktighet'],
  'ledelse': ['management', 'styring', 'administrasjon'],
  'forsiktighet': ['prudence', 'konservatisme', 'forsiktighetsprinsipp'],
  'periodisering': ['accrual', 'periodisering', 'avgrensning'],
  'regnskapsprinsipper': ['accounting principles', 'regnskapsstandarder'],
  'internkontroll': ['internal control', 'intern kontroll', 'kontrollsystem'],
  'årsregnskap': ['annual accounts', 'årsrapport', 'regnskap'],
  'sammenligningstall': ['comparative figures', 'fjorårstall', 'sammenligning'],
  'noteopplysninger': ['notes', 'noter', 'tilleggsopplysninger'],
  'utvalgte undersøkelser': ['substantive procedures', 'substanshandlinger'],
  'kontrollhandlinger': ['control procedures', 'kontrollprosedyrer'],
  'bekreftelseshandlinger': ['confirmations', 'bekreftelser'],
  'observasjon': ['observation', 'observering', 'iakttakelse'],
  'gjennomgang': ['review', 'oversikt', 'analyse'],
  'analyse': ['analysis', 'analytisk gjennomgang'],
  'estimater': ['estimates', 'skjønn', 'estimering'],
  'avsetninger': ['provisions', 'avsetning', 'reservering'],
  'nedskrivninger': ['impairment', 'nedskrivning', 'verdifall'],
  'goodwill': ['goodwill', 'merverdi', 'immaterielle eiendeler'],
  'leasingavtaler': ['leases', 'leasing', 'leieavtaler'],
  'finansielle instrumenter': ['financial instruments', 'finansielle eiendeler'],
  'derivater': ['derivatives', 'finansielle derivater'],
  'sikring': ['hedging', 'sikringsregnskapsføring'],
  'segmentrapportering': ['segment reporting', 'segmenter'],
  'nærstående parter': ['related parties', 'nærstående', 'interesseforbindelser'],
  'hendelser etter balansedagen': ['subsequent events', 'etterfølgende hendelser'],
  'betinget utfall': ['contingencies', 'betingede forpliktelser'],
  'skattemessige forhold': ['tax matters', 'skatt', 'skatteposisjon'],
  'utsatt skatt': ['deferred tax', 'utsatt skattekostnad'],
  'avskrivninger': ['depreciation', 'avskrivning', 'verdifall'],
  'varelager': ['inventory', 'beholdning', 'lager'],
  'kundefordringer': ['accounts receivable', 'fordringer', 'kunder'],
  
  // CRITICAL: Legal and tax terms for Norwegian law searches
  'skatteloven': ['skattelov', 'skatteregler', 'tax law', 'income tax act', 'inntektsskatt', 'skatt', 'skattelovgivning'],
  'skattelov': ['skatteloven', 'skatteregler', 'tax law', 'income tax act', 'inntektsskatt', 'skattelovgivning'],
  'mvaloven': ['mva-loven', 'merverdiavgiftsloven', 'vat act', 'merverdiavgift', 'moms', 'avgift'],
  'merverdiavgiftsloven': ['mvaloven', 'mva-loven', 'vat act', 'merverdiavgift', 'moms', 'avgift'],
  'mva': ['merverdiavgift', 'mvaloven', 'mva-loven', 'vat', 'moms', 'avgift'],
  'merverdiavgift': ['mva', 'mvaloven', 'mva-loven', 'vat', 'moms', 'avgift'],
  'skatt': ['skatteloven', 'skatteregler', 'beskatning', 'tax', 'inntektsskatt'],
  'avgift': ['mva', 'merverdiavgift', 'mvaloven', 'tax', 'skatt', 'gebyr'],
  'lov': ['lover', 'lovgivning', 'regelverk', 'forskrift', 'bestemmelser', 'paragraf'],
  'lover': ['lov', 'lovgivning', 'regelverk', 'forskrift', 'bestemmelser'],
  'forskrift': ['forskrifter', 'regelverk', 'bestemmelser', 'lov', 'regler'],
  'paragraf': ['§', 'bestemmelse', 'regel', 'lovparagraf'],
  'leverandørgjeld': ['accounts payable', 'leverandører', 'kreditorgjeld'],
  'finanskostnader': ['finance costs', 'rentekostnader', 'finansiering'],
  'årslønn': ['annual salary', 'lønn', 'personalkostnader'],
  'pensjonsforpliktelser': ['pension obligations', 'pensjon', 'ytelsesordninger'],
  'opsjoner': ['options', 'aksjeopsjoner', 'insentivordninger'],
  'utbytter': ['dividends', 'utbytte', 'utdelinger'],
  'egenkapital': ['equity', 'egenkapital', 'aksjekapital'],
  'gjeld': ['debt', 'lån', 'forpliktelser'],
  'likviditet': ['liquidity', 'likviditetsgrad', 'betalingsevne'],
  'soliditet': ['solvency', 'soliditetsgrad', 'egenkapitalandel'],
  'rentabilitet': ['profitability', 'lønnsomhet', 'avkastning'],
  'arbeidskapital': ['working capital', 'driftskapital', 'omløpsmidler'],
  'kontantstrøm': ['cash flow', 'kontantstrøm', 'likviditetsstrøm'],
  'investeringer': ['investments', 'investering', 'kapitalinvesteringer'],
  'avkastning': ['return', 'avkastning', 'utbytte'],
  'budsjett': ['budget', 'budsjettering', 'planlegging'],
  'prognose': ['forecast', 'prognostisering', 'fremskrivning'],
  'måltall': ['targets', 'mål', 'målsetninger'],
  'nøkkeltall': ['key figures', 'nøkkeltall', 'hovedtall'],
  'benchmarking': ['benchmarking', 'sammenligning', 'referanseverdier'],
  'styring': ['governance', 'styring', 'ledelse'],
  'strategi': ['strategy', 'strategisk', 'strategiutvikling'],
  'forretningsmodell': ['business model', 'forretningskonsept'],
  'verdiskapning': ['value creation', 'verdiskaping', 'merverdi'],
  'bærekraft': ['sustainability', 'bærekraftig', 'miljømessig'],
  'esg': ['environmental social governance', 'miljø sosial styring'],
  'compliance': ['compliance', 'etterlevelse', 'regelverksoverholdelse'],
  'risikostyring': ['risk management', 'risikohåndtering', 'risikokontroll'],
  'intern revisjon': ['internal audit', 'internrevisjon', 'internkontroll'],
  'whistleblowing': ['whistleblowing', 'varslingsordning', 'varsling'],
  'datasikkerhet': ['data security', 'informasjonssikkerhet', 'cybersikkerhet'],
  'personvern': ['privacy', 'personvern', 'gdpr'],
  'digitalisering': ['digitalization', 'digital transformasjon', 'teknologi'],
  'automatisering': ['automation', 'automatisering', 'robotisering'],
  'kunstig intelligens': ['artificial intelligence', 'ai', 'maskinlæring'],
  'blockchain': ['blockchain', 'blokkjede', 'distribuert hovedbok'],
  'cybersikkerhet': ['cybersecurity', 'it-sikkerhet', 'informasjonssikkerhet'],
  'cloud': ['cloud computing', 'skytjenester', 'datalagring'],
  'big data': ['big data', 'store datamengder', 'dataanalyse'],
  'analytics': ['analytics', 'analyse', 'datavitenskap'],
  'dashboard': ['dashboard', 'instrumentpanel', 'rapportering'],
  'kpi': ['key performance indicators', 'nøkkeltall', 'prestasjonsindikatorer'],
  'bi': ['business intelligence', 'forretningsintelligens', 'analyse'],
  'erp': ['enterprise resource planning', 'forretningssystem', 'system'],
  'crm': ['customer relationship management', 'kundebehandling', 'kunderelasjoner'],
  'scm': ['supply chain management', 'forsyningskjede', 'logistikk'],
  'lean': ['lean management', 'lean', 'effektivisering'],
  'six sigma': ['six sigma', 'kvalitetsutvikling', 'prosessforbedring'],
  'agile': ['agile', 'smidig', 'iterativ'],
  'scrum': ['scrum', 'smidig utvikling', 'teamarbeid'],
  'devops': ['devops', 'utvikling drift', 'systemutvikling'],
  'kontinuerlig forbedring': ['continuous improvement', 'kaizen', 'forbedring'],
  'innovasjon': ['innovation', 'innovasjon', 'nyskaping'],
  'produktutvikling': ['product development', 'produktutvikling', 'innovasjon'],
  'markedsføring': ['marketing', 'markedsføring', 'salg'],
  'kundeservice': ['customer service', 'kundeservice', 'kundestøtte'],
  'hr': ['human resources', 'personalledelse', 'menneskeressurser'],
  'rekruttering': ['recruitment', 'rekruttering', 'ansettelse'],
  'kompetanseutvikling': ['competence development', 'opplæring', 'utvikling'],
  'ledelse': ['leadership', 'lederskap', 'ledelse'],
  'organisasjonsutvikling': ['organizational development', 'organisasjonsutvikling'],
  'endringsledelse': ['change management', 'endringsledelse', 'omstilling'],
  'prosjektledelse': ['project management', 'prosjektledelse', 'prosjekt'],
  'programledelse': ['program management', 'programledelse', 'program'],
  'porteføljeledelse': ['portfolio management', 'porteføljeledelse', 'portefølje'],
  'kommunikasjon': ['communication', 'kommunikasjon', 'informasjon'],
  'presentasjon': ['presentation', 'presentasjon', 'fremføring'],
  'rapportering': ['reporting', 'rapportering', 'rapport'],
  'dokumentasjon': ['documentation', 'dokumentasjon', 'dokumenter'],
  'arkivering': ['archiving', 'arkivering', 'oppbevaring'],
  'oppfølging': ['follow-up', 'oppfølging', 'kontroll'],
  'overvåking': ['monitoring', 'overvåking', 'kontroll'],
  'måling': ['measurement', 'måling', 'evaluering'],
  'analyse': ['analysis', 'analyse', 'undersøkelse'],
  'evaluering': ['evaluation', 'evaluering', 'vurdering'],
  'implementering': ['implementation', 'implementering', 'gjennomføring'],
  'planlegging': ['planning', 'planlegging', 'plan'],
  'prioritering': ['prioritization', 'prioritering', 'prioritet'],
  'ressursallokering': ['resource allocation', 'ressursfordeling', 'ressurser'],
  'budsjettering': ['budgeting', 'budsjettering', 'budsjett'],
  'kostnadskontroll': ['cost control', 'kostnadskontroll', 'kostnadsstyring'],
  'inntjening': ['earnings', 'inntjening', 'fortjeneste'],
  'margin': ['margin', 'margin', 'avanse'],
  'dekningsbidrag': ['contribution margin', 'dekningsbidrag', 'bidrag'],
  'break-even': ['break-even', 'nullpunkt', 'dekningspunkt'],
  'roi': ['return on investment', 'avkastning på investering', 'rentabilitet'],
  'npv': ['net present value', 'netto nåverdi', 'nåverdi'],
  'irr': ['internal rate of return', 'intern rente', 'rentabilitet'],
  'payback': ['payback period', 'tilbakebetalingstid', 'nedbetalingstid'],
  'sensitivitetsanalyse': ['sensitivity analysis', 'sensitivitetsanalyse', 'følsomhetsanalyse'],
  'scenarioanalyse': ['scenario analysis', 'scenarioanalyse', 'scenario'],
  'stress testing': ['stress testing', 'stresstesting', 'stresstest'],
  'monte carlo': ['monte carlo simulation', 'monte carlo', 'simulering'],
  'optimalisering': ['optimization', 'optimalisering', 'forbedring'],
  'effektivisering': ['efficiency', 'effektivisering', 'effektivitet'],
  'produktivitet': ['productivity', 'produktivitet', 'ytelse'],
  'kvalitet': ['quality', 'kvalitet', 'kvalitetssikring'],
  'tilfredshet': ['satisfaction', 'tilfredshet', 'fornøydhet'],
  'lojalitet': ['loyalty', 'lojalitet', 'trofasthet'],
  'merkevare': ['brand', 'merkevare', 'branding'],
  'omdømme': ['reputation', 'omdømme', 'rykte'],
  'tillit': ['trust', 'tillit', 'troverdighet'],
  'transparens': ['transparency', 'åpenhet', 'gjennomsiktighet'],
  'ansvarlighet': ['accountability', 'ansvar', 'ansvarlighet'],
  'etikk': ['ethics', 'etikk', 'moral'],
  'integritet': ['integrity', 'integritet', 'ærlighet'],
  'profesjonalitet': ['professionalism', 'profesjonalitet', 'faglig'],
  'kompetanse': ['competence', 'kompetanse', 'ferdighet'],
  'ekspertise': ['expertise', 'ekspertise', 'spesialkunnskap'],
  'erfaring': ['experience', 'erfaring', 'praksis'],
  'kunnskap': ['knowledge', 'kunnskap', 'viten'],
  'læring': ['learning', 'læring', 'opplæring'],
  'utvikling': ['development', 'utvikling', 'forbedring'],
  'vekst': ['growth', 'vekst', 'utvikling'],
  'ekspansjon': ['expansion', 'ekspansjon', 'utvidelse'],
  'internasjonalisering': ['internationalization', 'internasjonalisering', 'global'],
  'global': ['global', 'global', 'verdensomspennende'],
  'lokal': ['local', 'lokal', 'regional'],
  'nasjonal': ['national', 'nasjonal', 'norsk'],
  'regional': ['regional', 'regional', 'område'],
  'sentralisering': ['centralization', 'sentralisering', 'sentralt'],
  'desentralisering': ['decentralization', 'desentralisering', 'lokalt'],
  'outsourcing': ['outsourcing', 'utkontraktering', 'ekstern'],
  'insourcing': ['insourcing', 'internalisering', 'intern'],
  'partnering': ['partnering', 'partnerskap', 'samarbeid'],
  'allianser': ['alliances', 'allianser', 'strategiske partnerskap'],
  'joint venture': ['joint venture', 'fellesforetak', 'samarbeid'],
  'oppkjøp': ['acquisition', 'oppkjøp', 'overtakelse'],
  'fusjon': ['merger', 'fusjon', 'sammenslåing'],
  'divestering': ['divestment', 'salg', 'avhendelse'],
  'spin-off': ['spin-off', 'utskillelse', 'avknopning'],
  'restrukturering': ['restructuring', 'restrukturering', 'omorganisering'],
  'nedbemanninger': ['downsizing', 'nedbemanninger', 'reduksjon'],
  'oppsigelser': ['layoffs', 'oppsigelser', 'permittering'],
  'omstilling': ['transformation', 'omstilling', 'endring'],
  'modernisering': ['modernization', 'modernisering', 'oppgradering'],
  'forbedring': ['improvement', 'forbedring', 'utvikling'],
  'nytenkning': ['innovation', 'nytenkning', 'kreativitet'],
  'kreativitet': ['creativity', 'kreativitet', 'skaperkraft'],
  'problemløsning': ['problem solving', 'problemløsning', 'løsning'],
  'beslutning': ['decision', 'beslutning', 'avgjørelse'],
  'beslutningsprosess': ['decision process', 'beslutningsprosess', 'prosess'],
  'delegering': ['delegation', 'delegering', 'fullmakt'],
  'bemyndigelse': ['empowerment', 'bemyndigelse', 'myndighet'],
  'autonomi': ['autonomy', 'autonomi', 'selvstendighet'],
  'fleksibilitet': ['flexibility', 'fleksibilitet', 'smidighet'],
  'tilpasning': ['adaptation', 'tilpasning', 'justering'],
  'respons': ['response', 'respons', 'reaksjon'],
  'feedback': ['feedback', 'tilbakemelding', 'respons'],
  'kommunikasjon': ['communication', 'kommunikasjon', 'dialog'],
  'forhandling': ['negotiation', 'forhandling', 'dialog'],
  'konfliktløsning': ['conflict resolution', 'konfliktløsning', 'megling'],
  'mediering': ['mediation', 'mediering', 'megling'],
  'arbitrasje': ['arbitration', 'voldgift', 'dom'],
  'rettssak': ['litigation', 'rettssak', 'søksmål'],
  'juridisk': ['legal', 'juridisk', 'rettslig'],
  'regelverk': ['regulations', 'regelverk', 'bestemmelser'],
  'lovgivning': ['legislation', 'lovgivning', 'lov'],
  'forskrift': ['regulation', 'forskrift', 'bestemmelse'],
  'standard': ['standard', 'standard', 'norm'],
  'beste praksis': ['best practice', 'beste praksis', 'praksis'],
  'benchmarking': ['benchmarking', 'sammenligning', 'referanse'],
  'måling': ['measurement', 'måling', 'evaluering'],
  'prestasjon': ['performance', 'prestasjon', 'ytelse'],
  'effektivitet': ['effectiveness', 'effektivitet', 'virkning'],
  'produktivitet': ['productivity', 'produktivitet', 'ytelse'],
  'kvalitet': ['quality', 'kvalitet', 'standard'],
  'service': ['service', 'service', 'tjeneste'],
  'kunde': ['customer', 'kunde', 'klient'],
  'klient': ['client', 'klient', 'kunde'],
  'leverandør': ['supplier', 'leverandør', 'tilbyder'],
  'partner': ['partner', 'partner', 'samarbeidspart'],
  'interessent': ['stakeholder', 'interessent', 'aktør'],
  'eier': ['owner', 'eier', 'aksjonær'],
  'aksjonær': ['shareholder', 'aksjonær', 'eier'],
  'investor': ['investor', 'investor', 'kapitalforvalter'],
  'kreditor': ['creditor', 'kreditor', 'långiver'],
  'debitor': ['debtor', 'debitor', 'låntaker'],
  'banker': ['bank', 'bank', 'finansinstitusjon'],
  'finansiering': ['financing', 'finansiering', 'kapital'],
  'kapital': ['capital', 'kapital', 'midler'],
  'investering': ['investment', 'investering', 'kapitalplassering'],
  'avkastning': ['return', 'avkastning', 'utbytte'],
  'risiko': ['risk', 'risiko', 'usikkerhet'],
  'sikkerhet': ['security', 'sikkerhet', 'trygghet'],
  'forsikring': ['insurance', 'forsikring', 'dekning'],
  'garanti': ['warranty', 'garanti', 'sikkerhet'],
  'kontrakt': ['contract', 'kontrakt', 'avtale'],
  'avtale': ['agreement', 'avtale', 'kontrakt'],
  'forpliktelse': ['obligation', 'forpliktelse', 'ansvar'],
  'rettighet': ['right', 'rettighet', 'krav'],
  'krav': ['claim', 'krav', 'fordring'],
  'fordringsrett': ['receivable', 'fordring', 'tilgodehavende'],
  'gjeld': ['debt', 'gjeld', 'forpliktelse'],
  'lån': ['loan', 'lån', 'kreditt'],
  'kreditt': ['credit', 'kreditt', 'lån'],
  'rente': ['interest', 'rente', 'rentesats'],
  'utlån': ['lending', 'utlån', 'kreditt'],
  'innlån': ['deposit', 'innlån', 'innskudd'],
  'likviditet': ['liquidity', 'likviditet', 'betalingsevne'],
  'solvens': ['solvency', 'solvens', 'betalingsevne'],
  'soliditet': ['solvency', 'soliditet', 'egenkapitalandel'],
  'gearing': ['gearing', 'gearing', 'gjeldsgrad'],
  'leverage': ['leverage', 'giring', 'belåning'],
  'volatilitet': ['volatility', 'volatilitet', 'svingninger'],
  'korrelasjon': ['correlation', 'korrelasjon', 'sammenheng'],
  'diversifisering': ['diversification', 'diversifisering', 'spredning'],
  'konsentrasjon': ['concentration', 'konsentrasjon', 'fokusering'],
  'portefølje': ['portfolio', 'portefølje', 'samling'],
  'allokering': ['allocation', 'allokering', 'fordeling'],
  'optimalisering': ['optimization', 'optimalisering', 'forbedring'],
  'maksimering': ['maximization', 'maksimering', 'økning'],
  'minimering': ['minimization', 'minimering', 'reduksjon'],
  'balanse': ['balance', 'balanse', 'likevekt'],
  'stabilitet': ['stability', 'stabilitet', 'ro'],
  'kontinuitet': ['continuity', 'kontinuitet', 'sammenheng'],
  'bærekraft': ['sustainability', 'bærekraft', 'holdbarhet'],
  'miljø': ['environment', 'miljø', 'omgivelser'],
  'sosialt': ['social', 'sosialt', 'samfunnsmessig'],
  'ansvar': ['responsibility', 'ansvar', 'ansvarlighet'],
  'samfunnsansvar': ['corporate social responsibility', 'samfunnsansvar', 'csr'],
  'etikk': ['ethics', 'etikk', 'moral'],
  'verdier': ['values', 'verdier', 'prinsipper'],
  'kultur': ['culture', 'kultur', 'væremåte'],
  'holdninger': ['attitudes', 'holdninger', 'innstilling'],
  'adferd': ['behavior', 'adferd', 'oppførsel'],
  'motivasjon': ['motivation', 'motivasjon', 'drivkraft'],
  'engasjement': ['engagement', 'engasjement', 'involvering'],
  'deltakelse': ['participation', 'deltakelse', 'medvirkning'],
  'innflytelse': ['influence', 'innflytelse', 'påvirkning'],
  'makt': ['power', 'makt', 'innflytelse'],
  'autoritet': ['authority', 'autoritet', 'myndighet'],
  'legitimitet': ['legitimacy', 'legitimitet', 'rettmessighet'],
  'aksept': ['acceptance', 'aksept', 'godkjenning'],
  'støtte': ['support', 'støtte', 'backing'],
  'motstand': ['resistance', 'motstand', 'opposisjon'],
  'konflikt': ['conflict', 'konflikt', 'uenighet'],
  'samarbeid': ['cooperation', 'samarbeid', 'kollaborasjon'],
  'teamarbeid': ['teamwork', 'teamarbeid', 'gruppearbeid'],
  'synergi': ['synergy', 'synergi', 'samvirke'],
  'koordinering': ['coordination', 'koordinering', 'samordning'],
  'integrasjon': ['integration', 'integrasjon', 'sammenkobling'],
  'differensiering': ['differentiation', 'differensiering', 'skille'],
  'spesialisering': ['specialization', 'spesialisering', 'fokusering'],
  'standardisering': ['standardization', 'standardisering', 'uniformering'],
  'sentralisering': ['centralization', 'sentralisering', 'samling'],
  'desentralisering': ['decentralization', 'desentralisering', 'spredning'],
  'hierarki': ['hierarchy', 'hierarki', 'rangordning'],
  'struktur': ['structure', 'struktur', 'organisering'],
  'prosess': ['process', 'prosess', 'fremgangsmåte'],
  'system': ['system', 'system', 'helhet'],
  'metode': ['method', 'metode', 'fremgangsmåte'],
  'teknikk': ['technique', 'teknikk', 'metode'],
  'verktøy': ['tool', 'verktøy', 'instrument'],
  'teknologi': ['technology', 'teknologi', 'teknikk'],
  'digital': ['digital', 'digital', 'elektronisk'],
  'automatisering': ['automation', 'automatisering', 'maskinisering'],
  'robotisering': ['robotization', 'robotisering', 'automatisering'],
  'ai': ['artificial intelligence', 'kunstig intelligens', 'maskinlæring'],
  'maskinlæring': ['machine learning', 'maskinlæring', 'ai'],
  'algoritme': ['algorithm', 'algoritme', 'beregning'],
  'data': ['data', 'data', 'informasjon'],
  'informasjon': ['information', 'informasjon', 'data'],
  'analyse': ['analysis', 'analyse', 'undersøkelse'],
  'statistikk': ['statistics', 'statistikk', 'tall'],
  'modell': ['model', 'modell', 'representasjon'],
  'simulering': ['simulation', 'simulering', 'modellering'],
  'prediksjon': ['prediction', 'prediksjon', 'forutsigelse'],
  'prognose': ['forecast', 'prognose', 'fremskrivning'],
  'trend': ['trend', 'trend', 'utvikling'],
  'mønster': ['pattern', 'mønster', 'struktur'],
  'korrelasjon': ['correlation', 'korrelasjon', 'sammenheng'],
  'kausalitet': ['causality', 'kausalitet', 'årsakssammenheng'],
  'variasjon': ['variation', 'variasjon', 'endring'],
  'avvik': ['deviation', 'avvik', 'forskjell'],
  'anomali': ['anomaly', 'anomali', 'avvik'],
  'outlier': ['outlier', 'avviker', 'ekstremverdi'],
  'normalitet': ['normality', 'normalitet', 'standard'],
  'distribusjon': ['distribution', 'distribusjon', 'fordeling'],
  'gjennomsnitt': ['average', 'gjennomsnitt', 'middel'],
  'median': ['median', 'median', 'midtverdi'],
  'modus': ['mode', 'modus', 'hyppigste'],
  'varians': ['variance', 'varians', 'spredning'],
  'standardavvik': ['standard deviation', 'standardavvik', 'spredning'],
  'konfidensintervall': ['confidence interval', 'konfidensintervall', 'sikkerhet'],
  'signifikans': ['significance', 'signifikans', 'betydning'],
  'hypotese': ['hypothesis', 'hypotese', 'antakelse'],
  'test': ['test', 'test', 'prøve'],
  'validering': ['validation', 'validering', 'bekreftelse'],
  'verifisering': ['verification', 'verifisering', 'kontroll'],
  'kvalitetssikring': ['quality assurance', 'kvalitetssikring', 'kvalitet'],
  'kvalitetskontroll': ['quality control', 'kvalitetskontroll', 'kontroll'],
  'testing': ['testing', 'testing', 'prøving'],
  'inspeksjon': ['inspection', 'inspeksjon', 'kontroll'],
  'audit': ['audit', 'revisjon', 'kontroll'],
  'revisjon': ['audit', 'revisjon', 'gjennomgang'],
  'evaluering': ['evaluation', 'evaluering', 'vurdering'],
  'vurdering': ['assessment', 'vurdering', 'evaluering'],
  'gradering': ['grading', 'gradering', 'rangering'],
  'rangering': ['ranking', 'rangering', 'rekkefølge'],
  'prioritering': ['prioritization', 'prioritering', 'rangering'],
  'klassifisering': ['classification', 'klassifisering', 'kategorisering'],
  'kategorisering': ['categorization', 'kategorisering', 'inndeling'],
  'segmentering': ['segmentation', 'segmentering', 'inndeling'],
  'gruppering': ['grouping', 'gruppering', 'samling'],
  'clustering': ['clustering', 'gruppering', 'samling'],
  'sammenligning': ['comparison', 'sammenligning', 'sammenlikning'],
  'benchmarking': ['benchmarking', 'sammenligning', 'referanse']
};

// Expand search terms with Norwegian synonyms
function expandSearchTerms(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expandedTerms = [...words];
  
  words.forEach(word => {
    // Check if the word has Norwegian synonyms
    if (norwegianAuditTerms[word]) {
      expandedTerms.push(...norwegianAuditTerms[word]);
    }
    
    // Check if the word is a synonym of a Norwegian term
    Object.entries(norwegianAuditTerms).forEach(([key, synonyms]) => {
      if (synonyms.includes(word)) {
        expandedTerms.push(key);
        expandedTerms.push(...synonyms);
      }
    });
  });
  
  return [...new Set(expandedTerms)]; // Remove duplicates
}

function getSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://fxelhfwaoizqyecikscu.supabase.co';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc';
  
  console.log('🔐 Initializing Supabase client with URL:', supabaseUrl.substring(0, 30) + '...');
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  });
}

async function getEmbedding(text: string, openAIApiKey: string) {
  try {
    console.log('🔄 Getting embedding for text:', text.substring(0, 50) + '...');
    
    // Expand the text with Norwegian synonyms for better embedding
    const expandedTerms = expandSearchTerms(text);
    const enhancedText = expandedTerms.join(' ');
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'text-embedding-3-small', 
        input: enhancedText.replace(/\n/g, ' ') 
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ OpenAI embedding error:", errorBody);
      throw new Error('Failed to get embedding from OpenAI');
    }
    
    const data = await response.json();
    console.log('✅ Enhanced embedding generated successfully');
    return data.data[0].embedding;
  } catch (error) {
    console.error('❌ Error getting embedding:', error);
    throw error;
  }
}

function sanitizeWords(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\såøæäöü]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.split(' ').filter(word => word.length > 1);
}

async function enhancedKeywordSearch(supabase: any, query: string): Promise<SearchArticle[]> {
  console.log('🔎 Enhanced Norwegian keyword search for:', query);

  const originalWords = sanitizeWords(query);
  const expandedTerms = expandSearchTerms(query);
  const allSearchTerms = [...new Set([...originalWords, ...expandedTerms])];
  
  console.log('📝 Original search words:', originalWords);
  console.log('🔍 Expanded search terms:', expandedTerms.slice(0, 20)); // Show first 20 for logging
  
  if (allSearchTerms.length === 0) {
    console.log('⚠️ No valid search terms found');
    return [];
  }
  
  try {
    // Build more sophisticated search conditions
    const titleConditions = allSearchTerms.map(word => `title.ilike.%${word}%`).join(',');
    const summaryConditions = allSearchTerms.map(word => `summary.ilike.%${word}%`).join(',');
    const contentConditions = allSearchTerms.map(word => `content.ilike.%${word}%`).join(',');
    const refConditions = allSearchTerms.map(word => `reference_code.ilike.%${word}%`).join(',');
    
    const searchConditions = [titleConditions, summaryConditions, contentConditions, refConditions].join(',');
    
    console.log('📊 Executing enhanced database query...');
    const { data, error } = await supabase
      .from('knowledge_articles')
      .select(`
        id,
        title,
        slug,
        summary,
        content,
        reference_code,
        view_count,
        created_at,
        updated_at,
        published_at,
        category:knowledge_categories(name, id)
      `)
      .eq('status', 'published')
      .or(searchConditions)
      .order('view_count', { ascending: false })
      .limit(30); // Increased limit for better results

    if (error) {
      console.error('❌ Enhanced keyword search database error:', error);
      throw error;
    }
    
    console.log(`✅ Enhanced keyword search found ${data?.length || 0} articles`);

    return (data || []).map((article: any) => {
      let relevanceScore = 0;
      const titleLower = (article.title || '').toLowerCase();
      const summaryLower = (article.summary || '').toLowerCase();
      const contentLower = (article.content || '').toLowerCase();
      const refCodeLower = (article.reference_code || '').toLowerCase();
      
      // Score based on original terms (higher weight)
      originalWords.forEach(word => {
        if (titleLower.includes(word)) relevanceScore += 10;
        if (refCodeLower.includes(word)) relevanceScore += 8;
        if (summaryLower.includes(word)) relevanceScore += 4;
        if (contentLower.includes(word)) relevanceScore += 2;
      });
      
      // Score based on expanded terms (lower weight)
      expandedTerms.forEach(word => {
        if (titleLower.includes(word)) relevanceScore += 3;
        if (refCodeLower.includes(word)) relevanceScore += 2;
        if (summaryLower.includes(word)) relevanceScore += 1;
        if (contentLower.includes(word)) relevanceScore += 0.5;
      });
      
      // Boost for ISA codes, law references, etc.
      if (refCodeLower.includes('isa')) relevanceScore += 5;
      if (refCodeLower.includes('§')) relevanceScore += 3;
      if (titleLower.includes('revisjon') || titleLower.includes('audit')) relevanceScore += 2;
      
      return { 
        ...article, 
        similarity: Math.min(relevanceScore / 20, 1.0), // Normalized to 0-1
        category: article.category ? { name: article.category.name, id: article.category.id } : null 
      };
    }).sort((a: SearchArticle, b: SearchArticle) => (b.similarity || 0) - (a.similarity || 0));
    
  } catch (error) {
    console.error('❌ Enhanced keyword search error:', error);
    throw error;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Enhanced Norwegian knowledge search function started');
    
    let requestBody: KnowledgeSearchRequest;
    try {
      const bodyText = await req.text();
      console.log('📝 Raw request body length:', bodyText?.length || 0);
      
      if (!bodyText || bodyText.trim() === '') {
        console.log('⚠️ Empty request body received, using fallback');
        return new Response(JSON.stringify({
          articles: [],
          tagMapping: {},
          message: 'No query provided'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      requestBody = JSON.parse(bodyText) as KnowledgeSearchRequest;
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query } = requestBody;
    if (!query || query.trim() === '') {
      console.log('⚠️ No query parameter provided');
      return new Response(JSON.stringify({
        articles: [],
        tagMapping: {},
        message: 'Empty query'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Enhanced Norwegian knowledge search for query:', query.substring(0, 100) + '...');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = getSupabaseClient(req);

    console.log('📊 Checking total published articles...');
    const { count: totalCount, error: countError } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (countError) {
      console.error('❌ Error checking article count:', countError);
      throw countError;
    }
    
    console.log(`📈 Total published articles: ${totalCount || 0}`);
    
    if (!totalCount || totalCount === 0) {
      console.log('⚠️ No published articles found');
      return new Response(JSON.stringify({
        articles: [],
        tagMapping: {}
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let semanticResults: SearchArticle[] = [];
    
    if (openAIApiKey) {
      try {
        console.log('🧠 Attempting enhanced semantic search...');
        const queryEmbedding = await getEmbedding(query, openAIApiKey);
        
        console.log('🔍 Calling match_knowledge_articles RPC...');
        const { data, error } = await supabase.rpc('match_knowledge_articles', {
          p_query_embedding: queryEmbedding,
          p_match_threshold: 0.65, // Slightly lower threshold for better recall
          p_match_count: 15,
        });

        if (error) {
          console.error('❌ Semantic search RPC error:', error);
        } else {
          semanticResults = data || [];
          console.log(`✅ Enhanced semantic search found ${semanticResults.length} articles`);
        }
      } catch (e) {
        console.error("❌ Error during enhanced semantic search:", e.message);
      }
    } else {
      console.log('⚠️ No OpenAI API key, skipping semantic search');
    }
    
    console.log('🔤 Performing enhanced Norwegian keyword search...');
    const keywordResults = await enhancedKeywordSearch(supabase, query);

    // Combine results with better scoring
    const combinedResults = [...semanticResults, ...keywordResults];
    const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
    
    // Enhanced sorting - prioritize semantic relevance over view count for better results
    uniqueResults.sort((a, b) => {
      const aScore = (a.similarity || 0) * 0.8 + ((a.view_count || 0) / 1000) * 0.2;
      const bScore = (b.similarity || 0) * 0.8 + ((b.view_count || 0) / 1000) * 0.2;
      return bScore - aScore;
    });

    const finalResults = uniqueResults.slice(0, 25); // Increased result limit
    
    console.log(`✅ Returning ${finalResults.length} enhanced Norwegian search results`);
    console.log('🎯 Top results:', finalResults.slice(0, 3).map(r => ({
      title: r.title,
      similarity: r.similarity,
      view_count: r.view_count
    })));

    return new Response(JSON.stringify({
      articles: finalResults,
      tagMapping: {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Critical error in enhanced Norwegian knowledge-search function:', error);
    return new Response(JSON.stringify({
      articles: [],
      tagMapping: {},
      error: 'Enhanced Norwegian knowledge search temporarily unavailable'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

Deno.serve(handler);
