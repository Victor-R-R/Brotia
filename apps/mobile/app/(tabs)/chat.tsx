import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, Pressable, Modal, FlatList,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Bot, Plus, Send, Trash2, ImageIcon, X, MessageSquare } from 'lucide-react-native'
import { palette } from '../../lib/theme'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

type Conversation = { id: string; title: string; updatedAt: string }
type Message     = { id: string; role: 'user' | 'assistant'; content: string; imageUrl?: string }

const GREETING: Message = {
  id:      'greeting',
  role:    'assistant',
  content: '¡Hola! Soy tu asesor técnico agrícola de Brotia 🌱\n\n¿En qué puedo ayudarte hoy? Puedo ayudarte con:\n- Identificar plagas o enfermedades\n- Orientarte sobre tratamientos fitosanitarios en España\n- Buenas prácticas agronómicas\n\nCuéntame qué está pasando en tu cultivo.',
}

const ChatScreen = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId]           = useState<string | null>(null)
  const [messages, setMessages]           = useState<Message[]>([GREETING])
  const [input, setInput]                 = useState('')
  const [pendingImage, setPendingImage]   = useState<string | null>(null) // base64 data URL
  const [loading, setLoading]             = useState(false)
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const conversationIdRef                 = useRef<string | null>(null)
  const scrollRef                         = useRef<ScrollView>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, { credentials: 'include' })
      if (res.ok) setConversations(await res.json())
    } catch { /* non-blocking */ }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  const startNewChat = useCallback(() => {
    conversationIdRef.current = null
    setActiveId(null)
    setMessages([GREETING])
    setSidebarOpen(false)
  }, [])

  const selectConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${id}`, { credentials: 'include' })
      if (!res.ok) return
      const dbMessages = await res.json()
      conversationIdRef.current = id
      setActiveId(id)
      setMessages(dbMessages.length > 0 ? dbMessages : [GREETING])
      setSidebarOpen(false)
    } catch { /* non-blocking */ }
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/conversations/${id}`, { method: 'DELETE', credentials: 'include' })
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeId === id) startNewChat()
    } catch { /* non-blocking */ }
  }, [activeId, startNewChat])

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64:     true,
      quality:    0.7,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setPendingImage(`data:image/jpeg;base64,${asset.base64}`)
    }
  }, [])

  const handleSend = useCallback(async () => {
    const text  = input.trim()
    const image = pendingImage

    if (!text && !image) return
    if (loading) return

    setInput('')
    setPendingImage(null)
    setLoading(true)

    const userMessage: Message = {
      id:       Date.now().toString(),
      role:     'user',
      content:  text,
      imageUrl: image ?? undefined,
    }
    setMessages(prev => [...prev, userMessage])
    scrollRef.current?.scrollToEnd({ animated: true })

    try {
      // Create conversation if needed
      if (!conversationIdRef.current) {
        const res  = await fetch(`${API_BASE}/api/conversations`, {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ title: text.slice(0, 80) || 'Consulta con imagen' }),
        })
        const data = await res.json()
        conversationIdRef.current = data.id
        setActiveId(data.id)
        setConversations(prev => [data, ...prev])
      }

      // Build UIMessage parts for the API
      const parts: { type: string; text?: string; url?: string; mediaType?: string }[] = []
      if (image) parts.push({ type: 'file', mediaType: 'image/jpeg', url: image })
      if (text)  parts.push({ type: 'text', text })
      else       parts.push({ type: 'text', text: ' ' })

      const uiMessage = {
        id:    userMessage.id,
        role:  'user',
        parts,
        metadata: undefined,
      }

      // Collect conversation history as UIMessages for context
      const historyMessages = messages
        .filter(m => m.id !== 'greeting')
        .map(m => ({
          id:   m.id,
          role: m.role,
          parts: [
            ...(m.imageUrl ? [{ type: 'file', mediaType: 'image/jpeg', url: m.imageUrl }] : []),
            { type: 'text', text: m.content },
          ],
          metadata: undefined,
        }))

      const res = await fetch(`${API_BASE}/api/chat`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          messages:       [...historyMessages, uiMessage],
          conversationId: conversationIdRef.current,
        }),
      })

      if (!res.ok) throw new Error('Chat error')

      // Read streaming response text
      const reader  = res.body?.getReader()
      const decoder = new TextDecoder()
      let   fullText = ''

      const assistantId = `assistant-${Date.now()}`
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          // Parse AI SDK stream chunks (text delta format)
          const lines = chunk.split('\n').filter(l => l.startsWith('0:'))
          for (const line of lines) {
            try {
              const delta = JSON.parse(line.slice(2))
              if (typeof delta === 'string') {
                fullText += delta
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: fullText } : m,
                ))
              }
            } catch { /* skip malformed chunk */ }
          }
        }
      }

      fetchConversations()
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content: 'Hubo un error al procesar tu consulta. Por favor, inténtalo de nuevo.' },
      ])
    } finally {
      setLoading(false)
      scrollRef.current?.scrollToEnd({ animated: true })
    }
  }, [input, pendingImage, loading, messages, fetchConversations])

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-surface border-b border-border">
        <TouchableOpacity onPress={() => setSidebarOpen(true)} className="p-1">
          <MessageSquare size={22} color={palette.muted} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2 flex-1">
          <View className="size-8 rounded-full bg-primary items-center justify-center">
            <Bot size={16} color="#fff" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-foreground">Brotia IA</Text>
            <Text className="text-xs text-subtle">Asesor agrícola · España</Text>
          </View>
        </View>
        {loading && <ActivityIndicator size="small" color={palette.primary} />}
      </View>

      {/* Conversations modal */}
      <Modal visible={sidebarOpen} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-surface">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="font-heading font-semibold text-base text-foreground">Mis consultas</Text>
            <TouchableOpacity onPress={() => setSidebarOpen(false)}>
              <X size={22} color={palette.muted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => { startNewChat(); setSidebarOpen(false) }}
            className="mx-4 mt-4 mb-2 flex-row items-center justify-center gap-2 bg-primary rounded-md py-3"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-surface text-sm font-medium">Nueva consulta</Text>
          </TouchableOpacity>
          <FlatList
            data={conversations}
            keyExtractor={c => c.id}
            renderItem={({ item: c }) => (
              <TouchableOpacity
                onPress={() => selectConversation(c.id)}
                className={`flex-row items-center gap-3 px-4 py-3 border-b border-border-subtle ${activeId === c.id ? 'bg-surface-alt' : ''}`}
              >
                <MessageSquare size={16} color={palette.muted} />
                <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>{c.title}</Text>
                <TouchableOpacity onPress={() => deleteConversation(c.id)} className="p-1.5">
                  <Trash2 size={14} color={palette.danger ?? '#dc2626'} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="text-center text-subtle text-sm py-8">
                Aún no tienes consultas guardadas
              </Text>
            }
          />
        </View>
      </Modal>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View key={msg.id} className={`flex-row gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <View className="size-8 rounded-full bg-primary items-center justify-center self-start mt-1">
                  <Bot size={14} color="#fff" />
                </View>
              )}
              <View className={`max-w-[80%] gap-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                {msg.imageUrl && (
                  <Image
                    source={{ uri: msg.imageUrl }}
                    className="w-48 h-48 rounded-xl"
                    resizeMode="cover"
                  />
                )}
                {msg.content.trim().length > 0 && (
                  <View className={`rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary rounded-tr-sm'
                      : 'bg-surface-alt border border-border rounded-tl-sm'
                  }`}>
                    <Text className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-surface' : 'text-foreground'}`}>
                      {msg.content}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input — pb-24 clears the bottom tab bar + home indicator */}
        <View className="px-4 pb-24 pt-3 bg-surface border-t border-border gap-3">
          {pendingImage && (
            <View className="w-20 relative">
              <Image source={{ uri: pendingImage }} className="w-20 h-20 rounded-md" />
              <Pressable
                onPress={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 size-5 bg-danger rounded-full items-center justify-center"
              >
                <X size={10} color="#991B1B" />
              </Pressable>
            </View>
          )}
          <View className="flex-row items-end gap-2">
            <TouchableOpacity onPress={pickImage} className="p-2 border border-border rounded-md" disabled={loading}>
              <ImageIcon size={20} color={loading ? palette.subtle : palette.muted} />
            </TouchableOpacity>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Describe el problema..."
              placeholderTextColor={palette.subtle}
              multiline
              maxLength={2000}
              editable={!loading}
              className="flex-1 bg-surface-alt border border-border rounded-md px-3 py-2.5 text-sm text-foreground"
              style={{ maxHeight: 120 }}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={loading || (!input.trim() && !pendingImage)}
              className="p-2 bg-primary rounded-md"
              style={{ opacity: loading || (!input.trim() && !pendingImage) ? 0.4 : 1 }}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-subtle text-center">
            Consulta siempre con un técnico para diagnósticos definitivos
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

export default ChatScreen
