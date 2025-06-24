
# AI-Revi - Intelligent Revisjonsassistent

En intelligent AI-drevet revisjonsassistent bygget med React, TypeScript og Supabase.

## 🚀 Kom i gang

### Forutsetninger

- Node.js 18+ 
- npm eller yarn
- Supabase konto

### Installasjon

1. Klon repositoriet:
```bash
git clone <repository-url>
cd ai-revi
```

2. Installer avhengigheter:
```bash
npm install
```

3. Konfigurer miljøvariabler:
```bash
cp .env.example .env.local
```

Fyll inn:
- `VITE_SUPABASE_URL` - Din Supabase prosjekt URL
- `VITE_SUPABASE_ANON_KEY` - Din Supabase anon nøkkel
- `OPENAI_API_KEY` - OpenAI API nøkkel (for AI-funksjoner)

4. Start utviklingsserveren:
```bash
npm run dev
```

## 📋 Funksjoner

### AI-Revi Assistent
- **Intelligent samtale**: AI-drevet revisjonsassistent som kan svare på fagspørsmål
- **Kontekst-bevisst**: Tilpasser seg ulike revisjonsområder og klienter
- **Tag-system**: Automatisk generering av emnetags fra AI-responser
- **Kunnskapsbase-integrasjon**: Søker i fagartikler og ISA-standarder

### AI-Funksjoner
AI-Revi bruker OpenAI's GPT-modeller og har flere spesialiserte varianter:

#### Tag-systemet
Alle AI-responser inneholder en standardisert "🏷️ **EMNER:**" linje som:
- Genereres automatisk av AI-en basert på samtaleinnhold
- Valideres av edge function (`revy-ai-chat`) før sending
- Parseders til klikkbare badges i frontend
- Linker til relevante fagartikler i kunnskapsbasen

Eksempel på AI-respons format:
```
Svar på revisjonsSpørsmål...

🏷️ **EMNER:** Materialitet, Risikivurdering, ISA 315
```

Frontend konverterer EMNER-linjen til klikkbare tags som fører brukeren til relevante fagartikler.

#### Kunnskapsbase
- Fagartikler med embedding-vektorer for semantisk søk
- Automatisk generering av embeddings ved publisering
- ISA-standarder og revisjonsveiledninger
- Intelligent artikkel-matching basert på brukerens spørsmål

### Klient-administrasjon
- BRREG-integrasjon for automatisk firmainformasjon
- Dokumenthåndtering med AI-kategorisering
- Revisjonshandlinger og malverk
- Fremdriftssporing og rapportering

### Brukerroller
- **Admin**: Full tilgang til alle funksjoner
- **Partner**: Kan administrere klienter og team
- **Employee**: Utfører revisjonsarbeid

## 🏗️ Arkitektur

### Frontend
- **React 18** med TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** komponentbibliotek
- **React Query** for data-håndtering
- **React Router** for routing

### Backend
- **Supabase** som backend-as-a-service
- **PostgreSQL** database
- **Row Level Security** for datatilgang
- **Edge Functions** for AI-integrasjon

### AI-integrasjon
- **OpenAI GPT-4o-mini** som hovedmodell
- **Edge Functions** for AI-responsvalidering
- **Embedding-vektorer** for semantisk søk
- **Kontekst-bevisst prompting** basert på brukerrolle og data

## 📁 Prosjektstruktur

```
src/
├── components/          # React komponenter
│   ├── AI/             # AI-relaterte komponenter
│   ├── Revy/           # AI-Revi assistentkomponenter
│   ├── Layout/         # Layout og navigasjon
│   ├── Knowledge/      # Kunnskapsbase
│   └── ui/             # Gjenbrukbare UI-komponenter
├── hooks/              # Custom React hooks
├── services/           # API-tjenester og business logic
├── types/              # TypeScript type-definisjoner
└── utils/              # Hjelpefunksjoner

supabase/
├── functions/          # Edge Functions
├── migrations/         # Database migrasjoner
└── config.toml         # Supabase konfigurasjon
```

## 🔧 Utvikling

### Debugging
- Bruk `devLog()` for logging i utviklingsmodus
- Console logs fjernes automatisk i produksjon
- Edge Function logs tilgjengelig i Supabase dashboard

### Database
- Supabase migrasjoner kjøres automatisk
- RLS-policies sikrer datatilgang
- Embedding-vektorer for AI-søk

### AI-funksjoner
- Edge Functions håndterer AI-integrasjon
- Cached responses for ytelse
- Kontekst-bevisst prompting

## 🚀 Deployment

1. Bygg produksjonsversjon:
```bash
npm run build
```

2. Deploy til Supabase:
```bash
supabase deploy
```

3. Konfigurer miljøvariabler i Supabase dashboard

## 📖 API-dokumentasjon

### Edge Functions

#### `revy-ai-chat`
Hovedfunksjon for AI-Revi samtaler:
- Validerer AI-responser for EMNER-format
- Søker i kunnskapsbase
- Håndterer kontekst og varianter

#### `generate-embeddings`
Genererer embedding-vektorer for kunnskapsbase:
- Prosesserer fagartikler
- Oppretter søkbare vektorer
- Aktiverer intelligent søk

## 🤝 Bidrag

1. Fork prosjektet
2. Opprett feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit endringene (`git commit -m 'Add some AmazingFeature'`)
4. Push til branch (`git push origin feature/AmazingFeature`)
5. Åpne en Pull Request

## 📄 Lisens

Dette prosjektet er lisensiert under MIT-lisensen.

## 🆘 Support

For spørsmål eller problemer, åpne en issue på GitHub eller kontakt utviklingsteamet.
