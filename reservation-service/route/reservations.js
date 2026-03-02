const express = require('express');
const axios = require('axios');
const router = express.Router();

let reservations = [];
let nextId = 1;

const ROOM_SERVICE_URL = process.env.ROOM_SERVICE_URL || 'http://localhost:8081';
const GUEST_SERVICE_URL = process.env.GUEST_SERVICE_URL || 'http://localhost:8082';

// Helper: Fetch room with timeout + basic retry
async function fetchRoom(roomId, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(
                `${ROOM_SERVICE_URL}/rooms/${roomId}`,
                { timeout: 3000 }
            );
            return response.data.data;
        } catch (error) {
            console.warn(`Attempt ${attempt}/${retries} failed for room ${roomId}`);
            if (attempt === retries) throw error;
            await new Promise(r => setTimeout(r, 500 * attempt));
        }
    }
}

// Helper: Fetch guest with timeout + basic retry
async function fetchGuest(guestId, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(
                `${GUEST_SERVICE_URL}/guests/${guestId}`,
                { timeout: 3000 }
            );
            return response.data.data;
        } catch (error) {
            console.warn(`Attempt ${attempt}/${retries} failed for guest ${guestId}`);
            if (attempt === retries) throw error;
            await new Promise(r => setTimeout(r, 500 * attempt));
        }
    }
}

// POST /reservations — Create a new reservation
router.post('/', async (req, res) => {
    const { roomId, guestId, checkIn, checkOut } = req.body;

    if (!roomId || !guestId || !checkIn || !checkOut) {
        return res.status(400).json({ error: 'Fields roomId, guestId, checkIn, and checkOut are required' });
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
        return res.status(400).json({ error: 'checkOut must be after checkIn' });
    }

    try {
        const [room, guest] = await Promise.all([
            fetchRoom(roomId),
            fetchGuest(guestId)
        ]);

        if (!room) return res.status(404).json({ error: 'Room not found' });
        if (!guest) return res.status(404).json({ error: 'Guest not found' });
        if (!room.available) {
            return res.status(409).json({ error: 'Room is not available', roomNumber: room.number });
        }

        const nights = Math.ceil(
            (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
        );
        const totalPrice = room.price * nights;

        const reservation = {
            id: nextId++,
            guestId: guest.id,
            guestName: guest.name,
            roomId: room.id,
            roomNumber: room.number,
            roomType: room.type,
            checkIn,
            checkOut,
            nights,
            pricePerNight: room.price,
            totalPrice,
            status: 'CONFIRMED',
            createdAt: new Date().toISOString()
        };

        reservations.push(reservation);
        res.status(201).json({
            service: 'reservation-service',
            message: 'Reservation created successfully',
            data: reservation
        });
    } catch (error) {
        console.error('Reservation creation failed:', error.message);
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                error: 'A dependent service is unavailable — please retry',
                retryAfter: 5
            });
        }
        res.status(500).json({ error: 'Reservation processing failed', detail: error.message });
    }
});

// GET /reservations — List all reservations
router.get('/', (req, res) => {
    res.json({ service: 'reservation-service', count: reservations.length, data: reservations });
});

// GET /reservations/:id
router.get('/:id', (req, res) => {
    const reservation = reservations.find(r => r.id === parseInt(req.params.id));
    if (!reservation) return res.status(404).json({ error: `Reservation ${req.params.id} not found` });
    res.json({ service: 'reservation-service', data: reservation });
});

// DELETE /reservations/:id — Cancel a reservation
router.delete('/:id', (req, res) => {
    const reservation = reservations.find(r => r.id === parseInt(req.params.id));
    if (!reservation) return res.status(404).json({ error: `Reservation ${req.params.id} not found` });

    reservation.status = 'CANCELLED';
    res.json({ service: 'reservation-service', message: 'Reservation cancelled successfully', data: reservation });
});

module.exports = router;