import { FieldDefinition } from './fileProcessing';

// Standard field definitions for legal provisions
export const LEGAL_PROVISION_FIELDS: FieldDefinition[] = [
  {
    key: 'provision_id',
    label: 'Bestemmelse ID',
    required: true,
    type: 'text',
    aliases: [
      'bestemmelse id', 'provision_id', 'id', 'provision id', 'bestemmelse_id',
      'bestemmelseid', 'provision-id', 'bestemmelse-id', 'ref', 'referanse'
    ]
  },
  {
    key: 'law_identifier', 
    label: 'Lov ID/Kode',
    required: true,
    type: 'text',
    aliases: [
      'lov id', 'law_identifier', 'lov', 'law', 'lovkode', 'law code',
      'lov_id', 'lovid', 'law-id', 'lov-id', 'lov_kode', 'lov kode'
    ]
  },
  {
    key: 'provision_type',
    label: 'Type',
    required: true,
    type: 'text',
    aliases: [
      'type', 'provision_type', 'bestemmelsestype', 'provision type',
      'kategori', 'category', 'art', 'kind', 'slag'
    ]
  },
  {
    key: 'provision_number',
    label: 'Paragrafnummer',
    required: true,
    type: 'text',
    aliases: [
      'paragrafnummer', 'provision_number', 'paragraf', 'paragraph', '§',
      'nummer', 'number', 'nr', 'no', 'provision nr', 'bestemmelse nr',
      'paragrafnr', 'paragraph number', 'section', 'seksjon'
    ]
  },
  {
    key: 'title',
    label: 'Tittel',
    required: true,
    type: 'text',
    aliases: [
      'tittel', 'title', 'overskrift', 'heading', 'navn', 'name',
      'beskrivelse', 'description', 'emne', 'subject', 'tema'
    ]
  },
  {
    key: 'content',
    label: 'Innhold/Tekst',
    required: true,
    type: 'text',
    aliases: [
      'innhold', 'content', 'tekst', 'text', 'bestemmelse', 'provision',
      'regel', 'rule', 'paragraftekst', 'paragraph text', 'lovtekst',
      'law text', 'bestemmelsestekst', 'provision text'
    ]
  },
  {
    key: 'parent_provision_id',
    label: 'Overordnet bestemmelse',
    required: false,
    type: 'text',
    aliases: [
      'overordnet', 'parent', 'parent_provision_id', 'parent provision',
      'overordnet bestemmelse', 'hovedbestemmelse', 'main provision',
      'parent_id', 'parentid', 'overordnet_id', 'hover', 'kapittel'
    ]
  },
  {
    key: 'valid_from',
    label: 'Gyldig fra',
    required: false,
    type: 'date',
    aliases: [
      'gyldig fra', 'valid_from', 'fra dato', 'from date', 'gyldig_fra',
      'ikrafttredelse', 'effective from', 'start dato', 'startdato',
      'trådt i kraft', 'effective date', 'ikraftdato'
    ]
  },
  {
    key: 'valid_until',
    label: 'Gyldig til',
    required: false,
    type: 'date',
    aliases: [
      'gyldig til', 'valid_until', 'til dato', 'to date', 'gyldig_til',
      'utløp', 'expiry', 'sluttdato', 'end date', 'opphør',
      'opphørsdato', 'expiry date', 'slutt'
    ]
  }
];

// Norwegian legal terms that commonly appear in provision files
export const NORWEGIAN_LEGAL_TERMS: string[] = [
  // Legal provision types
  'lov', 'kapittel', 'paragraf', '§', 'ledd', 'punktum', 'bokstav',
  'underpunkt', 'bestemmelse', 'regel', 'forskrift', 'vedtak',
  
  // Legal document structure
  'innledning', 'formål', 'virkeområde', 'definisjoner', 'alminnelige bestemmelser',
  'særlige bestemmelser', 'straff', 'ikrafttredelse', 'overgangsbestemmelser',
  
  // Common legal words
  'skal', 'kan', 'må', 'bør', 'ikke', 'dersom', 'når', 'med mindre',
  'forutsatt at', 'gjelder', 'anvendes', 'omfatter', 'unntak',
  
  // Legal entities and concepts
  'selskap', 'foretak', 'stiftelse', 'forening', 'enkeltpersonforetak',
  'aksjeselskap', 'allmennaksjeselskap', 'ansvarlig selskap', 'kommandittselskap'
];