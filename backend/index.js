const serverless = require('serverless-http');
const app = require('./server');

module.exports = serverless(app, {
    request: (req, event, context) => {
        context.callbackWaitsForEmptyEventLoop = false;
    }
});
