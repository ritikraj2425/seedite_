const serverless = require('serverless-http');
const app = require('./server');
const connectDB = require('./config/db');

module.exports.handler = async (event, context) => {
    // Make sure to add this so you don't have a cold start for every request
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        // Connect to database
        await connectDB();

        // Handle request
        const result = await serverless(app)(event, context);
        return result;
    } catch (error) {
        console.error('SERVERLESS HANDLER ERROR:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Server Configuration Error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
