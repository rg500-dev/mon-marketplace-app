import nodemailer from 'nodemailer'

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
})

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@marketplace.com'
const APP_NAME = 'Marketplace'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Vérifie si le service email est configuré
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

// Envoi d'email générique
async function sendEmail(to: string, subject: string, html: string) {
  if (!isEmailConfigured()) {
    console.log(`📧 [EMAIL NON CONFIGURÉ] Email would be sent to ${to}: ${subject}`)
    return { success: false, reason: 'SMTP not configured' }
  }

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })
    console.log(`📧 Email sent to ${to}: ${subject}`)
    return { success: true }
  } catch (error) {
    console.error(`📧 Failed to send email to ${to}:`, error)
    return { success: false, error }
  }
}

// Email de bienvenue à l'inscription
export async function sendWelcomeEmail(to: string, username: string, verificationToken?: string) {
  const verifyLink = verificationToken
    ? `${FRONTEND_URL}/verify?token=${verificationToken}`
    : null

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px">
      <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:30px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">Bienvenue sur ${APP_NAME} !</h1>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#374151">Bonjour <strong>${username}</strong>,</p>
        <p style="color:#6b7280">Merci de vous être inscrit sur ${APP_NAME}. Votre compte a été créé avec succès !</p>
        ${verifyLink ? `
          <div style="text-align:center;margin:25px 0">
            <a href="${verifyLink}" style="background:#2563eb;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              ✅ Vérifier mon compte
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center">Ou copiez ce lien : ${verifyLink}</p>
        ` : `
          <p style="color:#6b7280">Vous pouvez dès maintenant parcourir les annonces et contacter les vendeurs.</p>
        `}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0" />
        <p style="color:#9ca3af;font-size:12px;text-align:center">
          ${APP_NAME} — L'application de vente entre particuliers
        </p>
      </div>
    </div>
  `

  return sendEmail(to, `Bienvenue sur ${APP_NAME} !`, html)
}

// Email notification : nouvelle offre reçue
export async function sendNewOfferEmail(
  to: string,
  buyerUsername: string,
  amount: number,
  productTitle: string,
  productId: string
) {
  const offerLink = `${FRONTEND_URL}/products/${productId}`
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px">
      <div style="background:linear-gradient(135deg,#059669,#047857);padding:30px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">💰 Nouvelle offre reçue</h1>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#374151">Bonjour,</p>
        <p style="color:#6b7280">
          <strong>${buyerUsername}</strong> a fait une offre de <strong style="color:#059669;font-size:18px">${amount}€</strong> pour votre annonce <strong>« ${productTitle} »</strong>.
        </p>
        <div style="text-align:center;margin:25px 0">
          <a href="${offerLink}" style="background:#059669;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            📋 Voir l'offre
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0" />
        <p style="color:#9ca3af;font-size:12px;text-align:center">${APP_NAME}</p>
      </div>
    </div>
  `
  return sendEmail(to, `💰 Nouvelle offre de ${amount}€ pour "${productTitle}"`, html)
}

// Email notification : offre acceptée
export async function sendOfferAcceptedEmail(
  to: string,
  amount: number,
  productTitle: string
) {
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px">
      <div style="background:linear-gradient(135deg,#059669,#047857);padding:30px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">✅ Offre acceptée !</h1>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#374151">Félicitations !</p>
        <p style="color:#6b7280">
          Votre offre de <strong style="color:#059669;font-size:18px">${amount}€</strong> pour <strong>« ${productTitle} »</strong> a été acceptée 🎉
        </p>
        <p style="color:#6b7280">Le vendeur va vous contacter pour finaliser la transaction.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0" />
        <p style="color:#9ca3af;font-size:12px;text-align:center">${APP_NAME}</p>
      </div>
    </div>
  `
  return sendEmail(to, `✅ Offre acceptée pour "${productTitle}"`, html)
}

// Email notification : offre refusée
export async function sendOfferDeclinedEmail(
  to: string,
  amount: number,
  productTitle: string
) {
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px">
      <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:30px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">✖ Offre refusée</h1>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#374151">Bonjour,</p>
        <p style="color:#6b7280">
          Votre offre de <strong>${amount}€</strong> pour <strong>« ${productTitle} »</strong> a été refusée.
        </p>
        <p style="color:#6b7280">Vous pouvez faire une nouvelle offre ou contacter le vendeur pour discuter.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0" />
        <p style="color:#9ca3af;font-size:12px;text-align:center">${APP_NAME}</p>
      </div>
    </div>
  `
  return sendEmail(to, `✖ Offre refusée pour "${productTitle}"`, html)
}

// Email notification : contre-offre reçue
export async function sendCounterOfferEmail(
  to: string,
  counterAmount: number,
  originalAmount: number,
  productTitle: string,
  sellerUsername: string
) {
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">🔄 Contre-offre reçue</h1>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#374151">Bonjour,</p>
        <p style="color:#6b7280">
          <strong>${sellerUsername}</strong> a fait une contre-offre de <strong style="color:#f59e0b;font-size:18px">${counterAmount}€</strong> pour <strong>« ${productTitle} »</strong> (votre offre initiale : ${originalAmount}€).
        </p>
        <p style="color:#6b7280">Connectez-vous pour accepter ou refuser cette contre-offre.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0" />
        <p style="color:#9ca3af;font-size:12px;text-align:center">${APP_NAME}</p>
      </div>
    </div>
  `
  return sendEmail(to, `🔄 Contre-offre de ${counterAmount}€ pour "${productTitle}"`, html)
}

// Email notification : nouveau message
export async function sendNewMessageEmail(
  to: string,
  senderUsername: string,
  messagePreview: string
) {
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px">
      <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:30px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">💬 Nouveau message</h1>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#374151">Bonjour,</p>
        <p style="color:#6b7280">
          <strong>${senderUsername}</strong> vous a envoyé un message sur ${APP_NAME} :
        </p>
        <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;font-style:italic;color:#374151">
          « ${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''} »
        </div>
        <div style="text-align:center;margin:25px 0">
          <a href="${FRONTEND_URL}/messages" style="background:#2563eb;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            💬 Répondre
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0" />
        <p style="color:#9ca3af;font-size:12px;text-align:center">${APP_NAME}</p>
      </div>
    </div>
  `
  return sendEmail(to, `💬 Nouveau message de ${senderUsername}`, html)
}

// Email notification : nouvel avis
export async function sendNewReviewEmail(
  to: string,
  username: string,
  rating: number,
  productTitle: string
) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px">
      <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:30px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">⭐ Nouvel avis</h1>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#374151">Bonjour,</p>
        <p style="color:#6b7280">
          <strong>${username}</strong> a laissé un avis sur votre produit <strong>« ${productTitle} »</strong>.
        </p>
        <div style="text-align:center;font-size:24px;margin:15px 0;color:#f59e0b">${stars}</div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0" />
        <p style="color:#9ca3af;font-size:12px;text-align:center">${APP_NAME}</p>
      </div>
    </div>
  `
  return sendEmail(to, `⭐ Nouvel avis sur "${productTitle}"`, html)
}