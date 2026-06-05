import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { ADMIN_BACKEND_URL } from '../../environment';

const EMPTY_ROW = () => ({
  id: Math.random().toString(36).slice(2),
  name: '',
  email: '',
  rollNo: '',
  programme: '',
  contactNo: '',
});

const COLUMNS = [
  { key: 'name',       label: 'Full Name',    placeholder: 'Aarav Sharma',        width: 150, capitalize: 'words',  keyboard: 'default' },
  { key: 'email',      label: 'Email',        placeholder: 'a@college.edu',       width: 180, capitalize: 'none',   keyboard: 'email-address' },
  { key: 'rollNo',     label: 'Roll No',      placeholder: '22BCSD01',            width: 110, capitalize: 'characters', keyboard: 'default' },
  { key: 'programme',  label: 'Programme',    placeholder: 'B.Tech CSE',          width: 140, capitalize: 'words',  keyboard: 'default' },
  { key: 'contactNo',  label: 'Contact',      placeholder: '9876543210',          width: 130, capitalize: 'none',   keyboard: 'phone-pad' },
];

function validateRow(row, index) {
  if (!row.name.trim())        return `Row ${index + 1}: Name is required`;
  if (!row.email.trim() || !row.email.includes('@')) return `Row ${index + 1}: Valid email required`;
  if (!row.rollNo.trim())      return `Row ${index + 1}: Roll number required`;
  if (!row.programme.trim())   return `Row ${index + 1}: Programme required`;
  if (!row.contactNo.trim())   return `Row ${index + 1}: Contact number required`;
  return null;
}

export default function AdminUploadScreen({ route, navigation }) {
  const { token } = route.params || {};
  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const updateCell = (rowId, field, value) => {
    setRows(prev =>
      prev.map(r => r.id === rowId ? { ...r, [field]: value } : r)
    );
  };

  const addRow = () => {
    setRows(prev => [...prev, EMPTY_ROW()]);
  };

  const removeRow = (rowId) => {
    if (rows.length === 1) {
      Alert.alert('Cannot remove', 'At least one row is required.');
      return;
    }
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const clearAll = () => {
    Alert.alert('Clear table', 'Remove all rows and start fresh?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setRows([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]) },
    ]);
  };

  const filledRows = rows.filter(r =>
    r.name.trim() || r.email.trim() || r.rollNo.trim() || r.programme.trim() || r.contactNo.trim()
  );

  const handleSubmit = async () => {
    if (!filledRows.length) {
      Alert.alert('Empty table', 'Fill in at least one student row.');
      return;
    }

    // Validate all filled rows
    for (let i = 0; i < filledRows.length; i++) {
      const err = validateRow(filledRows[i], i);
      if (err) { Alert.alert('Validation Error', err); return; }
    }

    const payload = filledRows.map(({ name, email, rollNo, programme, contactNo }) => ({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rollNo: rollNo.trim(),
      programme: programme.trim(),
      contactNo: contactNo.trim(),
    }));

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${ADMIN_BACKEND_URL}/api/students/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Import failed');
      }

      setResult({ success: true, count: data.count, students: data.students || [] });
      setRows([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
    } catch (error) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const isRowEmpty = (row) =>
    !row.name && !row.email && !row.rollNo && !row.programme && !row.contactNo;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bulk Add Students</Text>
          <Text style={styles.headerSub}>
            {filledRows.length} of {rows.length} rows filled
          </Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Column headers — horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colHeaderScroll}>
        <View style={styles.colHeaderRow}>
          <View style={styles.rowNumHeader} />
          {COLUMNS.map(col => (
            <View key={col.key} style={[styles.colHeader, { width: col.width }]}>
              <Text style={styles.colHeaderText}>{col.label}</Text>
            </View>
          ))}
          <View style={styles.deleteColHeader} />
        </View>
      </ScrollView>

      {/* Rows — vertical FlatList inside horizontal ScrollView */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
        <View>
          <FlatList
            data={rows}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item: row, index }) => (
              <View style={[styles.tableRow, isRowEmpty(row) && styles.tableRowEmpty]}>
                {/* Row number */}
                <View style={styles.rowNum}>
                  <Text style={styles.rowNumText}>{index + 1}</Text>
                </View>

                {/* Cells */}
                {COLUMNS.map(col => (
                  <TextInput
                    key={col.key}
                    style={[styles.cell, { width: col.width }]}
                    value={row[col.key]}
                    onChangeText={v => updateCell(row.id, col.key, v)}
                    placeholder={col.placeholder}
                    placeholderTextColor="#b0bec5"
                    autoCapitalize={col.capitalize}
                    keyboardType={col.keyboard}
                    autoCorrect={false}
                  />
                ))}

                {/* Delete row */}
                <TouchableOpacity
                  style={styles.deleteCell}
                  onPress={() => removeRow(row.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteCellText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Add row button (inside horizontal scroll so it aligns) */}
          <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
            <Text style={styles.addRowBtnText}>+ Add Row</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Result banner */}
      {result && (
        <View style={[styles.resultBanner, result.success ? styles.resultSuccess : styles.resultError]}>
          <Text style={styles.resultIcon}>{result.success ? '✅' : '❌'}</Text>
          <View style={styles.resultText}>
            <Text style={styles.resultTitle}>
              {result.success
                ? `${result.count} student(s) imported successfully`
                : 'Import failed'}
            </Text>
            {!result.success && (
              <Text style={styles.resultMsg}>{result.message}</Text>
            )}
            {result.success && (
              <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard', { token })}>
                <Text style={styles.resultLink}>Go to Dashboard →</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => setResult(null)}>
            <Text style={styles.resultDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit bar */}
      <View style={styles.submitBar}>
        <Text style={styles.submitHint}>
          Only filled rows are submitted. Empty rows are ignored.
        </Text>
        <TouchableOpacity
          style={[styles.submitBtn, (loading || !filledRows.length) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || !filledRows.length}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              Import {filledRows.length > 0 ? `${filledRows.length} Student${filledRows.length > 1 ? 's' : ''}` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const ROW_HEIGHT = 52;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  clearBtnText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // Column headers
  colHeaderScroll: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexGrow: 0,
  },
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  rowNumHeader: {
    width: 36,
  },
  colHeader: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  colHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  deleteColHeader: {
    width: 40,
  },

  // Table
  tableScroll: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    height: ROW_HEIGHT,
    paddingLeft: 4,
  },
  tableRowEmpty: {
    backgroundColor: '#fafafa',
  },
  rowNum: {
    width: 36,
    alignItems: 'center',
  },
  rowNumText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  cell: {
    height: ROW_HEIGHT,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1e293b',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  deleteCell: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCellText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '700',
  },

  // Add row
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 46,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  addRowBtnText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '700',
  },

  // Result banner
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  resultSuccess: {
    backgroundColor: '#f0fdf4',
    borderTopColor: '#bbf7d0',
  },
  resultError: {
    backgroundColor: '#fef2f2',
    borderTopColor: '#fecaca',
  },
  resultIcon: {
    fontSize: 22,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  resultMsg: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
  },
  resultLink: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 4,
  },
  resultDismiss: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
    padding: 4,
  },

  // Submit bar
  submitBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 14,
    gap: 8,
  },
  submitHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
