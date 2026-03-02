const express = require('express');
const logger = require('./middleware/logger');
const roomRoutes = require('./route/rooms');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(express.json());
app.use(logger);

// Mount routes
app.use('/rooms', roomRoutes);

// Root health
app.get('/health', (req, res) => {
    res.json({ status: "UP", service: "room-service" });
});

app.listen(PORT, () => {
    console.log(`Room Service running on port ${PORT}`);
});