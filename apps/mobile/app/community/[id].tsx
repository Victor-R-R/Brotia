import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Heart, Send, Trash2 } from 'lucide-react-native'
import { api, type ThreadDetail, type ReplyItem } from '@/lib/api'
import { palette } from '@/lib/theme'

const formatName = (name: string | null, lastName: string | null) =>
  [name, lastName].filter(Boolean).join(' ') || 'Usuario'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

const ThreadDetailScreen = () => {
  const { id }  = useLocalSearchParams<{ id: string }>()
  const router  = useRouter()
  const scrollRef = useRef<ScrollView>(null)

  const [thread,        setThread]        = useState<ThreadDetail | null>(null)
  const [replies,       setReplies]       = useState<ReplyItem[]>([])
  const [input,         setInput]         = useState('')
  const [loading,       setLoading]       = useState(true)
  const [sending,       setSending]       = useState(false)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [threadData, userProfile] = await Promise.all([
          api.community.get(id),
          api.user.get(),
        ])
        setThread(threadData)
        setReplies(threadData.replies)
        setSessionUserId(userProfile.id)
      } catch { /* non-blocking */ }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleLikeThread = useCallback(async () => {
    if (!thread) return
    const { liked, count } = await api.community.likeThread(thread.id)
    setThread(t => t ? { ...t, hasLiked: liked, _count: { ...t._count, likes: count } } : t)
  }, [thread])

  const handleLikeReply = useCallback(async (replyId: string) => {
    const { liked, count } = await api.community.likeReply(replyId)
    setReplies(prev => prev.map(r =>
      r.id === replyId ? { ...r, hasLiked: liked, _count: { likes: count } } : r
    ))
  }, [])

  const handleDeleteThread = useCallback(() => {
    if (!thread) return
    Alert.alert('Eliminar pregunta', '¿Seguro que quieres eliminar esta pregunta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await api.community.deleteThread(thread.id)
        router.back()
      }},
    ])
  }, [thread, router])

  const handleDeleteReply = useCallback((replyId: string) => {
    Alert.alert('Eliminar respuesta', '¿Seguro que quieres eliminar esta respuesta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await api.community.deleteReply(replyId)
        setReplies(prev => prev.filter(r => r.id !== replyId))
      }},
    ])
  }, [])

  const handleSend = useCallback(async () => {
    if (!thread || !input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      const reply = await api.community.reply(thread.id, { content: text, images: [] })
      setReplies(prev => [...prev, reply])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } finally {
      setSending(false)
    }
  }, [thread, input, sending])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    )
  }

  if (!thread) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.muted }}>Pregunta no encontrada</Text>
      </View>
    )
  }

  const isOwnThread = thread.userId === sessionUserId

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Original post */}
        <View style={{ backgroundColor: '#f8f8f8', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: palette.border }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: palette.primary + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: palette.primary }}>
                {[thread.user.name?.[0], thread.user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: palette.primary, fontWeight: '500' }}>{thread.category}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: palette.foreground }}>{thread.title}</Text>
              <Text style={{ fontSize: 12, color: palette.muted }}>
                {formatName(thread.user.name, thread.user.lastName)} · {formatDate(thread.createdAt)}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: palette.foreground, lineHeight: 20 }}>{thread.content}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <TouchableOpacity onPress={handleLikeThread} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Heart size={16} color={thread.hasLiked ? '#ef4444' : palette.muted} fill={thread.hasLiked ? '#ef4444' : 'transparent'} />
              <Text style={{ fontSize: 13, color: palette.muted }}>{thread._count.likes}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 13, color: palette.muted }}>{replies.length} respuestas</Text>
            {isOwnThread && (
              <TouchableOpacity onPress={handleDeleteThread} style={{ marginLeft: 'auto' as any }}>
                <Trash2 size={16} color={palette.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Replies */}
        {replies.map(reply => (
          <View key={reply.id} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: palette.primary + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: palette.primary }}>
                {[reply.user.name?.[0], reply.user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: palette.foreground }}>
                  {formatName(reply.user.name, reply.user.lastName)}
                </Text>
                <Text style={{ fontSize: 12, color: palette.muted }}>{formatDate(reply.createdAt)}</Text>
              </View>
              <View style={{
                backgroundColor: '#f0f0f0', borderRadius: 12, borderTopLeftRadius: 3,
                padding: 12, borderWidth: 1, borderColor: palette.border,
              }}>
                <Text style={{ fontSize: 14, color: palette.foreground, lineHeight: 20 }}>{reply.content}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6, paddingLeft: 4 }}>
                <TouchableOpacity onPress={() => handleLikeReply(reply.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Heart size={14} color={reply.hasLiked ? '#ef4444' : palette.muted} fill={reply.hasLiked ? '#ef4444' : 'transparent'} />
                  <Text style={{ fontSize: 12, color: palette.muted }}>{reply._count.likes}</Text>
                </TouchableOpacity>
                {reply.userId === sessionUserId && (
                  <TouchableOpacity onPress={() => handleDeleteReply(reply.id)}>
                    <Trash2 size={14} color={palette.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Reply input */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        padding: 12, borderTopWidth: 1, borderColor: palette.border,
        backgroundColor: '#fff',
      }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu respuesta..."
          placeholderTextColor={palette.muted}
          multiline
          style={{
            flex: 1, backgroundColor: '#f5f5f5',
            borderWidth: 1, borderColor: palette.border,
            borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
            fontSize: 14, color: palette.foreground, maxHeight: 100,
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: palette.primary,
            alignItems: 'center', justifyContent: 'center',
            opacity: sending || !input.trim() ? 0.4 : 1,
          }}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default ThreadDetailScreen
