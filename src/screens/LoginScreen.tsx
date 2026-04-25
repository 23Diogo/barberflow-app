import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { login } from '../api/api'
import { useAuth } from '../store/AuthContext'

export default function LoginScreen() {
  const { setAuth } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Informe email e senha.')
      return
    }
    setLoading(true)
    try {
      const data = await login(email.trim().toLowerCase(), password)
      setAuth({ user: data.user, profile: data.profile, barbershop: data.barbershop })
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.'
      Alert.alert('Erro', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>B</Text>
          </View>
          <View>
            <Text style={styles.logoTitle}>BarberFlow</Text>
            <Text style={styles.logoSub}>ÁREA DO BARBEIRO</Text>
          </View>
        </View>

        {/* Card de login */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar</Text>
          <Text style={styles.cardSub}>Acesse sua agenda de atendimentos</Text>

          <View style={styles.field}>
            <Text style={styles.label}>E-MAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#3a4568"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SENHA</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#3a4568"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <Text style={styles.hint}>
            Esqueceu a senha? Fale com o dono da barbearia.
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 40,
    alignSelf: 'center',
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#120600',
    borderWidth: 1,
    borderColor: 'rgba(255,100,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ff8c00',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e8f0fe',
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 10,
    color: '#4fc3f7',
    letterSpacing: 2,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#0c1020',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e2345',
    padding: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e8f0fe',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#5a6888',
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5a6888',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0e1022',
    borderWidth: 1,
    borderColor: '#232845',
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: '#e8f0fe',
  },
  btn: {
    backgroundColor: '#00b4ff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    color: '#3a4568',
    textAlign: 'center',
    marginTop: 16,
  },
})
