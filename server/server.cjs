const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { config } = require("./utils/config");
const { logger } = require("./utils/logger");

const { setupUserRegistration } = require("./server_modules/Global/logic/userRegistration");
const { setupCodenames } = require("./server_modules/Codenames/codenames");

const app = express();
const corsOptions = config.cors.options;
app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
});
const server = http.createServer(app);
const globalIO = new Server(server, {
    path: "/ios/",
    cors: corsOptions
});

setupUserRegistration().catch((error) => {
    logger.error(error);
})

const CodenamesIO = globalIO.of("/codenames");
setupCodenames(CodenamesIO);


server.listen(3000, () => {
    logger.error(`Server running on ${config.server.url}`);
});

process.on('uncaughtException', (err) => {
    logger.error(`[Uncaught Exception] ${err}`);
});

process.on('unhandledRejection', (err) => {
    logger.error(`[Unhandled Rejection] ${err}`);
});