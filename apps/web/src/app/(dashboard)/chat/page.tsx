import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ChatInterface } from '@/components/chat/chat-interface'

const ChatPage = async () => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return <ChatInterface />
}

export default ChatPage
