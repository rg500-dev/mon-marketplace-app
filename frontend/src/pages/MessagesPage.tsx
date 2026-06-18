import { useEffect, useState, useCallback, useRef } from 'react'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'

export default function MessagesPage() {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll en bas de la conversation
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    setError('')
    try {
      const res = await api.get('/messages/conversations')
      setConversations(res.data.data || [])
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les conversations.')
    }
  }, [])

  // Ouvrir une conversation et charger l'historique
  const openConversation = useCallback(async (partnerId: string) => {
    setSelectedUserId(partnerId)
    setError('')
    try {
      const res = await api.get(`/messages/${partnerId}`)
      setMessages(res.data.data || [])
      scrollToBottom()
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les messages.')
    }
  }, [])

  // Envoyer un message
  const sendMessage = async () => {
    if (!selectedUserId || !messageText.trim() || sending) return
    setSending(true)
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
      setError('Impossible d\'envoyer le message.')
    } finally {
      setSending(false)
    }
  }

  // Envoyer avec la touche Entrée (Shift+Entrée pour sauter une ligne)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // --- TEMPS RÉEL : Écouter les nouveaux messages entrants ---
  useEffect(() => {
    if (!socket || !user) return

    const handleReceiveMessage = (data: { senderId: string; content: string; createdAt?: string }) => {
      // Si on est dans la conversation avec l'expéditeur, ajouter le message à l'affichage
      if (selectedUserId === data.senderId) {
        setMessages(prev => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            senderId: data.senderId,
            content: data.content,
            createdAt: data.createdAt || new Date().toISOString(),
            read: false,
          },
        ])
        scrollToBottom()
      }
      // Recharger les conversations pour mettre à jour le dernier message
      loadConversations()
    }

    const handleNotification = () => {
      // Si on n'est pas dans la conversation, recharger quand même les conversations
      loadConversations()
    }

    socket.on('receive_message', handleReceiveMessage)
    socket.on('notification', handleNotification)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
      socket.off('notification', handleNotification)
    }
  }, [socket, user, selectedUserId, loadConversations])

  // Recharger les conversations au montage
  useEffect(() => {
    if (!user) return
    loadConversations()
  }, [user, loadConversations])

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

      {/* Indicateur de connexion Socket.IO */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          title={isConnected ? 'Connecté en temps réel' : 'Déconnecté'}
        />
        <span className="text-xs text-gray-500">
          {isConnected ? 'Connecté' : 'Reconnexion...'}
        </span>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Liste des conversations */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4">Conversations</h2>
          {conversations.length === 0 ? (
            <div className="text-gray-600">Aucune conversation pour le moment.</div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv: any) => (
                <button
                  key={conv.partnerId}
                  onClick={() => openConversation(conv.partnerId)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedUserId === conv.partnerId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">Utilisateur {conv.partnerId.slice(0, 8)}</div>
                  <div className="text-sm text-gray-600 truncate">{conv.lastMessage}</div>
                  {conv.unread > 0 && (
                    <span className="inline-block mt-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {conv.unread} non lu{conv.unread > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zone de conversation */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4">Conversation</h2>
          {selectedUserId ? (
            <>
              <div className="space-y-3 mb-6 max-h-[420px] overflow-y-auto border rounded-lg p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-gray-600 text-center py-8">
                    Aucun message. Envoyez le premier message !
                  </div>
                ) : (
                  messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`${
                        msg.senderId === user.id
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-white border border-gray-200'
                      } rounded-xl p-3 max-w-[70%] w-fit`}
                    >
                      <div className="text-sm">{msg.content}</div>
                      <div
                        className={`text-xs mt-2 ${
                          msg.senderId === user.id ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="space-y-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  className="w-full border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Écrire un message... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
                />
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {isConnected ? '🟢 Temps réel actif' : '🔴 Connexion...'}
                  </span>
                  <button
                    onClick={sendMessage}
                    disabled={sending || !messageText.trim()}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-600 text-center py-12">
              Sélectionnez une conversation pour voir les messages.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}