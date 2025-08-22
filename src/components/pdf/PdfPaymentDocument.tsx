import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { BilagPayload } from '@/types/bilag';

interface PdfPaymentDocumentProps {
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
    marginBottom: 30,
  },
  companyInfo: {
    width: '50%',
  },
  documentInfo: {
    width: '50%',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#059669',
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
  receiptBox: {
    border: '2 solid #059669',
    borderRadius: 5,
    padding: 20,
    marginTop: 30,
    backgroundColor: '#f0fdf4',
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#059669',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '0.5 solid #d1d5db',
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '40%',
  },
  receiptValue: {
    fontSize: 12,
    width: '60%',
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTop: '2 solid #059669',
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  metaInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginTop: 30,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  metaLabel: {
    width: '30%',
    fontWeight: 'bold',
  },
  metaValue: {
    width: '70%',
  },
  noteBox: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fffbeb',
    border: '1 solid #f59e0b',
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#92400e',
  },
  noteText: {
    fontSize: 10,
    color: '#92400e',
    fontStyle: 'italic',
  },
});

export const PdfPaymentDocument: React.FC<PdfPaymentDocumentProps> = ({ payload }) => {
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

  const getPaymentTypeTitle = () => {
    switch (payload.type) {
      case 'kundebetaling':
        return 'KUNDEBETALING';
      case 'leverandorbetaling':
        return 'LEVERANDØRBETALING';
      case 'bankbilag':
        return 'BANKBILAG';
      default:
        return 'BETALINGSBILAG';
    }
  };

  const getTransactionDescription = () => {
    switch (payload.type) {
      case 'kundebetaling':
        return 'Innbetaling fra kunde';
      case 'leverandorbetaling':
        return 'Utbetaling til leverandør';
      case 'bankbilag':
        return 'Banktransaksjon';
      default:
        return 'Betalingstransaksjon';
    }
  };

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
          </View>
          
          <View style={styles.documentInfo}>
            <Text style={styles.title}>{getPaymentTypeTitle()}</Text>
          </View>
        </View>

        {/* Receipt Box */}
        <View style={styles.receiptBox}>
          <Text style={styles.receiptTitle}>KVITTERING</Text>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Transaksjon:</Text>
            <Text style={styles.receiptValue}>{getTransactionDescription()}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Dato:</Text>
            <Text style={styles.receiptValue}>{formatDate(payload.dato)}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Bilag:</Text>
            <Text style={styles.receiptValue}>{payload.bilag}</Text>
          </View>
          
          {payload.doknr && (
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Dokumentnr:</Text>
              <Text style={styles.receiptValue}>{payload.doknr}</Text>
            </View>
          )}
          
          {payload.motpart && (
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>
                {payload.type === 'kundebetaling' ? 'Fra kunde:' : 'Til motpart:'}
              </Text>
              <Text style={styles.receiptValue}>{payload.motpart}</Text>
            </View>
          )}
          
          {payload.referanse && (
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Referanse:</Text>
              <Text style={styles.receiptValue}>{payload.referanse}</Text>
            </View>
          )}
          
          {payload.kid && (
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>KID:</Text>
              <Text style={styles.receiptValue}>{payload.kid}</Text>
            </View>
          )}
          
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Beløp:</Text>
            <Text style={styles.amountValue}>
              {payload.belop ? formatCurrency(payload.belop) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Additional metadata */}
        <View style={styles.metaInfo}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
            Tilleggsinformasjon
          </Text>
          
          {payload.bankkonto && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Bankkonto:</Text>
              <Text style={styles.metaValue}>{payload.bankkonto}</Text>
            </View>
          )}
          
          {payload.iban && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>IBAN:</Text>
              <Text style={styles.metaValue}>{payload.iban}</Text>
            </View>
          )}
          
          {payload.bic && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>BIC:</Text>
              <Text style={styles.metaValue}>{payload.bic}</Text>
            </View>
          )}
          
          {payload.valuta && payload.valuta !== 'NOK' && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Valuta:</Text>
              <Text style={styles.metaValue}>{payload.valuta}</Text>
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
        </View>

        {/* Note */}
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Merk:</Text>
          <Text style={styles.noteText}>
            Dette er en automatisk generert kvittering basert på regnskapsdata. 
            Kvitteringen bekrefter registrert betaling i regnskapsystemet.
          </Text>
        </View>
      </Page>
    </Document>
  );
};