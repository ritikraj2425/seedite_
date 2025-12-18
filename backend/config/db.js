const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        console.log('Connecting to MongoDB...');
        console.log('URI Defined:', !!process.env.MONGODB_URI);

        if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const opts = {
            bufferCommands: false, // Disable Mongoose buffering
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ritik-platform', opts).then((mongoose) => {
            console.log('New MongoDB Connection Established');
            return mongoose;
        }).catch(err => {
            console.error('MongoDB Connection Failed:', err);
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
