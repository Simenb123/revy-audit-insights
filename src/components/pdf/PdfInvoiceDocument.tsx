import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { BilagPayload } from '@/types/bilag';
import { LinesTable } from './LinesTable';
import { formatDateForDisplay } from '@/utils/pdf-import';
import { round2 } from '@/utils/money';

interface PdfInvoiceDocumentProps {
  payload: BilagPayload;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 35,
    paddingLeft: 35,
    paddingRight: 35,
    paddingBottom: 65,
  },
  // Header section with two columns
  header: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  issuerSection: {
    width: '50%',
    paddingRight: 20,
  },
  metaSection: {
    width: '50%',
    paddingLeft: 20,
  },
  issuerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  issuerDetails: {
    fontSize: 10,
    marginBottom: 2,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
  },
  salesInvoiceTitle: {
    color: '#059669',
  },
  purchaseInvoiceTitle: {
    color: '#2563eb',
  },
  creditNoteTitle: {
    color: '#dc2626',
  },
  // Meta information box
  metaBox: {
    border: '1 solid #e5e5e5',
    padding: 15,
    backgroundColor: '#fafafa',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  metaLabel: {
    width: '40%',
    fontWeight: 'bold',
    fontSize: 9,
  },
  metaValue: {
    width: '60%',
    fontSize: 9,
  },
  // Customer/Supplier section
  partySection: {
    marginBottom: 30,
  },
  partyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  partyBox: {
    border: '1 solid #d1d5db',
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  partyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  partyDetails: {
    fontSize: 10,
    marginBottom: 2,
  },
  // Content area with line items and totals
  contentArea: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  linesSection: {
    width: '65%',
    paddingRight: 20,
  },
  totalsSection: {
    width: '35%',
  },
  // Totals box (Clean original style)
  totalsBox: {
    border: '1 solid #d1d5db',
    padding: 12,
    backgroundColor: '#ffffff',
  },
  totalsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1 solid #d1d5db',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'normal',
    color: '#374151',
  },
  totalLabelFinal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  totalAmount: {
    fontSize: 10,
    textAlign: 'right',
    color: '#374151',
  },
  totalAmountFinal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'right',
  },
  // Payment information box
  paymentSection: {
    marginTop: 30,
  },
  paymentBox: {
    border: '1 solid #f59e0b',
    padding: 15,
    backgroundColor: '#fffbeb',
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#92400e',
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  paymentLabel: {
    width: '40%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentValue: {
    width: '60%',
    fontSize: 10,
  },
});

export const PdfInvoiceDocument: React.FC<PdfInvoiceDocumentProps> = ({ payload }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('NOK', 'kr');
  };

  const formatDate = (dateStr: string) => {
    return formatDateForDisplay(dateStr);
  };

  // Determine document properties
  const isVendorInvoice = payload.type === 'leverandorfaktura';
  const isCreditNote = payload.dokumenttype === 'kreditnota';
  
  // Calculate totals
  const lines = payload.linjer || [];
  const totalNetto = lines.reduce((sum, line) => sum + line.netto, 0);
  const totalMva = lines.reduce((sum, line) => sum + (line.mva || 0), 0);
  const totalBrutto = totalNetto + totalMva;

  // Determine issuer and counterparty
  let issuer, issuerOrgnr, issuerAddress, counterparty, counterpartyTitle;
  
  if (isVendorInvoice) {
    // For vendor invoices, supplier is the issuer
    issuer = payload.motpart || 'Leverandør';
    issuerOrgnr = payload.motpartOrgnr;
    issuerAddress = payload.motpartAdresse;
    counterparty = payload.selskap.navn;
    counterpartyTitle = 'Kjøper';
  } else {
    // For sales invoices, our company is the issuer
    issuer = payload.selskap.navn;
    issuerOrgnr = payload.selskap.orgnr;
    issuerAddress = payload.selskap.adresse;
    counterparty = payload.motpart || 'Kunde';
    counterpartyTitle = 'Kunde';
  }

  // Document title based on type and credit note status
  const getDocumentTitle = () => {
    if (isCreditNote) {
      return { text: 'KREDITNOTA', style: styles.creditNoteTitle };
    }
    if (isVendorInvoice) {
      return { text: 'INNKJØPSFAKTURA', style: styles.purchaseInvoiceTitle };
    }
    return { text: 'FAKTURA', style: styles.salesInvoiceTitle };
  };

  const docTitle = getDocumentTitle();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* Issuer Information */}
          <View style={styles.issuerSection}>
            <Text style={styles.issuerName}>{issuer}</Text>
            {issuerOrgnr && (
              <Text style={styles.issuerDetails}>Org.nr: {issuerOrgnr}</Text>
            )}
            {issuerAddress && (
              <Text style={styles.issuerDetails}>{issuerAddress}</Text>
            )}
            {payload.selskap.mvaRegistrert && (
              <Text style={styles.issuerDetails}>MVA registrert</Text>
            )}
          </View>

          {/* Document Title and Meta Information */}
          <View style={styles.metaSection}>
            <Text style={[styles.documentTitle, docTitle.style]}>
              {docTitle.text}
            </Text>
            
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Dok.nr:</Text>
                <Text style={styles.metaValue}>{payload.doknr}</Text>
              </View>
              
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Dato:</Text>
                <Text style={styles.metaValue}>{formatDate(payload.dato)}</Text>
              </View>
              
              {payload.forfall && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Forfall:</Text>
                  <Text style={styles.metaValue}>{formatDate(payload.forfall)}</Text>
                </View>
              )}
              
              {payload.levering && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Levering:</Text>
                  <Text style={styles.metaValue}>{formatDate(payload.levering)}</Text>
                </View>
              )}
              
              {payload.ordrenr && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Ordrenr:</Text>
                  <Text style={styles.metaValue}>{payload.ordrenr}</Text>
                </View>
              )}
              
              {payload.prosjektnr && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Prosjektnr:</Text>
                  <Text style={styles.metaValue}>{payload.prosjektnr}</Text>
                </View>
              )}
              
              {payload.referanse && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Referanse:</Text>
                  <Text style={styles.metaValue}>{payload.referanse}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Counterparty Section */}
        <View style={styles.partySection}>
          <Text style={styles.partyTitle}>{counterpartyTitle}</Text>
          <View style={styles.partyBox}>
            <Text style={styles.partyName}>{counterparty}</Text>
            {(isVendorInvoice ? payload.selskap.orgnr : payload.motpartOrgnr) && (
              <Text style={styles.partyDetails}>
                Org.nr: {isVendorInvoice ? payload.selskap.orgnr : payload.motpartOrgnr}
              </Text>
            )}
            {(isVendorInvoice ? payload.selskap.adresse : payload.motpartAdresse) && (
              <Text style={styles.partyDetails}>
                {isVendorInvoice ? payload.selskap.adresse : payload.motpartAdresse}
              </Text>
            )}
          </View>
        </View>

        {/* Content Area: Line Items and Totals */}
        <View style={styles.contentArea}>
          {/* Line Items Table */}
          <View style={styles.linesSection}>
            <LinesTable lines={lines} />
          </View>

          {/* Totals Box (Tripletex Style) */}
          <View style={styles.totalsSection}>
            <View style={styles.totalsBox}>
              <Text style={styles.totalsTitle}>Totaler</Text>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sum eks mva</Text>
                <Text style={styles.totalAmount}>{formatCurrency(totalNetto)}</Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>MVA</Text>
                <Text style={styles.totalAmount}>{formatCurrency(totalMva)}</Text>
              </View>
              
              <View style={styles.totalRowFinal}>
                <Text style={styles.totalLabelFinal}>Å betale</Text>
                <Text style={styles.totalAmountFinal}>{formatCurrency(totalBrutto)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        {(payload.forfall || payload.kid || payload.bankkonto || payload.iban) && (
          <View style={styles.paymentSection}>
            <View style={styles.paymentBox}>
              <Text style={styles.paymentTitle}>Betalingsinformasjon</Text>
              
              {payload.forfall && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Betalingsfrist:</Text>
                  <Text style={styles.paymentValue}>{formatDate(payload.forfall)}</Text>
                </View>
              )}
              
              {payload.kid && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>KID:</Text>
                  <Text style={styles.paymentValue}>{payload.kid}</Text>
                </View>
              )}
              
              {payload.referanse && !payload.kid && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Referanse:</Text>
                  <Text style={styles.paymentValue}>{payload.referanse}</Text>
                </View>
              )}
              
              {payload.bankkonto && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Bankkonto:</Text>
                  <Text style={styles.paymentValue}>{payload.bankkonto}</Text>
                </View>
              )}
              
              {payload.iban && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>IBAN:</Text>
                  <Text style={styles.paymentValue}>{payload.iban}</Text>
                </View>
              )}
              
              {payload.bic && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>BIC:</Text>
                  <Text style={styles.paymentValue}>{payload.bic}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* MVA Note */}
        {payload.mvaMerknad && (
          <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 9, fontStyle: 'italic' }}>
              MVA-merknad: {payload.mvaMerknad}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};