# Uploader Components Audit

**Dato:** 2025-10-11  
**Formål:** Kartlegge alle uploader-komponenter og identifisere muligheter for konsolidering

---

## 📊 Oversikt

- **Totalt antall uploader-filer:** 27+
- **Bruker `fileProcessing.ts`:** 11 komponenter
- **Har egen parsing-logikk:** 16+ komponenter
- **Dublert kode:** Høy (flere implementasjoner av file dropzone, CSV parsing, Excel parsing)

---

## ✅ Komponenter som bruker `fileProcessing.ts`

Disse følger best practices og bruker felles utilities:

### Accounting Uploaders (høy kvalitet)
1. **ChartOfAccountsUploader** - `src/components/Accounting/ChartOfAccountsUploader.tsx`
   - Bruker: `processExcelFile`, `processCSVFile`
   - Status: ✅ God implementering
   
2. **GeneralLedgerUploader** - `src/components/Accounting/GeneralLedgerUploader.tsx`
   - Bruker: Indirekte via andre komponenter
   - Status: ✅ God implementering
   
3. **TrialBalanceUploader** - `src/components/Accounting/TrialBalanceUploader.tsx`
   - Bruker: Indirekte via mapping table
   - Status: ✅ God implementering

4. **TrialBalanceMappingTable** - `src/components/Accounting/TrialBalanceMappingTable.tsx`
   - Bruker: `processExcelFile`, `processCSVFile`
   - Status: ✅ God implementering

### Upload System Komponenter
5. **UniversalUploader** - `src/components/Upload/UniversalUploader.tsx`
   - Bruker: `parseFilePreview`, `suggestColumnMappings`
   - Status: ✅ Del av nytt upload-system
   
6. **SmartColumnMapper** - `src/components/Upload/SmartColumnMapper.tsx`
   - Bruker: `ColumnMapping` type
   - Status: ✅ Typebasert integrasjon

### Specialized Uploaders
7. **LawProvisionUploader** - `src/components/Knowledge/LegalKnowledge/LawProvisionUploader.tsx`
   - Bruker: `processExcelFile`, `processCSVFile`, `suggestColumnMappings`
   - Status: ✅ God implementering

### Data Display Components
8. **EnhancedPreview** - `src/components/DataUpload/EnhancedPreview.tsx`
   - Bruker: `FilePreview`, `ColumnMapping`, `FieldDefinition` types
   - Status: ✅ Bruker types korrekt

9. **FilePreview** - `src/components/DataUpload/FilePreview.tsx`
   - Bruker: `FilePreview`, `FieldDefinition`, `ColumnMapping`, `suggestColumnMappings`
   - Status: ✅ God implementering

10. **ColumnMappingTable** - `src/components/DataUpload/ColumnMappingTable.tsx`
    - Bruker: `ColumnMapping` type
    - Status: ✅ Typebasert integrasjon

### Utility/Display Components
11. **AnalysisPanel**, **FilteredDataPreview**, **GeneralLedgerFilters**
    - Bruker: `formatNorwegianNumber` utility
    - Status: ✅ Bruker formattering-funksjoner

---

## ❌ Komponenter med egen parsing-logikk

Disse har dublert kode og bør migreres til `fileProcessing.ts`:

### Høy prioritet (mest brukt, mest gevinst)

1. **CSVUploader** - `src/components/DataUpload/CSVUploader.tsx`
   - Egen CSV parsing
   - Omfattende funksjonalitet
   - **Gevinst:** Kan forenkles betydelig

2. **FileUploader** (Shareholders) - `src/components/DataUpload/FileUploader.tsx`
   - Egen Excel/CSV parsing
   - **Gevinst:** Kan bruke standard parsing

3. **DocumentUploader** - `src/components/ClientDocuments/DocumentUploader.tsx`
   - Generisk opplasting uten parsing
   - **Vurdering:** Trenger kanskje ikke fileProcessing (kun PDF/filer)

4. **LegalDocumentsUploader** - `src/components/AI/LegalDocumentsUploader.tsx`
   - Håndterer dokument-opplasting
   - **Vurdering:** Kan trenge egen logikk for AI-prosessering

### Medium prioritet

5. **PDFUploader** - `src/components/PDFDocuments/PDFUploader.tsx`
   - PDF-spesifikk håndtering
   - **Vurdering:** Trenger egen logikk for PDF (ikke Excel/CSV)

6. **EnhancedFileUploader** - `src/components/Upload/EnhancedFileUploader.tsx`
   - Del av nytt upload-system
   - **Vurdering:** Bør integreres med fileProcessing.ts

7. **LargeDatasetUploader** - `src/components/Upload/LargeDatasetUploader.tsx`
   - Håndterer store datasett
   - **Vurdering:** Kan dra nytte av fileProcessing for parsing

### Lav prioritet (Wrapper/Container komponenter)

8. **AccountingDataUploader** - `src/components/Accounting/AccountingDataUploader.tsx`
   - Wrapper for andre uploaders
   - **Vurdering:** Ingen endring nødvendig

9. **ImprovedAccountingDataUploader** - `src/components/Accounting/ImprovedAccountingDataUploader.tsx`
   - Wrapper for andre uploaders
   - **Vurdering:** Ingen endring nødvendig

10. **RegnskapsDataManager** - `src/components/Accounting/RegnskapsDataManager.tsx`
    - Manager-komponent
    - **Vurdering:** Ingen endring nødvendig

### Specialized/Context-specific

11-16. **SaftImport**, **UploadZone**, **PDFDropzone**, etc.
    - Spesialiserte komponenter for spesifikke filtyper
    - **Vurdering:** Behold egen logikk, men kan dra nytte av felles dropzone-UI

---

## 🎯 Dublert kode identifisert

### 1. Dropzone UI Pattern
**Forekomster:** 5+ komponenter har nesten identisk dropzone-kode
- UploadZone (DataUpload)
- PDFDropzone (PDFDocuments)
- Dropzone i CSVUploader
- Dropzone i FileUploader
- Diverse andre

**Løsning:** Lag felles `FileUploadZone` komponent

### 2. CSV Parsing Logic
**Forekomster:** 3+ komponenter parser CSV manuelt
- CSVUploader har egen parsing
- FileUploader har egen parsing
- Noen bruker fileProcessing.ts

**Løsning:** Alle bør bruke `parseCSV` og `detectCSVDelimiter` fra fileProcessing.ts

### 3. Excel Parsing Logic
**Forekomster:** 4+ komponenter parser Excel manuelt
- FileUploader
- Noen bruker fileProcessing.ts
- Ulike måter å håndtere XLSX på

**Løsning:** Alle bør bruke `processExcelFile` fra fileProcessing.ts

### 4. Column Mapping UI
**Forekomster:** Flere komponenter har egen mapping-UI
- Noen bruker SmartColumnMapper
- Andre har egen implementering

**Løsning:** Standardiser på SmartColumnMapper

---

## 📋 Migrasjonsplan

### Fase 1: Lag felles komponenter ✅ FULLFØRT
- ✅ Audit-dokument (denne filen)
- ✅ Lag `FileUploadZone` komponent (generisk dropzone)
- ✅ Lag `useFileProcessor` hook (wrapper for fileProcessing.ts)
- ✅ Oppdater `UploadZone` (DataUpload) til å bruke FileUploadZone som adapter
  - Legacy API bevart for bakoverkompatibilitet
  - Alle eksisterende komponenter får nå forbedret validering automatisk

### Fase 2: Migrer høy-prioritet komponenter (Neste)
1. CSVUploader → Bruk FileUploadZone + FileProcessor
2. FileUploader (Shareholders) → Bruk FileUploadZone + FileProcessor
3. EnhancedFileUploader → Integrer med fileProcessing.ts

### Fase 3: Standardiser medium-prioritet (Senere)
1. LargeDatasetUploader → Bruk fileProcessing for parsing
2. Diverse dropzones → Bruk FileUploadZone

### Fase 4: Dokumentasjon og cleanup (Sist)
1. Oppdater docs med nye patterns
2. Fjern gammel, ubrukt kode (kun hvis bevist ubrukt)

---

## ⚠️ Viktige merknader

1. **IKKE FJERN FUNKSJONALITET**: Alle migreringer må beholde eksakt samme funksjonalitet
2. **Test grundig**: Hver migrasjon må testes før og etter
3. **Gradvis rollout**: Migrer én komponent om gangen
4. **Behold spesialisering**: PDF/SAF-T uploaders trenger kanskje egen logikk

---

## 🎁 Forventet gevinst

- **Kodelinjer redusert:** ~30-40% i uploader-komponenter
- **Vedlikeholdbarhet:** Enklere å fikse bugs (én plass)
- **Konsistens:** Samme UX på tvers av alle uploaders
- **Testing:** Enklere å teste (én komponent å teste grundig)
- **Onboarding:** Nye utviklere trenger kun lære én pattern
