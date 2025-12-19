const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('Using existing database connection');
            return mongoose.connection;
        }

        console.log('Connecting to MongoDB...');

        // Remove useNewUrlParser and useUnifiedTopology - they're deprecated
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            // These options are now default in Mongoose 6+
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw error; // Don't exit process in serverless environment
    }
};

module.exports = connectDB;