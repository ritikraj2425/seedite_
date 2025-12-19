// index.js - Revised for Vercel
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const app = require('./server');

// Critical Vercel setting
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

let cachedConnection = null;
const connectDB = async () => {
    // If a healthy, cached connection exists, use it
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    console.log('Creating new MongoDB connection...');

    // FAIL FAST: Use very short timeouts for serverless
    const connectionOptions = {
        serverSelectionTimeoutMS: 3000, // Fail after 3 seconds
        socketTimeoutMS: 10000,
        maxPoolSize: 2, // Small pool for serverless
        minPoolSize: 0,
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
        cachedConnection = mongoose.connection;
        console.log('MongoDB connected successfully.');
        return cachedConnection;
    } catch (err) {
        console.error('MongoDB connection FAILED:', err.message);
        cachedConnection = null;
        // DO NOT throw the error here for all requests.
        // Let individual API routes handle missing DB.
        return null;
    }
};

const handler = serverless(app);

module.exports.handler = async (event, context) => {
    // This allows Vercel to freeze the process between requests
    context.callbackWaitsForEmptyEventLoop = false;

    // Connect to DB inside the handler, not outside
    await connectDB();

    // Proceed with the request
    return handler(event, context);
};