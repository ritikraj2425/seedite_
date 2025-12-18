const serverless = require('serverless-http');
const app = require('./server');
const connectDB = require('./config/db');

module.exports.handler = async (event, context) => {
    // Make sure to add this so you don't have a cold start for every request
    context.callbackWaitsForEmptyEventLoop = false;

    // Connect to database
    await connectDB();

    // Handle request
    const result = await serverless(app)(event, context);
    return result;
};
