import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'

type Conversation = {
  partnerId: string
  lastMessage: string
  updatedAt: string
  unread: number
  username: string
  avatar?: string | null
}

// Extensions considérées comme des images (affichées en aperçu).
// Tout le reste (PDF, Word, Excel, ZIP...) est affiché comme un fichier à télécharger.
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i

export default function MessagesPage() {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const location = useLocation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
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

  const openConversation = useCallback(async (partnerId: string, username?: string) => {
    setSelectedUserId(partnerId)
    if (username) setSelectedUsername(username)
    setError('')
    setFilePreview(null)
    setSelectedFile(null)
    try {
      const res = await api.get(`/messages/${partnerId}`)
      setMessages(res.data.data || [])
      scrollToBottom()
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les messages.')
    }
  }, [])

  // Si on arrive depuis la page d'une annonce ("Contacter le vendeur"), on ouvre
  // directement la conversation avec ce vendeur, même si elle n'existe pas encore.
  useEffect(() => {
    const state = location.state as { withId?: string; withUsername?: string; productTitle?: string } | null
    if (state?.withId && user) {
      openConversation(state.withId, state.withUsername)
      if (state.productTitle) {
        setMessageText(`Bonjour, je suis intéressé par votre annonce "${state.productTitle}".`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, user])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFilePreview(IMAGE_EXTENSIONS.test(file.name) ? URL.createObjectURL(file) : null)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || sending || !selectedUserId) return
    setSending(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('recipientId', selectedUserId)
      if (messageText.trim()) formData.append('content', messageText)
      if (selectedFile) formData.append('image', selectedFile)

      await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessageText('')
      removeSelectedFile()
      await openConversation(selectedUserId, selectedUsername || undefined)
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

    const handleReceiveMessage = (data: { id: string; senderId: string; content: string; image?: string; fileName?: string; createdAt?: string }) => {
      if (selectedUserId === data.senderId) {
        setMessages(prev => [
          ...prev,
          {
            id: data.id || `temp-${Date.now()}`,
            senderId: data.senderId,
            content: data.content,
            image: data.image,
            fileName: data.fileName,
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
          {conversations.length === 0 && !selectedUserId ? (
            <div className="text-gray-600">Aucune conversation.</div>
          ) : (
            <div className="space-y-3">
              {/* Si on vient d'ouvrir une nouvelle conversation (pas encore de messages),
                  on l'affiche en tête de liste même si elle n'a pas encore d'historique. */}
              {selectedUserId && !conversations.some((c) => c.partnerId === selectedUserId) && (
                <button
                  onClick={() => openConversation(selectedUserId, selectedUsername || undefined)}
                  className="w-full text-left p-3 rounded-lg border border-blue-600 bg-blue-50"
                >
                  <div className="font-semibold">{selectedUsername || 'Nouvelle conversation'}</div>
                  <div className="text-sm text-gray-600 truncate italic">Nouvelle conversation</div>
                </button>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => openConversation(conv.partnerId, conv.username)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedUserId === conv.partnerId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{conv.username}</div>
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
          <h2 className="font-semibold mb-4">{selectedUserId ? (selectedUsername || 'Conversation') : 'Conversation'}</h2>
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
                            {!msg.fileName || IMAGE_EXTENSIONS.test(msg.fileName) ? (
                              <img
                                src={msg.image}
                                alt="Image partagée"
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition max-h-48 object-cover"
                                onClick={() => setViewingImage(msg.image)}
                              />
                            ) : (
                              <a
                                href={msg.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-2 rounded-lg border ${
                                  msg.senderId === user.id ? 'border-blue-300 bg-blue-500' : 'border-gray-300 bg-gray-50'
                                } hover:opacity-90 transition`}
                              >
                                <span className="text-2xl">📎</span>
                                <span className="text-sm underline truncate max-w-[180px]">{msg.fileName}</span>
                              </a>
                            )}
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

              {/* Aperçu du fichier sélectionné */}
              {selectedFile && (
                <div className="relative inline-flex items-center gap-2 mb-3 p-2 border rounded-lg bg-gray-50">
                  {filePreview ? (
                    <img src={filePreview} alt="Aperçu" className="h-16 w-16 object-cover rounded" />
                  ) : (
                    <span className="text-2xl px-2">📎</span>
                  )}
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
                  <button
                    onClick={removeSelectedFile}
                    className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
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
                      title="Joindre une image ou un document"
                    >
                      📎
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={sending || (!messageText.trim() && !selectedFile)}
                      className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition h-12 w-12 flex items-center justify-center"
                    >
                      {sending ? '⏳' : '➡️'}
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {isConnected ? '🟢 Temps réel actif' : '🔴 Connexion...'}
                  </span>
                  <span className="text-xs text-gray-400">📎 Images, PDF, Word, Excel, PowerPoint, ZIP — max 10 Mo</span>
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