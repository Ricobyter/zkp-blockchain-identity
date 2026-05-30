import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { ADMIN_BACKEND_URL } from '../../environment';

// expo-document-picker must be installed:
// npx expo install expo-document-picker
let DocumentPicker = null;
try {
  DocumentPicker = require('expo-document-picker');
} catch {
  // expo-document-picker not installed
}

export default function AdminUploadScreen({ route, navigation }) {
  const { token } = route.params || {};
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const pickFile = async () => {
    if (!DocumentPicker) {
      Alert.alert(
        'Package Required',
        'Please install expo-document-picker:\n\nnpx expo install expo-document-picker\n\nThen restart the app.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/octet-stream',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      // Check extension
      const name = asset.name || '';
      if (!name.match(/\.(xlsx|xls)$/i)) {
        Alert.alert('Invalid File', 'Please select an Excel file (.xlsx or .xls)');
        return;
      }

      setSelectedFile(asset);
      setUploadResult(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file: ' + error.message);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No file', 'Please select an Excel file first.');
      return;
    }

    setLoading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const response = await fetch(`${ADMIN_BACKEND_URL}/api/students/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadResult({
        success: true,
        count: data.count || 0,
        message: data.message,
        students: data.students || [],
      });
      setSelectedFile(null);
    } catch (error) {
      setUploadResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📋 Excel Format Requirements</Text>
        <Text style={styles.instructionsText}>
          Your Excel file must have these column headers (case-insensitive):
        </Text>
        <View style={styles.headerList}>
          {['name', 'email', 'rollNo (or rollnumber)', 'programme (or program)', 'contactNo (or contact)'].map(h => (
            <View key={h} style={styles.headerItem}>
              <Text style={styles.headerBullet}>•</Text>
              <Text style={styles.headerText}>{h}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.instructionsNote}>
          Each row becomes one student. A temporary password is generated automatically.
          Emails are not sent automatically — use the dashboard to send credentials.
        </Text>
      </View>

      {/* File picker */}
      <View style={styles.pickerCard}>
        <TouchableOpacity style={styles.pickButton} onPress={pickFile} disabled={loading}>
          <Text style={styles.pickButtonIcon}>📁</Text>
          <Text style={styles.pickButtonText}>
            {selectedFile ? 'Change File' : 'Select Excel File'}
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileIcon}>📊</Text>
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
              {selectedFile.size && (
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => { setSelectedFile(null); setUploadResult(null); }}>
              <Text style={styles.removeFile}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Upload button */}
      <TouchableOpacity
        style={[styles.uploadButton, (!selectedFile || loading) && styles.uploadButtonDisabled]}
        onPress={handleUpload}
        disabled={!selectedFile || loading}
      >
        {loading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.uploadButtonText}>Uploading...</Text>
          </View>
        ) : (
          <Text style={styles.uploadButtonText}>Upload & Import Students</Text>
        )}
      </TouchableOpacity>

      {/* Result */}
      {uploadResult && (
        <View style={[styles.resultCard, uploadResult.success ? styles.resultCardSuccess : styles.resultCardError]}>
          <Text style={styles.resultIcon}>{uploadResult.success ? '✅' : '❌'}</Text>
          <Text style={styles.resultTitle}>
            {uploadResult.success
              ? `${uploadResult.count} student(s) imported successfully`
              : 'Upload failed'}
          </Text>
          <Text style={styles.resultMessage}>{uploadResult.message}</Text>

          {uploadResult.success && uploadResult.students.length > 0 && (
            <>
              <Text style={styles.resultSubtitle}>Imported students:</Text>
              {uploadResult.students.slice(0, 5).map(s => (
                <Text key={s.id || s.email} style={styles.resultStudentItem}>
                  • {s.name} — {s.rollNo}
                </Text>
              ))}
              {uploadResult.students.length > 5 && (
                <Text style={styles.resultMore}>
                  ...and {uploadResult.students.length - 5} more
                </Text>
              )}
              <TouchableOpacity
                style={styles.dashboardButton}
                onPress={() => navigation.navigate('AdminDashboard', { token })}
              >
                <Text style={styles.dashboardButtonText}>Go to Dashboard →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  instructionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 10,
  },
  headerList: {
    gap: 4,
    marginBottom: 12,
    paddingLeft: 4,
  },
  headerItem: {
    flexDirection: 'row',
    gap: 6,
  },
  headerBullet: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '700',
  },
  headerText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  instructionsNote: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  pickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    gap: 10,
    backgroundColor: '#eff6ff',
  },
  pickButtonIcon: {
    fontSize: 24,
  },
  pickButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3b82f6',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 10,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  fileSize: {
    fontSize: 12,
    color: '#4ade80',
    marginTop: 2,
  },
  removeFile: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
    padding: 4,
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
  },
  resultCardSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  resultCardError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  resultIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
  },
  resultSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  resultStudentItem: {
    fontSize: 13,
    color: '#166534',
    paddingVertical: 2,
  },
  resultMore: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  dashboardButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  dashboardButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
