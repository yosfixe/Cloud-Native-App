const express = require('express');
const router = express.Router();

let guests = [];
let nextId = 1;

// GET all guests
router.get('/', (req, res) => {
    res.json({ service: 'guest-service', data: guests });
});

// GET single guest
router.get('/:id', (req, res) => {
    const guest = guests.find(g => g.id === parseInt(req.params.id));
    if (!guest) return res.status(404).json({ error: `Guest ${req.params.id} not found` });
    res.json({ service: 'guest-service', data: guest });
});

// POST /guests — Register a new guest
router.post('/', (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Fields name and email are required' });
    }

    if (guests.find(g => g.email === email)) {
        return res.status(409).json({ error: `Guest with email '${email}' already exists` });
    }

    const guest = {
        id: nextId++,
        name,
        email,
        phone: phone || null,
        createdAt: new Date().toISOString()
    };

    guests.push(guest);
    res.status(201).json({ service: 'guest-service', message: 'Guest registered successfully', data: guest });
});

// PUT /guests/:id — Update guest info
router.put('/:id', (req, res) => {
    const guest = guests.find(g => g.id === parseInt(req.params.id));
    if (!guest) return res.status(404).json({ error: `Guest ${req.params.id} not found` });

    Object.assign(guest, req.body);
    res.json({ service: 'guest-service', message: 'Guest updated successfully', data: guest });
});

// DELETE /guests/:id
router.delete('/:id', (req, res) => {
    const index = guests.findIndex(g => g.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: `Guest ${req.params.id} not found` });

    const guestName = guests[index].name;
    guests.splice(index, 1);
    res.json({ service: 'guest-service', message: `Guest '${guestName}' deleted successfully` });
});

module.exports = router;