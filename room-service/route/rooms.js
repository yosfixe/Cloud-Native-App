const express = require('express');
const router = express.Router();

// In-memory room store
let rooms = [
    { id: 1, number: "101", type: "single", price: 80, capacity: 1, available: true },
    { id: 2, number: "102", type: "double", price: 120, capacity: 2, available: true },
    { id: 3, number: "201", type: "suite", price: 250, capacity: 4, available: true },
];
let roomIdCounter = 4;

// GET all rooms
router.get('/', (req, res) => {
    res.json({ service: "room-service", data: rooms });
});

// GET single room
router.get('/:id', (req, res) => {
    const room = rooms.find(r => r.id == req.params.id);
    if (!room) {
        return res.status(404).json({ error: `Room ${req.params.id} not found` });
    }
    res.json({ service: "room-service", data: room });
});

// POST /rooms — Create a new room
router.post('/', (req, res) => {
    const { number, type, price, capacity } = req.body;

    if (!number || !type || !price || !capacity) {
        return res.status(400).json({ error: "Fields number, type, price, and capacity are required" });
    }

    const existing = rooms.find(r => r.number === number);
    if (existing) {
        return res.status(409).json({ error: `Room number '${number}' already exists` });
    }

    const room = {
        id: roomIdCounter++,
        number,
        type,
        price,
        capacity,
        available: true,
        createdAt: new Date().toISOString()
    };

    rooms.push(room);
    res.status(201).json({ service: "room-service", message: "Room created successfully", data: room });
});

// PUT /rooms/:id — Update a room
router.put('/:id', (req, res) => {
    const index = rooms.findIndex(r => r.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Room ${req.params.id} not found` });
    }

    rooms[index] = { ...rooms[index], ...req.body, id: rooms[index].id };
    res.json({ service: "room-service", message: "Room updated successfully", data: rooms[index] });
});

// PATCH /rooms/:id/availability — Toggle availability
router.patch('/:id/availability', (req, res) => {
    const { available } = req.body;

    if (typeof available !== 'boolean') {
        return res.status(400).json({ error: "Field 'available' must be a boolean" });
    }

    const index = rooms.findIndex(r => r.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Room ${req.params.id} not found` });
    }

    rooms[index].available = available;
    res.json({ service: "room-service", message: "Room availability updated", data: rooms[index] });
});

// DELETE /rooms/:id
router.delete('/:id', (req, res) => {
    const index = rooms.findIndex(r => r.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Room ${req.params.id} not found` });
    }

    const deleted = rooms.splice(index, 1)[0];
    res.json({ service: "room-service", message: `Room '${deleted.number}' deleted successfully` });
});

module.exports = router;
