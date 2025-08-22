import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { BilagPayload } from '@/types/bilag';
import { LinesTable } from './LinesTable';

interface PdfInvoiceDocumentProps {
  payload: BilagPayload;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 35,
    paddingLeft: 35,
    paddingRight: 35,
    paddingBottom: 65,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  companyInfo: {
    width: '50%',
  },
  documentInfo: {
    width: '50%',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2563eb',
  },
  creditNoteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#dc2626',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 11,
    marginBottom: 3,
  },
  metaInfo: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLabel: {
    width: '40%',
    fontWeight: 'bold',
  },
  metaValue: {
    width: '60%',
  },
  customerBox: {
    border: '1 solid #ccc',
    padding: 15,
    marginBottom: 20,
  },
  customerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  totalsBox: {
    width: '40%',
    marginLeft: 'auto',
    marginTop: 20,
    border: '1 solid #ccc',
    padding: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1 solid #000',
    paddingTop: 5,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  paymentBox: {
    border: '1 solid #ccc',
    padding: 15,
    marginTop: 20,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('nb-NO');
  };

  const isKreditnota = payload.dokumenttype === 'kreditnota';
  const totalNetto = payload.linjer?.reduce((sum, line) => sum + line.netto, 0) || 0;
  const totalMva = payload.linjer?.reduce((sum, line) => sum + (line.mva || 0), 0) || 0;
  const totalBrutto = totalNetto + totalMva;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{payload.selskap.navn}</Text>
            {payload.selskap.orgnr && (
              <Text style={styles.text}>Org.nr: {payload.selskap.orgnr}</Text>
            )}
            {payload.selskap.adresse && (
              <Text style={styles.text}>{payload.selskap.adresse}</Text>
            )}
            {payload.selskap.mvaRegistrert && (
              <Text style={styles.text}>MVA-registrert</Text>
            )}
          </View>
          
          <View style={styles.documentInfo}>
            <Text style={isKreditnota ? styles.creditNoteTitle : styles.title}>
              {isKreditnota ? 'KREDITNOTA' : 
               payload.type === 'salgsfaktura' ? 'FAKTURA' : 'INNKJØPSFAKTURA'}
            </Text>
          </View>
        </View>

        {/* Document metadata */}
        <View style={styles.metaInfo}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Dokumentnr:</Text>
            <Text style={styles.metaValue}>{payload.doknr}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Bilag:</Text>
            <Text style={styles.metaValue}>{payload.bilag}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Dato:</Text>
            <Text style={styles.metaValue}>{formatDate(payload.dato)}</Text>
          </View>
          {payload.forfall && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Forfallsdato:</Text>
              <Text style={styles.metaValue}>{formatDate(payload.forfall)}</Text>
            </View>
          )}
          {payload.levering && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Leveringsdato:</Text>
              <Text style={styles.metaValue}>{formatDate(payload.levering)}</Text>
            </View>
          )}
          {payload.ordrenr && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Ordrenr:</Text>
              <Text style={styles.metaValue}>{payload.ordrenr}</Text>
            </View>
          )}
        </View>

        {/* Customer/Supplier info */}
        {payload.motpart && (
          <View style={styles.customerBox}>
            <Text style={styles.customerTitle}>
              {payload.type === 'salgsfaktura' ? 'Kunde:' : 'Leverandør:'}
            </Text>
            <Text style={styles.text}>{payload.motpart}</Text>
            {payload.motpartAdresse && (
              <Text style={styles.text}>{payload.motpartAdresse}</Text>
            )}
            {payload.motpartOrgnr && (
              <Text style={styles.text}>Org.nr: {payload.motpartOrgnr}</Text>
            )}
          </View>
        )}

        {/* Lines table */}
        {payload.linjer && payload.linjer.length > 0 && (
          <LinesTable lines={payload.linjer} />
        )}

        {/* Totals box */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sum eks mva:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalNetto)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>MVA:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalMva)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>
              {isKreditnota ? 'Å kreditere:' : 'Å betale:'}
            </Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(totalBrutto)}</Text>
          </View>
        </View>

        {/* Payment info */}
        {(payload.kid || payload.bankkonto || payload.iban) && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>Betalingsinformasjon</Text>
            {payload.forfall && (
              <Text style={styles.text}>Betalingsfrist: {formatDate(payload.forfall)}</Text>
            )}
            {payload.kid && (
              <Text style={styles.text}>KID: {payload.kid}</Text>
            )}
            {payload.bankkonto && (
              <Text style={styles.text}>Bankkonto: {payload.bankkonto}</Text>
            )}
            {payload.iban && (
              <Text style={styles.text}>IBAN: {payload.iban}</Text>
            )}
            {payload.bic && (
              <Text style={styles.text}>BIC: {payload.bic}</Text>
            )}
          </View>
        )}

        {/* VAT note */}
        {payload.mvaMerknad && (
          <View style={{ marginTop: 20, fontSize: 9, fontStyle: 'italic' }}>
            <Text>{payload.mvaMerknad}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};