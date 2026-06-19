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
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

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

  const openConversation = useCallback(async (partnerId: string) => {
    setSelectedUserId(partnerId)
    setError('')
    setImagePreview(null)
    setSelectedImage(null)
    try {
      const res = await api.get(`/messages/${partnerId}`)
      setMessages(res.data.data || [])
      scrollToBottom()
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les messages.')
    }
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async () => {
    if ((!messageText.trim() && !selectedImage) || sending || !selectedUserId) return
    setSending(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('recipientId', selectedUserId)
      if (messageText.trim()) formData.append('content', messageText)
      if (selectedImage) formData.append('image', selectedImage)

      await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessageText('')
      removeSelectedImage()
      await openConversation(selectedUserId)
      await loadConversations()
    } catch (err: any) {
      setError(err?.response?.data?.error || "Impossible d'envoyer le message.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Temps réel : écouter les nouveaux messages
  useEffect(() => {
    if (!socket || !user) return

    const handleReceiveMessage = (data: { id: string; senderId: string; content: string; image?: string; createdAt?: string }) => {
      if (selectedUserId === data.senderId) {
        setMessages(prev => [
          ...prev,
          {
            id: data.id || `temp-${Date.now()}`,
            senderId: data.senderId,
            content: data.content,
            image: data.image,
            createdAt: data.createdAt || new Date().toISOString(),
            read: false,
          },
        ])
        scrollToBottom()
      }
      loadConversations()
    }

    const handleNotification = () => {
      loadConversations()
    }

    socket.on('receive_message', handleReceiveMessage)
    socket.on('notification', handleNotification)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
      socket.off('notification', handleNotification)
    }
  }, [socket, user, selectedUserId, loadConversations])

  useEffect(() => {
    if (!user) return
    loadConversations()
  }, [user, loadConversations])

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Messagerie</h1>
        <p className="text-gray-700">Connectez-vous pour voir vos messages.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Messagerie</h1>

      <div className="mb-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-500">{isConnected ? 'Connecté' : 'Reconnexion...'}</span>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Liste des conversations */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4">Conversations</h2>
          {conversations.length === 0 ? (
            <div className="text-gray-600">Aucune conversation.</div>
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
                  <div className="text-gray-600 text-center py-8">Aucun message. Envoyez le premier message !</div>
                ) : (
                  messages.map((msg: any) => (
                    <div key={msg.id} className={`${msg.senderId === user.id ? 'ml-auto' : ''} max-w-[75%] w-fit`}>
                      <div
                        className={`rounded-xl p-3 ${
                          msg.senderId === user.id
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.image && (
                          <div className="mb-2">
                            <img
                              src={msg.image}
                              alt="Image partagée"
                              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition max-h-48 object-cover"
                              onClick={() => setViewingImage(msg.image)}
                            />
                          </div>
                        )}
                        {msg.content && <div className="text-sm whitespace-pre-wrap">{msg.content}</div>}
                      </div>
                      <div className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-right' : ''} text-gray-400`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Aperçu de l'image sélectionnée */}
              {imagePreview && (
                <div className="relative inline-block mb-3">
                  <img src={imagePreview} alt="Aperçu" className="h-24 rounded-lg border" />
                  <button
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    className="flex-1 border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Écrire un message... (Entrée pour envoyer)"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-100 text-gray-600 p-3 rounded-lg hover:bg-gray-200 transition h-12 w-12 flex items-center justify-center"
                      title="Joindre une image"
                    >
                      📷
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={sending || (!messageText.trim() && !selectedImage)}
                      className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition h-12 w-12 flex items-center justify-center"
                    >
                      {sending ? '⏳' : '➡️'}
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {isConnected ? '🟢 Temps réel actif' : '🔴 Connexion...'}
                  </span>
                  <span className="text-xs text-gray-400">📷 JPEG, PNG, WebP, GIF max 5 Mo</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-600 text-center py-12">Sélectionnez une conversation.</div>
          )}
        </div>
      </div>

      {/* Modal plein écran pour visualiser une image */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setViewingImage(null)}
        >
          <img src={viewingImage} alt="Image" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  )
}