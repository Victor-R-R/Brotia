import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { api } from '../../lib/api'
import type { UserProfile } from '../../lib/api'

const inputClass =
  'bg-white border border-border rounded-lg px-3 py-3 text-sm text-foreground'

const SettingsScreen = () => {
  const [user,    setUser]    = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [name,     setName]     = useState('')
  const [lastName, setLastName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [address,  setAddress]  = useState('')

  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.user.get()
      .then(u => {
        setUser(u)
        setName(u.name ?? '')
        setLastName(u.lastName ?? '')
        setPhone(u.phone ?? '')
        setAddress(u.address ?? '')
      })
      .catch(() => Alert.alert('Error', 'No se pudo cargar el perfil'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.user.update({ name, lastName, phone, address })
      setUser(updated)
      Alert.alert('✓ Guardado', 'Los cambios se guardaron correctamente.')
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es permanente e irreversible. Se borrarán todos tus invernaderos, cultivos y conversaciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text:    'Eliminar',
          style:   'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              await api.user.delete()
              Alert.alert(
                'Cuenta eliminada',
                'Tu cuenta ha sido eliminada. Reinicia la aplicación.',
              )
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la cuenta. Inténtalo de nuevo.')
            } finally {
              setDeleting(false)
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#2D5A1B" />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text className="font-bold text-2xl text-foreground mb-1" style={{ fontFamily: 'Outfit' }}>
        Mi cuenta
      </Text>
      <Text className="text-sm text-muted mb-6">Gestiona tu perfil y preferencias</Text>

      {/* Profile card */}
      <View className="bg-surface border border-border rounded-xl p-4 mb-8">
        <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Email</Text>
        <Text className="text-sm text-foreground mb-4">{user?.email}</Text>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs font-medium text-muted mb-1.5">Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor="#7A9B6A"
              className={inputClass}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-medium text-muted mb-1.5">Apellido</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Apellido"
              placeholderTextColor="#7A9B6A"
              className={inputClass}
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium text-muted mb-1.5">Teléfono</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+34 600 000 000"
            placeholderTextColor="#7A9B6A"
            keyboardType="phone-pad"
            className={inputClass}
          />
        </View>

        <View className="mb-4">
          <Text className="text-xs font-medium text-muted mb-1.5">Dirección</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Tu dirección"
            placeholderTextColor="#7A9B6A"
            className={inputClass}
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-primary rounded-lg py-3 items-center"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text className="text-white text-sm font-semibold">Guardar cambios</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Danger zone */}
      <View className="bg-surface border border-red-200 rounded-xl p-4">
        <Text className="text-sm font-semibold text-red-800 mb-2">Zona de peligro</Text>
        <Text className="text-xs text-muted mb-4">
          Eliminar tu cuenta es permanente e irreversible. Se borrarán todos tus datos.
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleting}
          className="border border-red-300 rounded-lg py-3 items-center"
          style={{ opacity: deleting ? 0.6 : 1 }}
        >
          {deleting
            ? <ActivityIndicator color="#991B1B" size="small" />
            : <Text className="text-red-700 text-sm font-medium">Eliminar mi cuenta</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default SettingsScreen
