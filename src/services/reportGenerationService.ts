import { jsPDF } from 'jspdf';
import { ControlTestResult } from './controlTestSuite';
import { RiskScoringResults } from './riskScoringService';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'controls' | 'risk' | 'flow' | 'ai' | 'recommendations';
  includeCharts: boolean;
  includeDetails: boolean;
}

export interface ReportData {
  clientName: string;
  reportDate: string;
  fiscalYear: string;
  basicAnalysis: any;
  controlTests: ControlTestResult[];
  riskScoring: RiskScoringResults;
  aiAnalysis?: any;
  flowAnalysis?: any;
}

export interface GeneratedReport {
  title: string;
  sections: GeneratedSection[];
  summary: ReportSummary;
  recommendations: string[];
}

export interface GeneratedSection {
  title: string;
  content: string;
  charts?: any[];
  tables?: any[];
}

export interface ReportSummary {
  overallRisk: 'low' | 'medium' | 'high';
  criticalIssues: number;
  testsPassedPercentage: number;
  keyFindings: string[];
  actionRequired: boolean;
}

export class ReportGenerationService {
  
  private defaultTemplates: ReportTemplate[] = [
    {
      id: 'comprehensive',
      name: 'Omfattende revisjonrrapport',
      description: 'Fullstendig rapport med alle analyseresultater',
      sections: [
        { id: 'summary', title: 'Sammendrag', type: 'summary', includeCharts: true, includeDetails: false },
        { id: 'controls', title: 'Kontrolltester', type: 'controls', includeCharts: true, includeDetails: true },
        { id: 'risk', title: 'Risikoskåring', type: 'risk', includeCharts: true, includeDetails: true },
        { id: 'flow', title: 'Transaksjonsflyt', type: 'flow', includeCharts: true, includeDetails: false },
        { id: 'ai', title: 'AI-analyse', type: 'ai', includeCharts: false, includeDetails: true },
        { id: 'recommendations', title: 'Anbefalinger', type: 'recommendations', includeCharts: false, includeDetails: true }
      ]
    },
    {
      id: 'executive',
      name: 'Ledersammendrag',
      description: 'Kort rapport for ledelsen',
      sections: [
        { id: 'summary', title: 'Sammendrag', type: 'summary', includeCharts: true, includeDetails: false },
        { id: 'recommendations', title: 'Anbefalinger', type: 'recommendations', includeCharts: false, includeDetails: false }
      ]
    },
    {
      id: 'technical',
      name: 'Teknisk rapport',
      description: 'Detaljert teknisk analyse',
      sections: [
        { id: 'controls', title: 'Kontrolltester', type: 'controls', includeCharts: true, includeDetails: true },
        { id: 'risk', title: 'Risikoskåring', type: 'risk', includeCharts: true, includeDetails: true },
        { id: 'flow', title: 'Transaksjonsflyt', type: 'flow', includeCharts: true, includeDetails: true },
        { id: 'ai', title: 'AI-analyse', type: 'ai', includeCharts: false, includeDetails: true }
      ]
    }
  ];

  getAvailableTemplates(): ReportTemplate[] {
    return this.defaultTemplates;
  }

  async generateReport(data: ReportData, templateId: string): Promise<GeneratedReport> {
    const template = this.defaultTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const summary = this.generateSummary(data);
    const sections: GeneratedSection[] = [];

    for (const sectionConfig of template.sections) {
      const section = await this.generateSection(data, sectionConfig);
      sections.push(section);
    }

    const recommendations = this.generateRecommendations(data, summary);

    return {
      title: `${template.name} - ${data.clientName}`,
      sections,
      summary,
      recommendations
    };
  }

  private generateSummary(data: ReportData): ReportSummary {
    const totalTests = data.controlTests.length;
    const passedTests = data.controlTests.filter(test => test.passed).length;
    const criticalIssues = data.controlTests.filter(test => 
      !test.passed && test.severity === 'error'
    ).length;

    const highRiskCount = data.riskScoring.highRiskTransactions?.length || 0;
    const totalRiskTransactions = data.riskScoring.totalTransactions || 1;
    const overallRisk = highRiskCount / totalRiskTransactions;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (criticalIssues > 0 || overallRisk > 0.1) riskLevel = 'high';
    else if (overallRisk > 0.05) riskLevel = 'medium';

    const keyFindings: string[] = [];
    
    // Add control test findings
    if (criticalIssues > 0) {
      keyFindings.push(`${criticalIssues} kritiske kontrollsvikt identifisert`);
    }
    
    // Add risk findings
    const highRiskTransactions = data.riskScoring.highRiskTransactions?.length || 0;
    if (highRiskTransactions > 0) {
      keyFindings.push(`${highRiskTransactions} høyrisiko transaksjoner funnet`);
    }

    // Add AI findings
    if (data.aiAnalysis?.key_findings) {
      keyFindings.push(...data.aiAnalysis.key_findings.slice(0, 3));
    }

    return {
      overallRisk: riskLevel,
      criticalIssues,
      testsPassedPercentage: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100,
      keyFindings,
      actionRequired: criticalIssues > 0 || riskLevel === 'high'
    };
  }

  private async generateSection(data: ReportData, config: ReportSection): Promise<GeneratedSection> {
    switch (config.type) {
      case 'summary':
        return this.generateSummarySection(data, config);
      case 'controls':
        return this.generateControlsSection(data, config);
      case 'risk':
        return this.generateRiskSection(data, config);
      case 'flow':
        return this.generateFlowSection(data, config);
      case 'ai':
        return this.generateAISection(data, config);
      case 'recommendations':
        return this.generateRecommendationsSection(data, config);
      default:
        return { title: config.title, content: 'Seksjon ikke implementert' };
    }
  }

  private generateSummarySection(data: ReportData, config: ReportSection): GeneratedSection {
    const summary = this.generateSummary(data);
    
    let content = `
# Analyse sammendrag

**Klient:** ${data.clientName}
**Regnskapsår:** ${data.fiscalYear}
**Rapport generert:** ${data.reportDate}

## Hovedresultater

- **Overordnet risiko:** ${summary.overallRisk.toUpperCase()}
- **Kontrolltester:** ${summary.testsPassedPercentage}% bestått
- **Kritiske problemer:** ${summary.criticalIssues}
- **Transaksjoner analysert:** ${data.basicAnalysis?.total_transactions || 0}

## Viktigste funn

${summary.keyFindings.map(finding => `- ${finding}`).join('\n')}

${summary.actionRequired ? 
  '\n⚠️ **Handling kreves:** Det er identifisert kritiske problemer som krever umiddelbar oppmerksomhet.' : 
  '\n✅ **Status:** Ingen kritiske problemer identifisert.'
}
    `;

    return { title: config.title, content: content.trim() };
  }

  private generateControlsSection(data: ReportData, config: ReportSection): GeneratedSection {
    const { controlTests } = data;
    const passedTests = controlTests.filter(test => test.passed);
    const failedTests = controlTests.filter(test => !test.passed);
    const criticalFailures = failedTests.filter(test => test.severity === 'error');

    let content = `
# Kontrolltester

## Oversikt
- **Totalt tester:** ${controlTests.length}
- **Bestått:** ${passedTests.length}
- **Feilet:** ${failedTests.length}
- **Kritiske feil:** ${criticalFailures.length}

## Resultater per kategori
    `;

    if (config.includeDetails) {
      content += '\n### Kritiske kontrollsvikt\n';
      if (criticalFailures.length > 0) {
        criticalFailures.forEach(test => {
          content += `
**${test.testName}**
- Status: ${test.passed ? 'BESTÅTT' : 'FEILET'}
- Alvorlighetsgrad: ${test.severity}
- Beskrivelse: ${test.description}
- Detaljer: ${test.errorCount} feil funnet
          `;
        });
      } else {
        content += 'Ingen kritiske kontrollsvikt identifisert.\n';
      }

      content += '\n### Alle kontrolltester\n';
      controlTests.forEach(test => {
        const icon = test.passed ? '✅' : '❌';
        content += `${icon} **${test.testName}** - ${test.passed ? 'BESTÅTT' : 'FEILET'}\n`;
      });
    }

    return { title: config.title, content: content.trim() };
  }

  private generateRiskSection(data: ReportData, config: ReportSection): GeneratedSection {
    const { riskScoring } = data;
    
    let content = `
# Risikoskåring

## Overordnet risiko
- **Høyrisiko transaksjoner:** ${data.riskScoring.highRiskTransactions?.length || 0}
- **Totale transaksjoner:** ${data.riskScoring.totalTransactions}
- **Risikoandel:** ${((data.riskScoring.highRiskTransactions?.length || 0) / data.riskScoring.totalTransactions * 100).toFixed(1)}%

## Risikofaktorer
    `;

    if (data.riskScoring.topRiskFactors) {
      data.riskScoring.topRiskFactors.forEach(item => {
        content += `- **${item.factor.name}:** ${item.frequency} tilfeller\n`;
      });
    }

    if (config.includeDetails && data.riskScoring.highRiskTransactions) {
      const highRiskTransactions = data.riskScoring.highRiskTransactions;
      
      content += `\n## Høyrisiko transaksjoner\n`;
      if (highRiskTransactions.length > 0) {
        content += `Identifisert ${highRiskTransactions.length} transaksjoner med høy risiko:\n\n`;
        highRiskTransactions.slice(0, 10).forEach((transaction, index) => {
          content += `${index + 1}. **${transaction.description}** - ${transaction.riskLevel.toUpperCase()}\n`;
          content += `   Beløp: ${transaction.amount?.toLocaleString('nb-NO')} kr\n`;
          content += `   Score: ${transaction.totalScore} poeng\n\n`;
        });
      } else {
        content += 'Ingen høyrisiko transaksjoner identifisert.\n';
      }
    }

    return { title: config.title, content: content.trim() };
  }

  private generateFlowSection(data: ReportData, config: ReportSection): GeneratedSection {
    let content = `
# Transaksjonsflyt

## Flytanalyse
Transaksjonsflyt-analysen viser hvordan penger beveger seg mellom ulike kontoer og audit areas.
    `;

    if (data.flowAnalysis) {
      content += `
- **Totale flyter:** ${data.flowAnalysis.totalFlows || 0}
- **Uvanlige flyter:** ${data.flowAnalysis.unusualFlows?.length || 0}
- **Audit areas involvert:** ${data.flowAnalysis.auditAreas?.length || 0}
      `;

      if (data.flowAnalysis.unusualFlows?.length > 0) {
        content += '\n## Uvanlige transaksjonsflyter\n';
        data.flowAnalysis.unusualFlows.slice(0, 5).forEach((flow: any, index: number) => {
          content += `${index + 1}. ${flow.fromAccount} → ${flow.toAccount}: ${flow.totalAmount?.toLocaleString('nb-NO')} kr\n`;
        });
      }
    }

    return { title: config.title, content: content.trim() };
  }

  private generateAISection(data: ReportData, config: ReportSection): GeneratedSection {
    const { aiAnalysis } = data;
    
    let content = `
# AI-analyse

## AI-drevet innsikt
Artificial Intelligence har analysert transaksjonsdataene for mønstre, anomalier og potensielle risikoer.
    `;

    if (aiAnalysis) {
      if (aiAnalysis.confidence_score) {
        content += `\n**Konfidensgrad:** ${(aiAnalysis.confidence_score * 100).toFixed(1)}%\n`;
      }

      if (aiAnalysis.key_findings?.length > 0) {
        content += '\n## Hovedfunn\n';
        aiAnalysis.key_findings.forEach((finding: string, index: number) => {
          content += `${index + 1}. ${finding}\n`;
        });
      }

      if (aiAnalysis.anomalies?.length > 0) {
        content += '\n## Identifiserte anomalier\n';
        aiAnalysis.anomalies.forEach((anomaly: any, index: number) => {
          content += `**${index + 1}. ${anomaly.type}**\n`;
          content += `- Beskrivelse: ${anomaly.description}\n`;
          content += `- Konfidensgrad: ${(anomaly.confidence * 100).toFixed(1)}%\n\n`;
        });
      }

      if (aiAnalysis.patterns?.length > 0) {
        content += '\n## Identifiserte mønstre\n';
        aiAnalysis.patterns.forEach((pattern: any, index: number) => {
          content += `${index + 1}. ${pattern.description}\n`;
        });
      }
    } else {
      content += '\nAI-analyse ikke tilgjengelig for denne rapporten.';
    }

    return { title: config.title, content: content.trim() };
  }

  private generateRecommendationsSection(data: ReportData, config: ReportSection): GeneratedSection {
    const recommendations = this.generateRecommendations(data, this.generateSummary(data));
    
    let content = `
# Anbefalinger

Basert på analyseresultatene, anbefaler vi følgende tiltak:

${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n\n')}
    `;

    return { title: config.title, content: content.trim() };
  }

  private generateRecommendations(data: ReportData, summary: ReportSummary): string[] {
    const recommendations: string[] = [];

    // Critical control failures
    const criticalFailures = data.controlTests.filter(test => 
      !test.passed && test.severity === 'error'
    );
    
    if (criticalFailures.length > 0) {
      recommendations.push(
        `**Kritisk:** Adresser umiddelbart ${criticalFailures.length} kritiske kontrollsvikt. Dette inkluderer ${criticalFailures.map(f => f.testName).join(', ')}.`
      );
    }

    // High risk transactions
    const highRiskTransactions = data.riskScoring.highRiskTransactions?.length || 0;
    if (highRiskTransactions > 0) {
      recommendations.push(
        `Gjennomgå ${highRiskTransactions} høyrisiko transaksjoner for å verifisere legitimitet og fullstendighet.`
      );
    }

    // Overall risk level
    if (summary.overallRisk === 'high') {
      recommendations.push(
        'Implementer økt overvåking og kontrollfrekvens grunnet høy overordnet risiko.'
      );
    }

    // AI recommendations
    if (data.aiAnalysis?.recommendations?.length > 0) {
      recommendations.push(...data.aiAnalysis.recommendations);
    }

    // Control test pass rate
    if (summary.testsPassedPercentage < 80) {
      recommendations.push(
        'Forbedre interne kontroller - mindre enn 80% av kontrolltestrene bestod.'
      );
    }

    // Default recommendations if none specific
    if (recommendations.length === 0) {
      recommendations.push(
        'Fortsett med eksisterende kontrollregime. Ingen kritiske problemer identifisert.',
        'Vurder regelmessig gjennomgang av kontrolleffektivitet.',
        'Oppretthold god dokumentasjon av alle kontrollaktiviteter.'
      );
    }

    return recommendations;
  }

  async exportToPDF(report: GeneratedReport): Promise<Blob> {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Title
    doc.setFontSize(20);
    doc.text(report.title, margin, yPosition);
    yPosition += 20;

    // Summary
    doc.setFontSize(14);
    doc.text('Sammendrag', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Overordnet risiko: ${report.summary.overallRisk.toUpperCase()}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Kontrolltester: ${report.summary.testsPassedPercentage}% bestått`, margin, yPosition);
    yPosition += 8;
    doc.text(`Kritiske problemer: ${report.summary.criticalIssues}`, margin, yPosition);
    yPosition += 15;

    // Sections
    for (const section of report.sections) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(section.title, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const lines = section.content.split('\n');
      for (const line of lines) {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        if (line.trim()) {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        } else {
          yPosition += 3;
        }
      }
      yPosition += 10;
    }

    return doc.output('blob');
  }
}

export const reportGenerationService = new ReportGenerationService();