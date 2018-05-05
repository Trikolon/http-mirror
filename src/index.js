import log4js from 'log4js';
import express from 'express';

const fs = require('fs');

// Read config file to variable
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));


// Setup logger
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    file: { type: 'file', filename: 'server.log' },
  },
  categories: {
    default: { appenders: ['out', 'file'], level: config.logger.default },
    HTTP: { appenders: ['out', 'file'], level: config.logger.HTTP },
  },
});
const logger = log4js.getLogger();

// Setup express webserver
const app = express();
// Register logger to log http requests
app.use(log4js.connectLogger(log4js.getLogger('HTTP'), { level: 'auto' }));
// Set CORS headers to allow all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Set up handler for request header reply
app.use((req, res, next) => {
  logger.debug('Mirroring request', req.headers);
  res.json(req.headers);
  next();
});

app.listen(config.http.port, config.http.host);

logger.info(`Started Mirror at http://${config.http.hostname}:${config.http.port}`);
