import * as XLSX from 'xlsx';
import { LegalDocumentType, LegalDocument, LegalProvision } from '@/types/legal-knowledge';

export interface ExcelImportResult {
  documentTypes: LegalDocumentType[];
  documents: LegalDocument[];
  provisions: LegalProvision[];
  errors: string[];
}

export interface ExcelExportData {
  documentTypes: LegalDocumentType[];
  documents: LegalDocument[];
  provisions: LegalProvision[];
}

export class LegalExcelService {
  static generateTemplate(): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // Document Types Sheet
    const documentTypesData = [
      ['ID', 'Navn', 'Visningsnavn', 'Beskrivelse', 'Hierarki Level', 'Autoritetstyngde', 'Farge', 'Ikon', 'Er aktiv'],
      ['lov', 'lov', 'Lover', 'Lover vedtatt av Stortinget', 1, 1.0, '#DC2626', 'scale', true],
      ['forskrift', 'forskrift', 'Forskrifter', 'Forskrifter fra departement', 2, 0.8, '#EA580C', 'file-text', true],
      ['rundskriv', 'rundskriv', 'Rundskriv', 'Veiledende rundskriv', 3, 0.6, '#CA8A04', 'mail', true],
      ['standard', 'standard', 'Standarder', 'Regnskapsstandarder', 2, 0.7, '#16A34A', 'bookmark', true]
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(documentTypesData), 'Dokumenttyper');

    // Documents Sheet
    const documentsData = [
      ['Tittel', 'Dokumenttype', 'Dokumentnummer', 'Innhold', 'Sammendrag', 'Publiseringsdato', 'Ikrafttredelsesdato', 'Utløpsdato', 'Utstedende myndighet', 'Kilde URL', 'Status', 'Er primærkilde'],
      ['Regnskapsloven', 'lov', 'LOV-1998-07-17-56', 'Fullstendig lovtekst...', 'Lov om årsregnskap m.v.', '1998-07-17', '1999-01-01', '', 'Stortinget', 'https://lovdata.no/dokument/NL/lov/1998-07-17-56', 'active', true],
      ['Regnskapsforskriften', 'forskrift', 'FOR-1999-12-15-1674', 'Fullstendig forskriftstekst...', 'Forskrift om årsregnskap m.v.', '1999-12-15', '2000-01-01', '', 'Nærings- og fiskeridepartementet', 'https://lovdata.no/dokument/SF/forskrift/1999-12-15-1674', 'active', true]
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(documentsData), 'Dokumenter');

    // Provisions Sheet
    const provisionsData = [
      ['Bestemmelsestype', 'Bestemmelsesnummer', 'Tittel', 'Innhold', 'Overordnet bestemmelse ID', 'Lov-identifikator', 'Lovens fulle navn', 'Gyldig fra', 'Gyldig til', 'Hierarki-sti', 'Sorteringsrekkefølge', 'Er aktiv'],
      ['kapittel', '1', 'Innledende bestemmelser', '', '', 'regnskapsloven', 'Lov om årsregnskap m.v.', '1999-01-01', '', 'regnskapsloven.kap1', 1, true],
      ['paragraf', '1-1', 'Formål', 'Formålet med denne loven er...', 'kap1', 'regnskapsloven', 'Lov om årsregnskap m.v.', '1999-01-01', '', 'regnskapsloven.kap1.§1-1', 2, true],
      ['paragraf', '1-2', 'Virkeområde', 'Loven gjelder for...', 'kap1', 'regnskapsloven', 'Lov om årsregnskap m.v.', '1999-01-01', '', 'regnskapsloven.kap1.§1-2', 3, true]
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(provisionsData), 'Bestemmelser');

    return workbook;
  }

  static exportToExcel(data: ExcelExportData): ArrayBuffer {
    const workbook = XLSX.utils.book_new();

    // Document Types
    const documentTypesData = [
      ['ID', 'Navn', 'Visningsnavn', 'Beskrivelse', 'Hierarki Level', 'Autoritetstyngde', 'Farge', 'Ikon', 'Er aktiv'],
      ...data.documentTypes.map(dt => [
        dt.id,
        dt.name,
        dt.display_name,
        dt.description || '',
        dt.hierarchy_level,
        dt.authority_weight,
        dt.color,
        dt.icon || '',
        dt.is_active
      ])
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(documentTypesData), 'Dokumenttyper');

    // Documents
    const documentsData = [
      ['Tittel', 'Dokumenttype', 'Dokumentnummer', 'Innhold', 'Sammendrag', 'Publiseringsdato', 'Ikrafttredelsesdato', 'Utløpsdato', 'Utstedende myndighet', 'Kilde URL', 'Status', 'Er primærkilde'],
      ...data.documents.map(doc => [
        doc.title,
        doc.document_type_id,
        doc.document_number || '',
        doc.content,
        doc.summary || '',
        doc.publication_date || '',
        doc.effective_date || '',
        doc.expiry_date || '',
        doc.issuing_authority || '',
        doc.source_url || '',
        doc.document_status,
        doc.is_primary_source
      ])
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(documentsData), 'Dokumenter');

    // Provisions
    const provisionsData = [
      ['Bestemmelsestype', 'Bestemmelsesnummer', 'Tittel', 'Innhold', 'Overordnet bestemmelse ID', 'Lov-identifikator', 'Lovens fulle navn', 'Gyldig fra', 'Gyldig til', 'Hierarki-sti', 'Sorteringsrekkefølge', 'Er aktiv'],
      ...data.provisions.map(prov => [
        prov.provision_type,
        prov.provision_number,
        prov.title,
        prov.content || '',
        prov.parent_provision_id || '',
        prov.law_identifier,
        prov.law_full_name || '',
        prov.valid_from || '',
        prov.valid_until || '',
        prov.hierarchy_path || '',
        prov.sort_order,
        prov.is_active
      ])
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(provisionsData), 'Bestemmelser');

    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  }

  static parseExcelFile(file: File): Promise<ExcelImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const result: ExcelImportResult = {
            documentTypes: [],
            documents: [],
            provisions: [],
            errors: []
          };

          // Parse Document Types
          if (workbook.SheetNames.includes('Dokumenttyper')) {
            const sheet = workbook.Sheets['Dokumenttyper'];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              try {
                const documentType: Partial<LegalDocumentType> = {
                  id: row[0]?.toString() || '',
                  name: row[1]?.toString() || '',
                  display_name: row[2]?.toString() || '',
                  description: row[3]?.toString() || '',
                  hierarchy_level: Number(row[4]) || 1,
                  authority_weight: Number(row[5]) || 0.5,
                  color: row[6]?.toString() || '#3B82F6',
                  icon: row[7]?.toString() || '',
                  is_active: Boolean(row[8]),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                if (documentType.id && documentType.name) {
                  result.documentTypes.push(documentType as LegalDocumentType);
                }
              } catch (error) {
                result.errors.push(`Feil i dokumenttype rad ${i + 1}: ${error}`);
              }
            }
          }

          // Parse Documents
          if (workbook.SheetNames.includes('Dokumenter')) {
            const sheet = workbook.Sheets['Dokumenter'];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              try {
                const document: Partial<LegalDocument> = {
                  id: crypto.randomUUID(),
                  title: row[0]?.toString() || '',
                  document_type_id: row[1]?.toString() || '',
                  document_number: row[2]?.toString() || '',
                  content: row[3]?.toString() || '',
                  summary: row[4]?.toString() || '',
                  publication_date: row[5]?.toString() || '',
                  effective_date: row[6]?.toString() || '',
                  expiry_date: row[7]?.toString() || '',
                  issuing_authority: row[8]?.toString() || '',
                  source_url: row[9]?.toString() || '',
                  document_status: row[10]?.toString() || 'active',
                  is_primary_source: Boolean(row[11]),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                if (document.title && document.content) {
                  result.documents.push(document as LegalDocument);
                }
              } catch (error) {
                result.errors.push(`Feil i dokument rad ${i + 1}: ${error}`);
              }
            }
          }

          // Parse Provisions
          if (workbook.SheetNames.includes('Bestemmelser')) {
            const sheet = workbook.Sheets['Bestemmelser'];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              try {
                const provision: Partial<LegalProvision> = {
                  id: crypto.randomUUID(),
                  provision_type: row[0]?.toString() || '',
                  provision_number: row[1]?.toString() || '',
                  title: row[2]?.toString() || '',
                  content: row[3]?.toString() || '',
                  parent_provision_id: row[4]?.toString() || '',
                  law_identifier: row[5]?.toString() || '',
                  law_full_name: row[6]?.toString() || '',
                  valid_from: row[7]?.toString() || '',
                  valid_until: row[8]?.toString() || '',
                  hierarchy_path: row[9]?.toString() || '',
                  sort_order: Number(row[10]) || 0,
                  is_active: Boolean(row[11]),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                if (provision.provision_type && provision.provision_number && provision.law_identifier) {
                  result.provisions.push(provision as LegalProvision);
                }
              } catch (error) {
                result.errors.push(`Feil i bestemmelse rad ${i + 1}: ${error}`);
              }
            }
          }

          resolve(result);
        } catch (error) {
          reject(new Error(`Feil ved parsing av Excel-fil: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Feil ved lesing av fil'));
      reader.readAsArrayBuffer(file);
    });
  }

  static downloadTemplate() {
    const workbook = this.generateTemplate();
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'juridisk-kunnskapsbase-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static downloadExport(data: ExcelExportData, filename: string = 'juridisk-kunnskapsbase-eksport') {
    const buffer = this.exportToExcel(data);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}