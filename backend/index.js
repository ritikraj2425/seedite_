const serverless = require('serverless-http');
const app = require('./server');
const connectDB = require('./config/db');

// Connect ONCE at cold start
connectDB().catch(err => {
    console.error('MongoDB initial connection error:', err);
});

const handler = serverless(app);

module.exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    return handler(event, context);
};
