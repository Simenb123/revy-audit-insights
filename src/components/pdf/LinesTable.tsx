import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { BilagLine } from '@/types/bilag';

interface LinesTableProps {
  lines: BilagLine[];
}

const styles = StyleSheet.create({
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
  col1: { width: '35%' }, // Beskrivelse
  col2: { width: '10%', textAlign: 'center' }, // Antall
  col3: { width: '10%', textAlign: 'center' }, // Enhet
  col4: { width: '15%', textAlign: 'right' }, // Pris
  col5: { width: '15%', textAlign: 'right' }, // Netto
  col6: { width: '8%', textAlign: 'center' }, // MVA%
  col7: { width: '12%', textAlign: 'right' }, // MVA
  col8: { width: '15%', textAlign: 'right' }, // Sum
  headerText: {
    fontSize: 9,
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
});

export const LinesTable: React.FC<LinesTableProps> = ({ lines }) => {
  const totalNetto = lines.reduce((sum, line) => sum + line.netto, 0);
  const totalMva = lines.reduce((sum, line) => sum + (line.mva || 0), 0);
  const totalBrutto = totalNetto + totalMva;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('NOK', 'kr');
  };

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.col1]}>Beskrivelse</Text>
        <Text style={[styles.headerText, styles.col2]}>Antall</Text>
        <Text style={[styles.headerText, styles.col3]}>Enhet</Text>
        <Text style={[styles.headerText, styles.col4]}>Pris</Text>
        <Text style={[styles.headerText, styles.col5]}>Netto</Text>
        <Text style={[styles.headerText, styles.col6]}>MVA %</Text>
        <Text style={[styles.headerText, styles.col7]}>MVA</Text>
        <Text style={[styles.headerText, styles.col8]}>Sum</Text>
      </View>
      
      {/* Rows */}
      {lines.map((line, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.cellText, styles.col1]}>{line.beskrivelse}</Text>
          <Text style={[styles.cellText, styles.col2]}>{line.antall || ''}</Text>
          <Text style={[styles.cellText, styles.col3]}>{line.enhet || ''}</Text>
          <Text style={[styles.cellText, styles.col4]}>
            {line.antall && line.netto ? formatCurrency(line.netto / line.antall) : ''}
          </Text>
          <Text style={[styles.cellText, styles.col5]}>{formatCurrency(line.netto)}</Text>
          <Text style={[styles.cellText, styles.col6]}>
            {line.mvaSats ? `${line.mvaSats}%` : ''}
          </Text>
          <Text style={[styles.cellText, styles.col7]}>
            {line.mva ? formatCurrency(line.mva) : ''}
          </Text>
          <Text style={[styles.cellText, styles.col8]}>
            {formatCurrency(line.brutto || (line.netto + (line.mva || 0)))}
          </Text>
        </View>
      ))}
      
      {/* Totals */}
      <View style={styles.totalRow}>
        <Text style={[styles.totalText, styles.col1, styles.col2, styles.col3, styles.col4, { width: '70%' }]}>
          Totaler:
        </Text>
        <Text style={[styles.totalText, styles.col5]}>{formatCurrency(totalNetto)}</Text>
        <Text style={[styles.totalText, styles.col6]}></Text>
        <Text style={[styles.totalText, styles.col7]}>{formatCurrency(totalMva)}</Text>
        <Text style={[styles.totalText, styles.col8]}>{formatCurrency(totalBrutto)}</Text>
      </View>
    </View>
  );
};