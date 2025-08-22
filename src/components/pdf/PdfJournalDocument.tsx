import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { BilagPayload } from '@/types/bilag';

interface PdfJournalDocumentProps {
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
    color: '#7c3aed',
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
    padding: 15,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLabel: {
    width: '30%',
    fontWeight: 'bold',
  },
  metaValue: {
    width: '70%',
  },
  table: {
    width: '100%',
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottom: '1 solid #000',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #ccc',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  col1: { width: '15%' }, // Konto
  col2: { width: '25%' }, // Kontonavn
  col3: { width: '35%' }, // Beskrivelse
  col4: { width: '12.5%', textAlign: 'right' }, // Debet
  col5: { width: '12.5%', textAlign: 'right' }, // Kredit
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cellText: {
    fontSize: 9,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderTop: '1 solid #000',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 5,
  },
  totalText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  balanceNote: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fef3c7',
    border: '1 solid #f59e0b',
  },
  balanceNoteText: {
    fontSize: 10,
    color: '#92400e',
  },
});

export const PdfJournalDocument: React.FC<PdfJournalDocumentProps> = ({ payload }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount)).replace('NOK', 'kr');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nb-NO');
  };

  const totalDebet = payload.poster?.reduce((sum, post) => sum + (post.debet || 0), 0) || 0;
  const totalKredit = payload.poster?.reduce((sum, post) => sum + (post.kredit || 0), 0) || 0;
  const isBalanced = Math.abs(totalDebet - totalKredit) < 0.01;

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
            <Text style={styles.title}>DIVERSEBILAG</Text>
          </View>
        </View>

        {/* Document metadata */}
        <View style={styles.metaInfo}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Bilag:</Text>
            <Text style={styles.metaValue}>{payload.bilag}</Text>
          </View>
          {payload.doknr && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Dokumentnr:</Text>
              <Text style={styles.metaValue}>{payload.doknr}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Dato:</Text>
            <Text style={styles.metaValue}>{formatDate(payload.dato)}</Text>
          </View>
          {payload.referanse && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Referanse:</Text>
              <Text style={styles.metaValue}>{payload.referanse}</Text>
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

        {/* Journal entries table */}
        {payload.poster && payload.poster.length > 0 && (
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.col1]}>Konto</Text>
              <Text style={[styles.headerText, styles.col2]}>Kontonavn</Text>
              <Text style={[styles.headerText, styles.col3]}>Beskrivelse</Text>
              <Text style={[styles.headerText, styles.col4]}>Debet</Text>
              <Text style={[styles.headerText, styles.col5]}>Kredit</Text>
            </View>
            
            {/* Rows */}
            {payload.poster.map((post, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.col1]}>{post.konto}</Text>
                <Text style={[styles.cellText, styles.col2]}>{post.kontonavn || ''}</Text>
                <Text style={[styles.cellText, styles.col3]}>{post.beskrivelse || ''}</Text>
                <Text style={[styles.cellText, styles.col4]}>
                  {post.debet && post.debet !== 0 ? formatCurrency(post.debet) : ''}
                </Text>
                <Text style={[styles.cellText, styles.col5]}>
                  {post.kredit && post.kredit !== 0 ? formatCurrency(post.kredit) : ''}
                </Text>
              </View>
            ))}
            
            {/* Totals */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalText, { width: '70%' }]}>Totaler:</Text>
              <Text style={[styles.totalText, styles.col4]}>{formatCurrency(totalDebet)}</Text>
              <Text style={[styles.totalText, styles.col5]}>{formatCurrency(totalKredit)}</Text>
            </View>
          </View>
        )}

        {/* Balance validation */}
        <View style={styles.balanceNote}>
          <Text style={[styles.balanceNoteText, { fontWeight: 'bold', marginBottom: 5 }]}>
            Balansevalidering:
          </Text>
          <Text style={styles.balanceNoteText}>
            Total debet: {formatCurrency(totalDebet)}
          </Text>
          <Text style={styles.balanceNoteText}>
            Total kredit: {formatCurrency(totalKredit)}
          </Text>
          <Text style={[styles.balanceNoteText, { 
            marginTop: 5, 
            fontWeight: 'bold',
            color: isBalanced ? '#059669' : '#dc2626'
          }]}>
            Status: {isBalanced ? '✓ Balansert' : '✗ Ikke balansert'}
          </Text>
          {!isBalanced && (
            <Text style={[styles.balanceNoteText, { color: '#dc2626', fontWeight: 'bold' }]}>
              Differanse: {formatCurrency(Math.abs(totalDebet - totalKredit))}
            </Text>
          )}
        </View>

        {/* Note */}
        <View style={{ marginTop: 20, fontSize: 9, fontStyle: 'italic' }}>
          <Text>
            Dette diversebilaget inneholder journalposter som ikke tilhører standard
            faktura- eller betalingstransaksjoner. Kontroller at alle posteringer
            er korrekte før arkivering.
          </Text>
        </View>
      </Page>
    </Document>
  );
};