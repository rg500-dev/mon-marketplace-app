import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../prisma';
import requireAuth from '../middleware/auth';

const router = Router();

// Initialisation de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27' as any,
});

// Route pour créer l'intention de paiement (authentifié requis)
router.post('/create-intent', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { productId } = req.body;

    // 1. Chercher le produit dans la base de données pour vérifier le prix
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }

    // 2. Créer l'intention de paiement sur Stripe (Montant en centimes : ex 10€ = 1000)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(product.price * 100), 
      currency: 'eur', // Mettez votre devise (eur, xaf, etc.)
      metadata: { 
        productId: product.id,
        // Plus tard, on liera l'ID de l'acheteur ici
      },
      // capture_method: 'manual' <-- Optionnel: pour bloquer l'argent sans le transférer de suite
    });

    // 3. Renvoyer le client_secret au Frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });

  } catch (error: any) {
    console.error("Erreur Stripe:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;