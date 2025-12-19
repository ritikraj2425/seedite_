// index.js - For Vercel deployment
const serverless = require('serverless-http');
const mongoose = require('mongoose');

// Import the Express app
const app = require('./server');

// Configure mongoose for serverless
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

let isConnected = false;
let connectionPromise = null;

// Improved connection function
const connectDB = async () => {
    // If already connected, return
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    // If connection is in progress, wait for it
    if (connectionPromise) {
        return connectionPromise;
    }

    // Create new connection
    connectionPromise = (async () => {
        try {
            console.log('Attempting to connect to MongoDB on Vercel...');

            // IMPORTANT: For MongoDB Atlas, make sure connection string includes retryWrites
            const connectionString = process.env.MONGODB_URI;

            if (!connectionString) {
                throw new Error('MONGODB_URI environment variable is not set');
            }

            await mongoose.connect(connectionString, {
                serverSelectionTimeoutMS: 8000, // 8 seconds timeout
                socketTimeoutMS: 45000,
                maxPoolSize: 5,
                minPoolSize: 1,
                // Remove useNewUrlParser and useUnifiedTopology for Mongoose 6+
            });

            isConnected = true;
            console.log('✅ MongoDB connected successfully on Vercel');

            // Monitor connection
            mongoose.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
                isConnected = false;
                connectionPromise = null;
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                isConnected = false;
                connectionPromise = null;
            });

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            console.error('Connection string present:', !!process.env.MONGODB_URI);
            isConnected = false;
            connectionPromise = null;
            throw error;
        }
    })();

    return connectionPromise;
};

// Create serverless handler
const handler = serverless(app);

// Main handler for Vercel
module.exports.handler = async (event, context) => {
    // Critical for Vercel: prevent waiting for empty event loop
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        // Try to connect to MongoDB
        await connectDB();

        // Process the request
        return await handler(event, context);
    } catch (error) {
        console.error('Request handler error:', error);

        // Return proper error response
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                success: false,
                message: 'Server Error',
                error: error.message,
                dbConnected: isConnected,
                dbState: mongoose.connection.readyState,
                timestamp: new Date().toISOString()
            })
        };
    }
};