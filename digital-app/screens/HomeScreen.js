import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const capabilityCards = [
  {
    title: 'Private proof generation',
    body: 'Convert identity data into a zero-knowledge proof before it leaves the device.',
  },
  {
    title: 'QR-based sharing',
    body: 'Share a proof as a compact QR payload or verify it by scanning from another device.',
  },
  {
    title: 'Dual verification',
    body: 'Validate the proof off-chain first, then confirm the same proof on-chain through Hardhat.',
  },
];

const flowSteps = [
  'Login with institution credentials',
  'Select which details to share',
  'Generate a zero-knowledge proof',
  'Share the QR and get verified',
];

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(riseAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, riseAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#08111f" />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: riseAnim }] }]}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ZERO-KNOWLEDGE IDENTITY</Text>
          </View>

          <Text style={styles.title}>Verify identity without exposing identity.</Text>
          <Text style={styles.subtitle}>
            Log in with your institution credentials, generate a proof, and verify it across cryptography and blockchain.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>Private</Text>
              <Text style={styles.statLabel}>No raw data leaves the device</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>Fast</Text>
              <Text style={styles.statLabel}>QR and API based flow</Text>
            </View>
          </View>
        </Animated.View>

        {/* Primary CTA — student login */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <Text style={styles.loginButtonIcon}>🔑</Text>
            <View style={styles.loginButtonContent}>
              <Text style={styles.loginButtonText}>Login with Credentials</Text>
              <Text style={styles.loginButtonSub}>Use your institution-issued email & password</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.flowCard}>
            {flowSteps.map((step, index) => (
              <View key={step} style={styles.flowRow}>
                <View style={styles.flowIndex}>
                  <Text style={styles.flowIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.flowText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Capabilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What this app does</Text>
          <View style={styles.cardsGrid}>
            {capabilityCards.map(card => (
              <View key={card.title} style={styles.card}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardBody}>{card.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Secondary actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other options</Text>
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('QRScannerScreen')}
            >
              <Text style={styles.secondaryButtonText}>📷 Scan QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('ManualQRInput')}
            >
              <Text style={styles.secondaryButtonText}>📝 Manual Input</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.manualProofButton}
            onPress={() => navigation.navigate('IdentityForm')}
          >
            <Text style={styles.manualProofText}>🛠️ Manual proof generation (advanced)</Text>
          </TouchableOpacity>
        </View>

        {/* Admin panel entry */}
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.adminButtonIcon}>🛡️</Text>
          <View>
            <Text style={styles.adminButtonText}>Admin Panel</Text>
            <Text style={styles.adminButtonSub}>Institution administrators only</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08111f',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(56, 189, 248, 0.20)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 50,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  hero: {
    marginBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  badgeText: {
    color: '#cbd5e1',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    maxWidth: 340,
    marginBottom: 14,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 22,
    maxWidth: 360,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderColor: 'rgba(148, 163, 184, 0.16)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  // Primary login button
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  loginButtonIcon: {
    fontSize: 28,
  },
  loginButtonContent: {
    flex: 1,
  },
  loginButtonText: {
    color: '#082f49',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  loginButtonSub: {
    color: '#0c4a6e',
    fontSize: 12,
    fontWeight: '500',
  },
  // Flow steps
  flowCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: 'rgba(148, 163, 184, 0.14)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flowIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  flowIndexText: {
    color: '#7dd3fc',
    fontWeight: '800',
  },
  flowText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  // Capability cards
  cardsGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: 'rgba(148, 163, 184, 0.14)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
  },
  // Secondary action row
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },
  manualProofButton: {
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  manualProofText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  // Admin entry
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    marginTop: 4,
  },
  adminButtonIcon: {
    fontSize: 26,
  },
  adminButtonText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  adminButtonSub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
});
