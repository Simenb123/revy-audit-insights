import * as XLSX from 'xlsx';
import { LegalProvision } from '@/types/legal-knowledge';

export interface LawStructureImportResult {
  chapters: Partial<LegalProvision>[];
  provisions: Partial<LegalProvision>[];
  errors: string[];
}

export interface ChapterData {
  provision_type: 'kapittel';
  provision_number: string;
  title: string;
  content?: string;
  hierarchy_path: string;
  sort_order: number;
}

export interface ProvisionData {
  provision_type: 'paragraf' | 'ledd' | 'punkt';
  provision_number: string;
  title: string;
  content: string;
  parent_provision_id?: string;
  hierarchy_path: string;
  sort_order: number;
}

export class LawSpecificExcelService {
  
  /**
   * Generate a law-specific Excel template with only 2 tabs
   */
  static generateLawTemplate(lawIdentifier: string, lawFullName: string): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // Chapters Sheet - simplified structure
    const chaptersData = [
      ['Kapittelnummer', 'Kapittel tittel', 'Beskrivelse', 'Sorteringsrekkefølge'],
      ['1', 'Innledende bestemmelser', 'Formål og virkeområde', 1],
      ['2', 'Krav til årsregnskap', 'Generelle regnskapskrav', 2],
      ['3', 'Resultatregnskap', 'Bestemmelser om resultatregnskap', 3],
      ['4', 'Balanse', 'Bestemmelser om balanse', 4]
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(chaptersData), 'Kapitler');

    // Provisions Sheet - simplified structure  
    const provisionsData = [
      ['Kapittelnr', 'Paragrafnr', 'Tittel', 'Paragraftekst', 'Type', 'Sortering'],
      ['1', '1-1', 'Formål', 'Formålet med denne loven er å sikre...', 'paragraf', 1],
      ['1', '1-2', 'Virkeområde', 'Loven gjelder for...', 'paragraf', 2],
      ['1', '1-3', 'Definisjoner', 'I denne loven betyr...', 'paragraf', 3],
      ['2', '2-1', 'Regnskapsplikt', 'Regnskapspliktige skal...', 'paragraf', 4],
      ['2', '2-2', 'Regnskapsår', 'Regnskapsåret er...', 'paragraf', 5]
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(provisionsData), 'Paragrafer');

    return workbook;
  }

  /**
   * Parse law-specific Excel file with simplified structure
   */
  static parseLawStructureExcel(file: File, lawIdentifier: string): Promise<LawStructureImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const result: LawStructureImportResult = {
            chapters: [],
            provisions: [],
            errors: []
          };

          // Parse Chapters
          if (workbook.SheetNames.includes('Kapitler')) {
            const sheet = workbook.Sheets['Kapitler'];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              try {
                const chapterNumber = row[0]?.toString().trim();
                const title = row[1]?.toString().trim();
                const content = row[2]?.toString().trim() || '';
                const sortOrder = Number(row[3]) || i;
                
                if (!chapterNumber || !title) {
                  result.errors.push(`Kapittel rad ${i + 1}: Mangler kapittelnummer eller tittel`);
                  continue;
                }

                const chapter: Partial<LegalProvision> = {
                  id: crypto.randomUUID(),
                  provision_type: 'kapittel',
                  provision_number: chapterNumber,
                  title: title,
                  content: content,
                  law_identifier: lawIdentifier,
                  hierarchy_path: `${lawIdentifier}.kap${chapterNumber}`,
                  sort_order: sortOrder,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                result.chapters.push(chapter);
              } catch (error) {
                result.errors.push(`Feil i kapittel rad ${i + 1}: ${error}`);
              }
            }
          } else {
            result.errors.push('Mangler "Kapitler" fane i Excel-filen');
          }

          // Parse Provisions
          if (workbook.SheetNames.includes('Paragrafer')) {
            const sheet = workbook.Sheets['Paragrafer'];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              try {
                const chapterNumber = row[0]?.toString().trim();
                const provisionNumber = row[1]?.toString().trim();
                const title = row[2]?.toString().trim();
                const content = row[3]?.toString().trim() || '';
                const provisionType = row[4]?.toString().trim() || 'paragraf';
                const sortOrder = Number(row[5]) || i;
                
                if (!chapterNumber || !provisionNumber || !title) {
                  result.errors.push(`Paragraf rad ${i + 1}: Mangler nødvendige felt`);
                  continue;
                }

                // Find parent chapter ID
                const parentChapter = result.chapters.find(
                  ch => ch.provision_number === chapterNumber
                );

                const provision: Partial<LegalProvision> = {
                  id: crypto.randomUUID(),
                  provision_type: provisionType as any,
                  provision_number: provisionNumber,
                  title: title,
                  content: content,
                  parent_provision_id: parentChapter?.id,
                  law_identifier: lawIdentifier,
                  hierarchy_path: `${lawIdentifier}.kap${chapterNumber}.§${provisionNumber}`,
                  sort_order: sortOrder,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                result.provisions.push(provision);
              } catch (error) {
                result.errors.push(`Feil i paragraf rad ${i + 1}: ${error}`);
              }
            }
          } else {
            result.errors.push('Mangler "Paragrafer" fane i Excel-filen');
          }

          // Validate hierarchy
          this.validateHierarchy(result);
          
          resolve(result);
        } catch (error) {
          reject(new Error(`Feil ved parsing av Excel-fil: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Feil ved lesing av fil'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Validate the hierarchy structure
   */
  private static validateHierarchy(result: LawStructureImportResult) {
    // Check that all provisions have valid parent chapters
    result.provisions.forEach((provision, index) => {
      if (!provision.parent_provision_id) {
        const chapterNumber = provision.hierarchy_path?.split('.kap')[1]?.split('.')[0];
        if (chapterNumber) {
          const chapter = result.chapters.find(ch => ch.provision_number === chapterNumber);
          if (!chapter) {
            result.errors.push(
              `Paragraf ${provision.provision_number}: Refererer til ukjent kapittel ${chapterNumber}`
            );
          }
        }
      }
    });

    // Check for duplicate provision numbers within same chapter
    const provisionsByChapter = result.provisions.reduce((acc, provision) => {
      const chapterNum = provision.hierarchy_path?.split('.kap')[1]?.split('.')[0] || '';
      if (!acc[chapterNum]) acc[chapterNum] = [];
      acc[chapterNum].push(provision);
      return acc;
    }, {} as Record<string, typeof result.provisions>);

    Object.entries(provisionsByChapter).forEach(([chapterNum, provisions]) => {
      const numbers = provisions.map(p => p.provision_number);
      const duplicates = numbers.filter((num, index) => numbers.indexOf(num) !== index);
      if (duplicates.length > 0) {
        result.errors.push(
          `Kapittel ${chapterNum}: Duplikate paragrafnummer: ${[...new Set(duplicates)].join(', ')}`
        );
      }
    });
  }

  /**
   * Download law-specific template
   */
  static downloadTemplate(lawIdentifier: string, lawFullName: string) {
    const workbook = this.generateLawTemplate(lawIdentifier, lawFullName);
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lawIdentifier}-template.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export existing law structure
   */
  static exportLawStructure(
    lawIdentifier: string, 
    chapters: LegalProvision[], 
    provisions: LegalProvision[]
  ) {
    const workbook = XLSX.utils.book_new();

    // Export chapters
    const chaptersData = [
      ['Kapittelnummer', 'Kapittel tittel', 'Beskrivelse', 'Sorteringsrekkefølge'],
      ...chapters.map(ch => [
        ch.provision_number,
        ch.title,
        ch.content || '',
        ch.sort_order
      ])
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(chaptersData), 'Kapitler');

    // Export provisions
    const provisionsData = [
      ['Kapittelnr', 'Paragrafnr', 'Tittel', 'Paragraftekst', 'Type', 'Sortering'],
      ...provisions.map(prov => {
        const chapterNum = prov.hierarchy_path?.split('.kap')[1]?.split('.')[0] || '';
        return [
          chapterNum,
          prov.provision_number,
          prov.title,
          prov.content || '',
          prov.provision_type,
          prov.sort_order
        ];
      })
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(provisionsData), 'Paragrafer');

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lawIdentifier}-eksport.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}