cat > /home/claude/hotel-services/guest-service/route/guests.js << 'EOF'
const express = require('express');
const router = express.Router();
const db = require('../firebase');

const COLLECTION = 'guests';

// GET all guests
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection(COLLECTION).get();
        const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ service: "guest-service", data: guests });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch guests", detail: error.message });
    }
});

// GET single guest
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection(COLLECTION).doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: `Guest ${req.params.id} not found` });
        }
        res.json({ service: "guest-service", data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch guest", detail: error.message });
    }
});

// POST /guests — Register a new guest
router.post('/', async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Fields name and email are required" });
        }

        // Check if email already exists
        const existing = await db.collection(COLLECTION).where('email', '==', email).get();
        if (!existing.empty) {
            return res.status(409).json({ error: `Guest with email '${email}' already exists` });
        }

        const guest = {
            name,
            email,
            phone: phone || null,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection(COLLECTION).add(guest);
        res.status(201).json({ service: "guest-service", message: "Guest registered successfully", data: { id: docRef.id, ...guest } });
    } catch (error) {
        res.status(500).json({ error: "Failed to create guest", detail: error.message });
    }
});

// PUT /guests/:id — Update guest info
router.put('/:id', async (req, res) => {
    try {
        const ref = db.collection(COLLECTION).doc(req.params.id);
        const doc = await ref.get();

        if (!doc.exists) {
            return res.status(404).json({ error: `Guest ${req.params.id} not found` });
        }

        await ref.update(req.body);
        const updated = await ref.get();
        res.json({ service: "guest-service", message: "Guest updated successfully", data: { id: updated.id, ...updated.data() } });
    } catch (error) {
        res.status(500).json({ error: "Failed to update guest", detail: error.message });
    }
});

// DELETE /guests/:id
router.delete('/:id', async (req, res) => {
    try {
        const ref = db.collection(COLLECTION).doc(req.params.id);
        const doc = await ref.get();

        if (!doc.exists) {
            return res.status(404).json({ error: `Guest ${req.params.id} not found` });
        }

        const guestName = doc.data().name;
        await ref.delete();
        res.json({ service: "guest-service", message: `Guest '${guestName}' deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete guest", detail: error.message });
    }
});

module.exports = router;
EOF