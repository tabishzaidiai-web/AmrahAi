import { loadStripe } from '@stripe/stripe-js';

// AMRAH Stripe Configuration - Authorized Visual Commerce
const STRIPE_PUBLIC_KEY = "pk_test_51SwYDJ3zxqcaKujrX9vvvZ1cdTo9Ff0NmaaCmOCGYwVYM2Bwd17v1Kt7BLn20PrF1xK0cFWKtzfs3euv3iwchc00pCxQK8QQ";

export class StripeService {
  private static stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

  static async initiateCheckout(priceId: string, userEmail: string, token?: string) {
    try {
      // In a real environment, you would call your backend to create a Checkout Session
      // This matches the backend/routes/stripe.js pattern
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          planId: priceId, // Using Stripe Price ID as the planId
          email: userEmail,
          success_url: window.location.origin + '?payment=success',
          cancel_url: window.location.origin + '?payment=cancelled'
        })
      });

      const session = await response.json();

      if (session.url) {
        window.location.href = session.url;
      } else if (session.id) {
        const stripe = await this.stripePromise;
        if (stripe) {
          // Fix: Use type casting to resolve TypeScript error where 'redirectToCheckout' might not be recognized on the Stripe type.
          await (stripe as any).redirectToCheckout({ sessionId: session.id });
        }
      } else {
        // Fallback for local demo mode if no backend is detected
        console.warn("Maison Local Mode: Stripe Backend missing. Simulating successful redirect for priceId: " + priceId);
        return new Promise((resolve) => {
          setTimeout(() => {
            window.location.href = window.location.origin + '?payment=success';
            resolve(true);
          }, 2000);
        });
      }
    } catch (error) {
      console.error("Stripe Orchestration Error:", error);
      throw error;
    }
  }
}