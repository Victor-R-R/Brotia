import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { saveAuth } from '@/lib/auth-storage'
import { palette } from '@/lib/theme'

WebBrowser.maybeCompleteAuthSession()

const API_BASE       = process.env.EXPO_PUBLIC_API_URL  ?? 'http://localhost:3000'
const GOOGLE_CLIENT  = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ''

const inputStyle = {
  backgroundColor: palette.background,
  borderWidth: 1,
  borderColor: palette.border,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 14,
  color: palette.foreground,
}

const LoginScreen = () => {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT,
  })

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type !== 'success') return
    const accessToken = response.authentication?.accessToken
    if (!accessToken) return
    handleGoogleToken(accessToken)
  }, [response])

  const handleGoogleToken = async (accessToken: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/mobile-google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ accessToken }),
      })
      if (res.status === 404) {
        Alert.alert(
          'Cuenta no encontrada',
          'No hay cuenta asociada a este email de Google. Regístrate en brotia.app primero.',
        )
        return
      }
      if (!res.ok) throw new Error()
      const { token, user } = await res.json()
      await saveAuth(token, user)
      router.replace('/(tabs)/')
    } catch {
      Alert.alert('Error', 'No se pudo verificar tu cuenta de Google.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async () => {
    const e = email.trim()
    const p = password.trim()
    if (!e || !p) { Alert.alert('Campos requeridos', 'Introduce tu email y contraseña.'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/mobile-login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: e, password: p }),
      })
      if (res.status === 401) { Alert.alert('Credenciales incorrectas', 'Email o contraseña incorrectos.'); return }
      if (!res.ok) throw new Error()
      const { token, user } = await res.json()
      await saveAuth(token, user)
      router.replace('/(tabs)/')
    } catch {
      Alert.alert('Error', 'No se pudo conectar. Comprueba tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>🌱</Text>
          <Text style={{ fontSize: 32, fontWeight: '700', color: palette.foreground, letterSpacing: -0.5 }}>
            Brotia
          </Text>
          <Text style={{ fontSize: 14, color: palette.subtle, marginTop: 4 }}>
            Gestión inteligente de invernaderos
          </Text>
        </View>

        {/* Google button */}
        <TouchableOpacity
          onPress={() => promptAsync()}
          disabled={loading || !request}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border,
            borderRadius: 10, paddingVertical: 14, marginBottom: 20,
            opacity: loading || !request ? 0.6 : 1,
          }}
        >
          {/* Google "G" logo */}
          <Text style={{ fontSize: 18, lineHeight: 22 }}>G</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: palette.foreground }}>
            Continuar con Google
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
          <Text style={{ fontSize: 12, color: palette.subtle }}>o inicia con email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        </View>

        {/* Email / password form */}
        <View style={{
          backgroundColor: palette.surface, borderRadius: 16,
          padding: 20, borderWidth: 1, borderColor: palette.border, gap: 16,
        }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: palette.muted }}>Email</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="tu@email.com" placeholderTextColor={palette.subtle}
              autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress"
              style={inputStyle}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: palette.muted }}>Contraseña</Text>
            <TextInput
              value={password} onChangeText={setPassword}
              placeholder="••••••••" placeholderTextColor={palette.subtle}
              secureTextEntry textContentType="password"
              style={inputStyle}
            />
          </View>
          <TouchableOpacity
            onPress={handlePasswordLogin} disabled={loading}
            style={{ backgroundColor: palette.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Iniciar sesión</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={{ textAlign: 'center', color: palette.subtle, fontSize: 12, marginTop: 24 }}>
          ¿Sin cuenta? Regístrate en brotia.app desde tu navegador.
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen
