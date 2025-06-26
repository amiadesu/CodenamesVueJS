const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
var middleware = require('socketio-wildcard')();

const { config } = require("./utils/config");

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

setupUserRegistration().then(() => {
    console.log("1");
}).catch((error) => {
    console.log(error);
})

const CodenamesIO = globalIO.of("/codenames");
// CodenamesIO.use(middleware);
setupCodenames(CodenamesIO);
// const io = globalio;


server.listen(3000, () => {
    console.log(`Server running on ${config.server.url}`);
});

process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (err) => {
    console.error('[Unhandled Rejection]', err);
});