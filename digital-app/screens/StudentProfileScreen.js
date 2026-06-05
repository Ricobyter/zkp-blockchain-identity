import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ADMIN_BACKEND_URL } from '../environment';

// Normalize contactNo from admin DB to +91XXXXXXXXXX format
function normalizePhone(contactNo) {
  if (!contactNo) return '';
  const digits = contactNo.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91${digits.slice(2)}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  // Return with +91 prefix if not already present
  if (!contactNo.startsWith('+')) {
    return `+91${digits}`;
  }
  return contactNo;
}

export default function StudentProfileScreen({ route, navigation }) {
  const [student, setStudent] = useState(route.params.student);

  // Refresh student data every time this screen comes into focus
  // so updates and revocations made by admin are reflected immediately
  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        try {
          const res = await fetch(`${ADMIN_BACKEND_URL}/api/students/${route.params.student.id}`);
          const data = await res.json();
          if (res.ok) {
            if (data.student.revoked) {
              Alert.alert(
                'Credential Revoked',
                'Your credential has been revoked by the institution. You will be logged out.',
                [{ text: 'OK', onPress: () => navigation.navigate('LoginScreen') }]
              );
            } else {
              setStudent(data.student);
            }
          }
        } catch {
          // silently fail — stale data is better than a crash
        }
      };
      refresh();
    }, [route.params.student.id])
  );

  const [dob, setDob] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Privacy selection — what fields to include in QR / show in proof
  const [selected, setSelected] = useState({
    name: true,
    rollNo: true,
    programme: true,
    contactNo: true,
    dob: false,
  });

  const formatDateDisplay = (dateString) => {
    if (!dateString || dateString.length !== 8) return 'Select Date of Birth';
    return `${dateString.substring(0, 2)}/${dateString.substring(2, 4)}/${dateString.substring(4, 8)}`;
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setDob(`${day}${month}${year}`);
    }
  };

  const toggleField = (field) => {
    setSelected(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleGenerateProof = () => {
    if (!dob || dob.length !== 8) {
      Alert.alert('Date of Birth Required', 'Please select your date of birth to generate the proof.');
      return;
    }

    // Map student DB fields to the form format expected by LoadingScreen / ZK circuit
    const normalizedPhone = normalizePhone(student.contactNo);

    const form = {
      name: student.name,
      rollNo: student.rollNo,
      dob,                          // entered by user (DDMMYYYY)
      phoneNo: normalizedPhone,     // contactNo → +91XXXXXXXXXX
      branch: student.programme,    // programme → branch for ZK circuit
    };

    // Pass selected fields so ShowProof knows initial privacy settings
    navigation.navigate('LoadingScreen', {
      form,
      // Pre-configure privacy: if user didn't select a field, hide it in QR
      initialPrivacy: {
        name: selected.name,
        rollNo: selected.rollNo,
        dob: selected.dob,
        phoneNo: selected.contactNo,
        branch: selected.programme,
      },
    });
  };

  const fields = [
    { key: 'name', label: 'Full Name', value: student.name, icon: '👤' },
    { key: 'rollNo', label: 'Roll Number', value: student.rollNo, icon: '🆔' },
    { key: 'programme', label: 'Programme / Branch', value: student.programme, icon: '🎓' },
    { key: 'contactNo', label: 'Contact Number', value: normalizePhone(student.contactNo), icon: '📱' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Welcome banner */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeIcon}>🎓</Text>
          <Text style={styles.welcomeTitle}>Welcome, {student.name.split(' ')[0]}!</Text>
          <Text style={styles.welcomeSubtitle}>
            Your identity details are loaded from the institution database.
          </Text>
        </View>

        {/* Student details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Identity Details</Text>
          <Text style={styles.cardSubtitle}>Tap fields to toggle what to share in the QR code.</Text>

          {fields.map(({ key, label, value, icon }) => (
            <TouchableOpacity
              key={key}
              style={[styles.fieldRow, selected[key] && styles.fieldRowSelected]}
              onPress={() => toggleField(key)}
              activeOpacity={0.7}
            >
              <Text style={styles.fieldIcon}>{icon}</Text>
              <View style={styles.fieldInfo}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <Text style={styles.fieldValue}>{value || '—'}</Text>
              </View>
              <Text style={styles.checkmark}>{selected[key] ? '✅' : '⬜'}</Text>
            </TouchableOpacity>
          ))}

          {/* DOB — not from DB, user must enter */}
          <View style={styles.dobSection}>
            <Text style={styles.dobLabel}>Date of Birth *</Text>
            <Text style={styles.dobNote}>Not stored in database — required for the ZK proof</Text>

            <TouchableOpacity
              style={[styles.dateButton, dob && styles.dateButtonFilled]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonIcon}>📅</Text>
              <Text style={[styles.dateButtonText, dob && styles.dateButtonTextFilled]}>
                {formatDateDisplay(dob)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* DOB privacy toggle (only if date selected) */}
            {dob ? (
              <TouchableOpacity
                style={[styles.fieldRow, styles.dobToggleRow, selected.dob && styles.fieldRowSelected]}
                onPress={() => toggleField('dob')}
              >
                <Text style={styles.fieldIcon}>📅</Text>
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>Date of Birth</Text>
                  <Text style={styles.fieldValue}>{formatDateDisplay(dob)}</Text>
                </View>
                <Text style={styles.checkmark}>{selected.dob ? '✅' : '⬜'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyNoteText}>
            🔒 Checked fields will be revealed in the QR code. Unchecked fields are hidden — the ZK proof still cryptographically validates your full identity.
          </Text>
        </View>

        {/* Email info */}
        <View style={styles.emailInfo}>
          <Text style={styles.emailInfoText}>
            Logged in as: <Text style={styles.emailText}>{student.email}</Text>
          </Text>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateButton, !dob && styles.generateButtonDisabled]}
          onPress={handleGenerateProof}
          disabled={!dob}
        >
          <Text style={styles.generateButtonText}>
            🔐 Generate Zero-Knowledge Proof
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <Text style={styles.logoutText}>← Sign in with different account</Text>
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
  welcomeBanner: {
    backgroundColor: '#1e40af',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#bfdbfe',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  fieldRowSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  fieldIcon: {
    fontSize: 22,
    marginRight: 12,
    width: 30,
    textAlign: 'center',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  checkmark: {
    fontSize: 20,
    marginLeft: 8,
  },
  dobSection: {
    marginTop: 8,
  },
  dobLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  dobNote: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f9fafb',
    marginBottom: 10,
  },
  dateButtonFilled: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  dateButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  dateButtonTextFilled: {
    color: '#1e293b',
    fontWeight: '600',
  },
  dobToggleRow: {
    marginTop: 4,
  },
  privacyNote: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  privacyNoteText: {
    fontSize: 13,
    color: '#9a3412',
    lineHeight: 20,
  },
  emailInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emailInfoText: {
    fontSize: 13,
    color: '#64748b',
  },
  emailText: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  generateButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 14,
    color: '#64748b',
  },
});
