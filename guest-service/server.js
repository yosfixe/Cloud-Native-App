const express = require('express');
const logger = require('./middleware/logger');
const guestRoutes = require('./route/guests');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(logger);

// Mount routes
app.use('/guests', guestRoutes);

// Root health
app.get('/health', (req, res) => {
    res.json({ status: "UP", service: "guest-service" });
});

app.listen(PORT, () => {
    console.log(`Guest Service running on port ${PORT}`);
});
