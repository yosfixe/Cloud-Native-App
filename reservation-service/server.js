const express = require('express');
const logger = require('./middleware/logger');
const reservationRoutes = require('./route/reservations');

const app = express();
const PORT = process.env.PORT || 8083;

app.use(express.json());
app.use(logger);

// Mount routes
app.use('/reservations', reservationRoutes);

// Root health
app.get('/health', (req, res) => {
    res.json({ status: "UP", service: "reservation-service" });
});

app.listen(PORT, () => {
    console.log(`Reservation Service running on port ${PORT}`);
});
