const express = require('express');
const router = express.Router();

let rooms = [];
let nextId = 1;

router.get('/', (req, res) => {
  res.json({ service: 'room-service', data: rooms });
});

router.get('/:id', (req, res) => {
  const room = rooms.find(r => r.id === parseInt(req.params.id));
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ service: 'room-service', data: room });
});

router.post('/', (req, res) => {
  const { number, type, price, capacity } = req.body;
  if (!number || !type || !price || !capacity)
    return res.status(400).json({ error: 'Missing required fields' });
  const room = { id: nextId++, number, type, price, capacity, available: true };
  rooms.push(room);
  res.status(201).json({ service: 'room-service', message: 'Room created', data: room });
});

router.put('/:id', (req, res) => {
  const room = rooms.find(r => r.id === parseInt(req.params.id));
  if (!room) return res.status(404).json({ error: 'Room not found' });
  Object.assign(room, req.body);
  res.json({ service: 'room-service', message: 'Room updated', data: room });
});

router.patch('/:id/availability', (req, res) => {
  const room = rooms.find(r => r.id === parseInt(req.params.id));
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.available = req.body.available;
  res.json({ service: 'room-service', message: 'Availability updated', data: room });
});

router.delete('/:id', (req, res) => {
  const index = rooms.findIndex(r => r.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Room not found' });
  rooms.splice(index, 1);
  res.json({ service: 'room-service', message: 'Room deleted' });
});

module.exports = router;