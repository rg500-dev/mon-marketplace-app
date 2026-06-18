import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Initialisation de Stripe avec votre clé secrète (à mettre dans le fichier .env plus tard)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_votre_cle_ici', {
  apiVersion: '2025-01-27' as any, // Utilise la version API stable
});

// Route pour créer l'intention de paiement
router.post('/create-intent', async (req: Request, res: Response): Promise<any> => {
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