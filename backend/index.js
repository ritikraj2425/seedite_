const serverless = require('serverless-http');
const app = require('./server');
const mongoose = require('mongoose');

// Cache MongoDB connection
let cachedDb = null;

const connectToDatabase = async () => {
    // If we have a cached connection and it's healthy, return it
    if (cachedDb && mongoose.connection.readyState === 1) {
        console.log('Using cached database connection');
        return cachedDb;
    }

    // If no cached connection or connection is broken, create a new one
    try {
        console.log('Creating new database connection...');

        // Configure mongoose for serverless
        mongoose.set('bufferCommands', false);
        mongoose.set('strictQuery', true);

        // Connect with updated options (no deprecated options)
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
        });

        // Cache the connection
        cachedDb = conn;

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            cachedDb = null;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            cachedDb = null;
        });

        return conn;
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        cachedDb = null;
        throw error;
    }
};

// Initialize connection for cold starts (non-blocking)
let initPromise = null;

const initDatabase = async () => {
    if (!initPromise) {
        initPromise = connectToDatabase().catch(err => {
            console.error('Initial DB connection attempt failed:', err.message);
            // Don't throw here - we'll retry on first request
            initPromise = null;
            return null;
        });
    }
    return initPromise;
};

// Try to initialize on cold start
initDatabase().then(() => {
    console.log('Database initialization attempted');
}).catch(() => { });

const handler = serverless(app);

module.exports.handler = async (event, context) => {
    // Important for Vercel
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        // Ensure DB is connected before handling request
        await initDatabase();

        // Process the request
        const response = await handler(event, context);

        return response;
    } catch (error) {
        console.error('Handler error:', error);

        return {
            statusCode: error.statusCode || 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                success: false,
                message: 'Internal Server Error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                timestamp: new Date().toISOString()
            })
        };
    }
};