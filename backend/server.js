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

// Test endpoint without DB
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working locally',
        time: new Date().toISOString()
    });
});

// Health Check (DB-independent)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const mockTestRoutes = require('./routes/mockTestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const videoRoutes = require('./routes/videoRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

// Serve uploaded videos (for local only)
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
    res.send('Seedite Education Platform API is running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Only start server if running locally
if (require.main === module) {
    const connectDB = require('./config/db');
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Local server running at http://localhost:${PORT}`);
        });
    }).catch(err => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });
}

module.exports = app;