import React, { useState } from 'react';
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

const EMPTY_FORM = {
  name: '',
  email: '',
  rollNo: '',
  programme: '',
  contactNo: '',
};

export default function AdminAddStudentScreen({ route, navigation }) {
  const { token } = route.params || {};
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { name, email, rollNo, programme, contactNo } = form;
    if (!name.trim()) return 'Full name is required';
    if (!email.trim() || !email.includes('@')) return 'A valid email is required';
    if (!rollNo.trim()) return 'Roll number is required';
    if (!programme.trim()) return 'Programme is required';
    if (!contactNo.trim()) return 'Contact number is required';
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
      const response = await fetch(`${ADMIN_BACKEND_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          rollNo: form.rollNo.trim(),
          programme: form.programme.trim(),
          contactNo: form.contactNo.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create student');
      }

      Alert.alert(
        'Student Created',
        `${data.student?.name || 'Student'} added successfully. Send credentials from the dashboard.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

      setForm(EMPTY_FORM);
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not create student');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', placeholder: 'e.g. Aarav Sharma', autoCapitalize: 'words', keyboardType: 'default' },
    { key: 'email', label: 'Email Address', placeholder: 'student@college.edu', autoCapitalize: 'none', keyboardType: 'email-address' },
    { key: 'rollNo', label: 'Roll Number', placeholder: 'e.g. 22BCSD01', autoCapitalize: 'characters', keyboardType: 'default' },
    { key: 'programme', label: 'Programme / Branch', placeholder: 'e.g. B.Tech CSE', autoCapitalize: 'words', keyboardType: 'default' },
    { key: 'contactNo', label: 'Contact Number', placeholder: '9876543210', autoCapitalize: 'none', keyboardType: 'phone-pad' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            A temporary password will be generated automatically and stored. You can send credentials from the dashboard after adding the student.
          </Text>
        </View>

        <View style={styles.form}>
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
            <Text style={styles.submitButtonText}>Create Student</Text>
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
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
    elevation: 0,
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
