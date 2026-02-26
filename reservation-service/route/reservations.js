const express = require('express');
const axios = require('axios');
const router = express.Router();

// Service URLs from environment variables — not hardcoded
const ROOM_SERVICE_URL = process.env.ROOM_SERVICE_URL || 'http://localhost:3001';
const GUEST_SERVICE_URL = process.env.GUEST_SERVICE_URL || 'http://localhost:3002';

// In-memory reservation store
let reservations = [];
let reservationIdCounter = 1;

// Helper: Fetch room with timeout + basic retry
async function fetchRoom(roomId, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(
                `${ROOM_SERVICE_URL}/rooms/${roomId}`,
                { timeout: 3000 } // 3 second timeout — circuit breaker concept
            );
            return response.data.data; // unwrap service envelope
        } catch (error) {
            console.warn(`Attempt ${attempt}/${retries} failed for room ${roomId}`);
            if (attempt === retries) throw error;
            await new Promise(r => setTimeout(r, 500 * attempt)); // exponential backoff
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
            return response.data.data; // unwrap service envelope
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
        return res.status(400).json({ error: "Fields roomId, guestId, checkIn, and checkOut are required" });
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
        return res.status(400).json({ error: "checkOut must be after checkIn" });
    }

    try {
        // --- Inter-service REST calls ---
        const [room, guest] = await Promise.all([
            fetchRoom(roomId),
            fetchGuest(guestId)
        ]);

        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }
        if (!guest) {
            return res.status(404).json({ error: "Guest not found" });
        }
        if (!room.available) {
            return res.status(409).json({
                error: "Room is not available",
                roomNumber: room.number
            });
        }

        // Calculate total nights and price
        const nights = Math.ceil(
            (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
        );
        const totalPrice = room.price * nights;

        const reservation = {
            id: reservationIdCounter++,
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
            status: "CONFIRMED",
            createdAt: new Date().toISOString()
        };

        reservations.push(reservation);

        res.status(201).json({
            service: "reservation-service",
            message: "Reservation created successfully",
            data: reservation
        });
    } catch (error) {
        console.error("Reservation creation failed:", error.message);
        // Return a meaningful error — not a generic 500
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: "A dependent service is unavailable — please retry",
                retryAfter: 5
            });
        }
        res.status(500).json({ error: "Reservation processing failed", detail: error.message });
    }
});

// GET /reservations — List all reservations
router.get('/', (req, res) => {
    res.json({ service: "reservation-service", count: reservations.length, data: reservations });
});

// GET /reservations/:id
router.get('/:id', (req, res) => {
    const reservation = reservations.find(r => r.id == req.params.id);
    if (!reservation) {
        return res.status(404).json({ error: `Reservation ${req.params.id} not found` });
    }
    res.json({ service: "reservation-service", data: reservation });
});

// DELETE /reservations/:id — Cancel a reservation
router.delete('/:id', (req, res) => {
    const index = reservations.findIndex(r => r.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Reservation ${req.params.id} not found` });
    }

    reservations[index].status = "CANCELLED";
    res.json({ service: "reservation-service", message: "Reservation cancelled successfully", data: reservations[index] });
});

module.exports = router;
