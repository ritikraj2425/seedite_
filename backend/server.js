const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        process.env.ADMIN_FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://seedite.vercel.app",
    ],
    credentials: true
}));

// Database Connection
// Database Connection is handled in index.js for Vercel
// or in the local start block below
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const mockTestRoutes = require('./routes/mockTestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const videoRoutes = require('./routes/videoRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Health Check (DB-independent)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', paymentRoutes);
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

// Serve uploaded videos
app.use('/uploads', express.static('uploads'));

// Global Error Handler for Vercel Debugging
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.get('/', (req, res) => {
    res.send('Seedite Education Platform API is running');
});

// remove app.listen completely
// Only start the server if running locally/directly
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    // Connect to DB before starting local server
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Local server running at http://localhost:${PORT}`);
        });
    });
}

module.exports = app;
