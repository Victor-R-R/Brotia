import { useCallback, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Modal, FlatList, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronDown, Send } from 'lucide-react-native'
import { api } from '@/lib/api'
import { palette } from '@/lib/theme'

const CATEGORIES = [
  { key: 'PLAGAS',       label: '🐛 Plagas y enfermedades' },
  { key: 'RIEGO',        label: '💧 Riego y fertilización'  },
  { key: 'CULTIVOS',     label: '🌱 Cultivos'               },
  { key: 'CLIMA',        label: '🌤️ Clima y temporadas'     },
  { key: 'EQUIPAMIENTO', label: '🔧 Equipamiento'           },
  { key: 'GENERAL',      label: '💬 General'                },
]

const NewThreadScreen = () => {
  const router = useRouter()
  const [title,         setTitle]         = useState('')
  const [content,       setContent]       = useState('')
  const [category,      setCategory]      = useState('')
  const [categoryLabel, setCategoryLabel] = useState('Selecciona una categoría')
  const [showPicker,    setShowPicker]    = useState(false)
  const [loading,       setLoading]       = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !content.trim() || !category) {
      Alert.alert('Campos requeridos', 'Completa título, descripción y categoría')
      return
    }

    setLoading(true)
    try {
      const thread = await api.community.create({ title, content, category, images: [] })
      router.replace(`/community/${thread.id}`)
    } catch {
      Alert.alert('Error', 'No se pudo publicar. Inténtalo de nuevo.')
      setLoading(false)
    }
  }, [title, content, category, router])

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: palette.foreground }}>Nueva pregunta</Text>

      {/* Category picker */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: palette.foreground, marginBottom: 6 }}>Categoría *</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: palette.border,
            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: category ? palette.foreground : palette.muted }}>
            {categoryLabel}
          </Text>
          <ChevronDown size={16} color={palette.muted} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: palette.foreground, marginBottom: 6 }}>Título *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="¿Cuál es tu pregunta?"
          placeholderTextColor={palette.muted}
          maxLength={150}
          style={{
            backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: palette.border,
            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
            fontSize: 14, color: palette.foreground,
          }}
        />
      </View>

      {/* Content */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: palette.foreground, marginBottom: 6 }}>Descripción *</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Describe el problema con detalle..."
          placeholderTextColor={palette.muted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{
            backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: palette.border,
            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
            fontSize: 14, color: palette.foreground, minHeight: 120,
          }}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading || !title.trim() || !content.trim() || !category}
        style={{
          backgroundColor: palette.primary, borderRadius: 8,
          paddingVertical: 14, flexDirection: 'row',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading || !title.trim() || !content.trim() || !category ? 0.4 : 1,
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <>
              <Send size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Publicar</Text>
            </>
        }
      </TouchableOpacity>

      {/* Category picker modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', padding: 16, borderBottomWidth: 1, borderColor: palette.border }}>
              Selecciona una categoría
            </Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={c => c.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCategory(item.key)
                    setCategoryLabel(item.label)
                    setShowPicker(false)
                  }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: 1, borderColor: palette.border,
                    backgroundColor: category === item.key ? palette.primary + '11' : '#fff',
                  }}
                >
                  <Text style={{ fontSize: 14, color: palette.foreground }}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

export default NewThreadScreen
