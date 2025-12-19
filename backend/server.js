const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/mock-tests', require('./routes/mockTestRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Seedite Education Platform API',
        version: '1.0.0',
        status: 'running',
        mongooseVersion: mongoose.version
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});

// For local development only
if (require.main === module) {
    const connectDB = require('./config/db');
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Local server running at http://localhost:${PORT}`);
        });
    }).catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = app;