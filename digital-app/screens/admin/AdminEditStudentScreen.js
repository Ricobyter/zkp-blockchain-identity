import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ADMIN_BACKEND_URL } from '../../environment';

export default function AdminEditStudentScreen({ route, navigation }) {
  const { studentId, token } = route.params || {};
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStudent() {
      setLoading(true);
      try {
        const response = await fetch(`${ADMIN_BACKEND_URL}/api/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch student');
        
        const student = data.student;
        setForm({
          name: student.name,
          email: student.email,
          rollNo: student.rollNo,
          programme: student.programme,
          contactNo: student.contactNo,
          dob: student.dob || '',
        });
      } catch (error) {
        Alert.alert('Error', error.message || 'Could not load student data.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [studentId, token]);
  
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { name, email, rollNo, programme, contactNo, dob } = form;
    if (!name.trim()) return 'Full name is required';
    if (!email.trim() || !email.includes('@')) return 'A valid email is required';
    if (!rollNo.trim()) return 'Roll number is required';
    if (!programme.trim()) return 'Programme is required';
    if (!contactNo.trim()) return 'Contact number is required';
    if (!dob.trim() || dob.length !== 8) return 'Date of Birth in DDMMYYYY format is required';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${ADMIN_BACKEND_URL}/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          programme: form.programme.trim(),
          contactNo: form.contactNo.trim(),
          dob: form.dob.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update student');
      }

      Alert.alert(
        'Student Updated',
        `${data.student?.name || 'Student'} updated successfully.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not update student');
    } finally {
      setLoading(false);
    }
  };
  
  if (!form) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const fields = [
    { key: 'name', label: 'Full Name', placeholder: 'e.g. Aarav Sharma', autoCapitalize: 'words', keyboardType: 'default' },
    { key: 'programme', label: 'Programme / Branch', placeholder: 'e.g. B.Tech CSE', autoCapitalize: 'words', keyboardType: 'default' },
    { key: 'contactNo', label: 'Contact Number', placeholder: '9876543210', autoCapitalize: 'none', keyboardType: 'phone-pad' },
    { key: 'dob', label: 'Date of Birth', placeholder: 'DDMMYYYY', autoCapitalize: 'none', keyboardType: 'number-pad' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Email and Roll Number cannot be changed. Updating other details will re-issue the on-chain credential.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={[styles.input, styles.readOnlyInput]} value={form.email} editable={false} />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Roll Number</Text>
            <TextInput style={[styles.input, styles.readOnlyInput]} value={form.rollNo} editable={false} />
          </View>

          {fields.map(({ key, label, placeholder, autoCapitalize, keyboardType }) => (
            <View key={key} style={styles.fieldGroup}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={form[key]}
                onChangeText={v => handleChange(key, v)}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
                keyboardType={keyboardType}
                placeholderTextColor="#9ca3af"
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Student</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 19,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  readOnlyInput: {
    backgroundColor: '#eef2f9',
    color: '#64748b',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
});
