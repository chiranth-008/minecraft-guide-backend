require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS for your GitHub Pages site (you can change '*' to your exact GitHub URL later)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// 🔥 Firebase Admin SDK setup (works with file OR env var)
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  try {
    serviceAccount = require('./firebase-service-account.json');
  } catch (err) {
    console.error('❌ Firebase service account not found. Please add firebase-service-account.json or set FIREBASE_SERVICE_ACCOUNT env var.');
    process.exit(1);
  }
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚀 Minecraft Guide Backend is running! Connected to Firebase.' });
});

// ✅ GET all dynamic guide sections from Firebase
app.get('/api/sections', async (req, res) => {
  try {
    const snapshot = await db.collection('guide-sections')
      .orderBy('order', 'asc')
      .get();
    
    const sections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(sections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch sections from Firebase' });
  }
});

// ✅ POST user feedback / community tip
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, message } = req.body;
    
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }

    await db.collection('feedbacks').add({
      name: name.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      // You can add more fields later (e.g. minecraftVersion, rating)
    });

    res.json({ success: true, message: 'Thank you! Your feedback has been saved to Firebase.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Minecraft Backend running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints: /api/sections and /api/feedback`);
});
