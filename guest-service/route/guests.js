const express = require('express');
const router = express.Router();

// In-memory guest store
let guests = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", phone: "+1-555-0101" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", phone: "+1-555-0102" },
    { id: 3, name: "Carol White", email: "carol@example.com", phone: "+1-555-0103" },
];
let guestIdCounter = 4;

// GET all guests
router.get('/', (req, res) => {
    res.json({ service: "guest-service", data: guests });
});

// GET single guest
router.get('/:id', (req, res) => {
    const guest = guests.find(g => g.id == req.params.id);
    if (!guest) {
        return res.status(404).json({ error: `Guest ${req.params.id} not found` });
    }
    res.json({ service: "guest-service", data: guest });
});

// POST /guests — Register a new guest
router.post('/', (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: "Fields name and email are required" });
    }

    const existing = guests.find(g => g.email === email);
    if (existing) {
        return res.status(409).json({ error: `Guest with email '${email}' already exists` });
    }

    const guest = {
        id: guestIdCounter++,
        name,
        email,
        phone: phone || null,
        createdAt: new Date().toISOString()
    };

    guests.push(guest);
    res.status(201).json({ service: "guest-service", message: "Guest registered successfully", data: guest });
});

// PUT /guests/:id — Update guest info
router.put('/:id', (req, res) => {
    const index = guests.findIndex(g => g.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Guest ${req.params.id} not found` });
    }

    guests[index] = { ...guests[index], ...req.body, id: guests[index].id };
    res.json({ service: "guest-service", message: "Guest updated successfully", data: guests[index] });
});

// DELETE /guests/:id
router.delete('/:id', (req, res) => {
    const index = guests.findIndex(g => g.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Guest ${req.params.id} not found` });
    }

    const deleted = guests.splice(index, 1)[0];
    res.json({ service: "guest-service", message: `Guest '${deleted.name}' deleted successfully` });
});

module.exports = router;
