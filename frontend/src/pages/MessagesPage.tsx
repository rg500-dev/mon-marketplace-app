import { useEffect, useMemo, useState } from 'react'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState('')

  const loadConversations = async () => {
    setError('')
    try {
      const res = await api.get('/messages/conversations')
      setConversations(res.data.data || [])
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les conversations.')
    }
  }

  const openConversation = async (partnerId: string) => {
    setSelectedUserId(partnerId)
    setError('')
    try {
      const res = await api.get(`/messages/${partnerId}`)
      setMessages(res.data.data || [])
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les messages.')
    }
  }

  const sendMessage = async () => {
    if (!selectedUserId || !messageText.trim()) return
    setError('')
    try {
      await api.post('/messages', {
        recipientId: selectedUserId,
        content: messageText,
      })
      setMessageText('')
      await openConversation(selectedUserId)
      await loadConversations()
    } catch (err) {
      console.error(err)
      setError('Impossible d’envoyer le message.')
    }
  }

  useEffect(() => {
    if (!user) return
    loadConversations()
  }, [user])

  const conversationsSummary = useMemo(() => {
    if (!user) return []
    const map = new Map<string, { partnerId: string; lastMessage: string; date: string }>()
    conversations.forEach((msg) => {
      const partnerId = msg.senderId === user.id ? msg.recipient : msg.senderId
      const date = new Date(msg.createdAt).toISOString()
      const existing = map.get(partnerId)
      if (!existing || existing.date < date) {
        map.set(partnerId, {
          partnerId,
          lastMessage: msg.content,
          date,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [conversations, user])

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Messagerie</h1>
        <p className="text-gray-700">Vous devez vous connecter pour voir vos messages.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Messagerie</h1>
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4">Conversations</h2>
          {conversationsSummary.length === 0 ? (
            <div className="text-gray-600">Aucune conversation pour le moment.</div>
          ) : (
            <div className="space-y-3">
              {conversationsSummary.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => openConversation(conv.partnerId)}
                  className={`w-full text-left p-3 rounded-lg border ${selectedUserId === conv.partnerId ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="font-semibold">Utilisateur {conv.partnerId}</div>
                  <div className="text-sm text-gray-600 truncate">{conv.lastMessage}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4">Conversation</h2>
          {selectedUserId ? (
            <>
              <div className="space-y-3 mb-6 max-h-[420px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-gray-600">Sélectionnez une conversation pour afficher les messages.</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`${msg.senderId === user.id ? 'bg-blue-50 ml-auto text-right' : 'bg-gray-100'} rounded-xl p-3 max-w-xl`}>
                      <div className="text-sm text-gray-700">{msg.content}</div>
                      <div className="text-xs text-gray-500 mt-2">{new Date(msg.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  className="w-full border rounded p-3"
                  placeholder="Écrire un message..."
                />
                {error && <div className="text-red-600">{error}</div>}
                <button onClick={sendMessage} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                  Envoyer
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-600">Sélectionnez une conversation pour voir le fil du message.</div>
          )}
        </div>
      </div>
    </div>
  )
}
