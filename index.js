require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['https://chiranth-008.github.io', '*'],   // Allow your exact GitHub Pages domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Firebase setup
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = require('./firebase-service-account.json');
    }
} catch (err) {
    console.error("❌ Firebase service account error:", err.message);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Health check
app.get('/', (req, res) => {
    res.json({ message: "🚀 Minecraft Backend is running! Connected to Firebase." });
});

// Get all comments
app.get('/api/comments', async (req, res) => {
    try {
        const snapshot = await db.collection('comments')
            .orderBy('timestamp', 'desc')
            .get();

        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

// Save new comment
app.post('/api/comments', async (req, res) => {
    try {
        const { name, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        await db.collection('comments').add({
            name: (name || 'Anonymous').trim(),
            message: message.trim(),
            timestamp: new Date().toISOString()
        });

        res.json({ success: true, message: "Comment saved to Firebase!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save comment" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
