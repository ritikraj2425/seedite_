// index.js - For Vercel deployment only
const serverless = require('serverless-http');
const mongoose = require('mongoose');

// Simple connection for Vercel
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return;
        }

        console.log('Connecting to MongoDB on Vercel...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 3000,
            socketTimeoutMS: 10000,
        });
        console.log('MongoDB connected on Vercel');
    } catch (error) {
        console.error('Vercel MongoDB connection error:', error.message);
        // Don't throw - let the app handle requests without DB
    }
};

// Try to connect
connectDB();

// Import app AFTER mongoose is configured
const app = require('./server');

const handler = serverless(app);

module.exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    return handler(event, context);
};