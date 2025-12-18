const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    // Check if we have a connection and it's ready (state 1 = connected)
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // If existing promise but not connected, maybe we are connecting?
    // If readyState is 0 (disconnected) or 3 (disconnecting), we should retry.
    // Safe bet: if not READY, just start over.
    if (!cached.promise || mongoose.connection.readyState === 0) {
        console.log('Connecting to MongoDB...');
        console.log('URI Defined:', !!process.env.MONGODB_URI);

        if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const opts = {
            bufferCommands: false, // Disable Mongoose buffering
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s if IP is blocked
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        };

        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ritik-platform';

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log('New MongoDB Connection Established');
            return mongoose;
        }).catch(err => {
            console.error('MongoDB Connection Failed:', err);
            cached.promise = null; // Reset promise on failure
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

module.exports = connectDB;
