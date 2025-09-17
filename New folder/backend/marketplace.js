// Example Express backend for marketplace endpoints
const express = require('express');
const router = express.Router();

// In-memory store for demo
const products = [
  { id: '1', name: 'Pro Hair Dryer', price: 99, description: 'Salon-grade hair dryer.' },
  { id: '2', name: 'Organic Face Mask', price: 25, description: 'Natural ingredients.' },
];

// GET /products
router.get('/products', (req, res) => {
  res.json(products);
});

// POST /orders (escrow logic placeholder)
router.post('/orders', (req, res) => {
  // Validate payment, hold funds, create order
  res.json({ status: 'order_created', escrow: true });
});

// POST /seller/onboarding (KYC placeholder)
router.post('/seller/onboarding', (req, res) => {
  // Start KYC, bank verification (Stripe Connect)
  res.json({ status: 'kyc_started' });
});

module.exports = router;
