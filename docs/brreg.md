
# Brønnøysundregistrene API Integration

This document describes the integration with Brønnøysundregistrene's API for fetching company information.

## API Endpoints

The integration uses two main endpoints from Brønnøysundregistrene's public API:

1. **Basic Company Information**:  
   `https://data.brreg.no/enhetsregisteret/api/enheter/{organizationNumber}`

2. **Company Roles/Board Members**:  
   `https://data.brreg.no/enhetsregisteret/api/roller/enhet/{organizationNumber}`

## Data Fields

### Basic Company Information

| Field Name | Description | Norwegian Term |
|------------|-------------|----------------|
| organisasjonsnummer | Organization number | Organisasjonsnummer |
| navn | Company name | Navn |
| organisasjonsform | Company form (code and description) | Organisasjonsform |
| status | Company status | Status |
| registreringsdatoEnhetsregisteret | Registration date | Registreringsdato |
| hjemmeside | Website URL | Hjemmeside |
| naeringskode1 | Industry code (NACE) | Næringskode |
| forretningsadresse | Business address | Forretningsadresse |
| postadresse | Postal address | Postadresse |
| institusjonellSektorkode | Institutional sector code | Institusjonell sektorkode |
| epost | Email address | E-post |
| telefon | Phone number | Telefon |
| aksjekapital | Share capital | Aksjekapital |
| egenkapital | Equity capital | Egenkapital |
| andelsinnskudd | Share contribution (for cooperatives) | Andelsinnskudd |
| kommune | Municipality | Kommune |

### Roles Information

Roles data is structured as follows:

| Role Type | Description | Norwegian Term |
|-----------|-------------|----------------|
| DAGL | CEO/General Manager | Daglig leder |
| STYR | Board member | Styremedlem |
| SIGNER | Authorized signatory | Signaturberettiget |

Additional fields for each role:

- `person.navn`: Person's name
- `fraTraadtTiltredtDato`: Start date of role
- `tilTraadtFraTredtDato`: End date of role
- `rolleBeskrivelse`: Role description

## Sample Response

The Edge Function returns a processed response with this structure:

```json
{
  "basis": {
    "organisasjonsnummer": "123456789",
    "navn": "Example Company AS",
    "organisasjonsform": {
      "kode": "AS",
      "beskrivelse": "Aksjeselskap"
    },
    "status": "ACTIVE",
    "registreringsdatoEnhetsregisteret": "2010-01-15",
    "hjemmeside": "https://example.com",
    "naeringskode1": {
      "kode": "62.010",
      "beskrivelse": "Programmeringstjenester"
    },
    "forretningsadresse": {
      "adresse": ["Street 123"],
      "postnummer": "0150",
      "poststed": "OSLO"
    },
    "epost": "kontakt@example.com",
    "telefon": "12345678",
    "kapital": {
      "shareCapital": {
        "amount": 100000,
        "currency": "NOK"
      },
      "equityCapital": {
        "amount": 500000,
        "currency": "NOK"
      }
    },
    "kommune": {
      "kode": "0301",
      "navn": "OSLO"
    }
  },
  "roles": {
    "ceo": {
      "name": "Jane Doe",
      "fromDate": "2020-01-01",
      "toDate": null,
      "roleType": "CEO"
    },
    "chair": {
      "name": "John Smith",
      "fromDate": "2019-05-15",
      "toDate": null,
      "roleType": "CHAIR"
    },
    "boardMembers": [
      {
        "name": "Alice Johnson",
        "fromDate": "2019-05-15",
        "toDate": null,
        "roleType": "MEMBER",
        "description": "Styremedlem"
      },
      {
        "name": "Bob Williams",
        "fromDate": "2021-03-10",
        "toDate": null,
        "roleType": "MEMBER",
        "description": "Styremedlem"
      },
      {
        "name": "Eve Brown",
        "fromDate": "2020-12-05",
        "toDate": null,
        "roleType": "SIGNATORY",
        "description": "Signaturberettiget"
      }
    ]
  }
}
```

## Rate Limits & Authentication

The Brønnøysundregistrene API has the following limitations:

1. **Public API (Unauthenticated)**:
   - Rate limited to 60 requests per minute and 10,000 requests per day
   - Limited data fields available

2. **Enhanced API (Maskinporten Authentication)**:
   - Higher rate limits
   - Access to additional data fields
   - Requires Maskinporten integration

## Future Improvements

### Maskinporten Integration

For production use, a Maskinporten integration should be implemented to:

1. Increase rate limits
2. Access additional data fields
3. Ensure reliable API access

Steps for Maskinporten integration:

1. Register the application with Digdir
2. Implement OAuth 2.0 client authentication
3. Update the edge function to use the Maskinporten token

### Caching Strategy

The `brreg` edge function now caches organization lookups using
Deno KV. When a request is made with a nine digit organization
number, the function checks KV for a cached response. If a cached
entry exists and it is less than 24 hours old the cached JSON is
returned immediately. Otherwise the data is fetched from the
Brønnøysund API and the resulting payload is stored back in KV with
a timestamp. Name searches are not cached.

## Client Data Model

The client data is stored in the database with the following mapping from the API:

| Database Field | API Field | Description |
|----------------|-----------|-------------|
| name | basis.navn | Company name |
| company_name | basis.navn | Company name (same as name) |
| org_number | basis.organisasjonsnummer | Organization number |
| org_form_code | basis.organisasjonsform.kode | Organization form code (e.g., AS) |
| org_form_description | basis.organisasjonsform.beskrivelse | Organization form description |
| homepage | basis.hjemmeside | Website URL |
| status | basis.status | Company status |
| nace_code | basis.naeringskode1.kode | Industry code |
| nace_description | basis.naeringskode1.beskrivelse | Industry description |
| industry | basis.naeringskode1.beskrivelse | Industry description (same as nace_description) |
| municipality_code | basis.kommune.kode | Municipality code |
| municipality_name | basis.kommune.navn | Municipality name |
| address | basis.forretningsadresse.adresse[0] | Street address |
| postal_code | basis.forretningsadresse.postnummer | Postal code |
| city | basis.forretningsadresse.poststed | City |
| registration_date | basis.registreringsdatoEnhetsregisteret | Registration date |
| email | basis.epost | Email address |
| phone | basis.telefon | Phone number |
| equity_capital | basis.kapital.equityCapital.amount | Equity capital |
| share_capital | basis.kapital.shareCapital.amount | Share capital |
| ceo | roles.ceo.name | CEO's name |
| chair | roles.chair.name | Chair's name |

For roles, we use a separate `client_roles` table with these fields:

| Field | Description |
|-------|-------------|
| client_id | Reference to the client |
| role_type | Type of role (CEO, CHAIR, MEMBER, SIGNATORY) |
| name | Person's name |
| from_date | Starting date of the role |
| to_date | End date of the role (if applicable) |
