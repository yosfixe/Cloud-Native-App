cat > /home/claude/hotel-services/room-service/route/rooms.js << 'EOF'
const express = require('express');
const router = express.Router();
const db = require('../firebase');

const COLLECTION = 'rooms';

// GET all rooms
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection(COLLECTION).get();
        const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ service: "room-service", data: rooms });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch rooms", detail: error.message });
    }
});

// GET single room
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection(COLLECTION).doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: `Room ${req.params.id} not found` });
        }
        res.json({ service: "room-service", data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch room", detail: error.message });
    }
});

// POST /rooms — Create a new room
router.post('/', async (req, res) => {
    try {
        const { number, type, price, capacity } = req.body;

        if (!number || !type || !price || !capacity) {
            return res.status(400).json({ error: "Fields number, type, price, and capacity are required" });
        }

        // Check if room number already exists
        const existing = await db.collection(COLLECTION).where('number', '==', number).get();
        if (!existing.empty) {
            return res.status(409).json({ error: `Room number '${number}' already exists` });
        }

        const room = {
            number,
            type,
            price,
            capacity,
            available: true,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection(COLLECTION).add(room);
        res.status(201).json({ service: "room-service", message: "Room created successfully", data: { id: docRef.id, ...room } });
    } catch (error) {
        res.status(500).json({ error: "Failed to create room", detail: error.message });
    }
});

// PUT /rooms/:id — Update a room
router.put('/:id', async (req, res) => {
    try {
        const ref = db.collection(COLLECTION).doc(req.params.id);
        const doc = await ref.get();

        if (!doc.exists) {
            return res.status(404).json({ error: `Room ${req.params.id} not found` });
        }

        await ref.update(req.body);
        const updated = await ref.get();
        res.json({ service: "room-service", message: "Room updated successfully", data: { id: updated.id, ...updated.data() } });
    } catch (error) {
        res.status(500).json({ error: "Failed to update room", detail: error.message });
    }
});

// PATCH /rooms/:id/availability — Toggle availability
router.patch('/:id/availability', async (req, res) => {
    try {
        const { available } = req.body;

        if (typeof available !== 'boolean') {
            return res.status(400).json({ error: "Field 'available' must be a boolean" });
        }

        const ref = db.collection(COLLECTION).doc(req.params.id);
        const doc = await ref.get();

        if (!doc.exists) {
            return res.status(404).json({ error: `Room ${req.params.id} not found` });
        }

        await ref.update({ available });
        const updated = await ref.get();
        res.json({ service: "room-service", message: "Room availability updated", data: { id: updated.id, ...updated.data() } });
    } catch (error) {
        res.status(500).json({ error: "Failed to update availability", detail: error.message });
    }
});

// DELETE /rooms/:id
router.delete('/:id', async (req, res) => {
    try {
        const ref = db.collection(COLLECTION).doc(req.params.id);
        const doc = await ref.get();

        if (!doc.exists) {
            return res.status(404).json({ error: `Room ${req.params.id} not found` });
        }

        const roomNumber = doc.data().number;
        await ref.delete();
        res.json({ service: "room-service", message: `Room '${roomNumber}' deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete room", detail: error.message });
    }
});

module.exports = router;
EOF