import log4js from 'log4js';
import express from 'express';

const fs = require('fs');

// Read config file to variable
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));


// Setup logger
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['out'], level: config.logger.default },
    HTTP: { appenders: ['out'], level: config.logger.HTTP },
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
app.use((req, res) => {
  logger.debug('Mirroring request', req.headers);

  // Get IP of client
  // Prepended: List of ip headers which should overwrite remoteAddress field
  // If there is a proxy between the client and this server it (probably) inserts one of these
  // If none of these special ip headers are present, use connection address
  const ip = req.headers['cf-connecting-ip'] || req.headers['true-client-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  const reply = {
    ip,
    httpMethod: req.method,
    headers: req.headers,
  };

  try {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(reply, null, 3));
  } catch (error) {
    logger.error('Error while converting reply object to string', error, reply);
    res.status(500).send();
  }
});

const host = config.http.host || 'localhost';
const port = config.http.port || 8000;

app.listen(port, host, () => {
  logger.info(`Started Mirror at http://${host}:${port}`);
});
