// ==== Log File Setup (MUST be at the very top) ====
const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const originalConsoleLog = console.log;
const originalConsoleError = console.error;


console.log = function (...args) {
    originalConsoleLog.apply(console, args);
    logStream.write(`${new Date().toISOString()} LOG: ${args.join(' ')}\n`);
};

console.error = function (...args) {
    originalConsoleError.apply(console, args);
    logStream.write(`${new Date().toISOString()} ERROR: ${args.join(' ')}\n`);
};

// ==== Global Error Handling for Uncaught Exceptions and Rejections ====
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// ==== Standard Server Setup ====
const cors = require('cors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');


// Import routers
const homeRouter = require('./routers/homeRouter');

// ==== Server Initialization ====
async function startServer() {
    try {
        const app = express();
        const server = http.createServer(app);
        const io = socketIo(server);

        // Set EJS as template engine
        app.set('view engine', 'ejs');

        // Middleware
        app.use(express.static(path.join(__dirname, 'stuff')));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use('/shared-uploads', express.static('/home/afrobgbs/portal.afrobuildlist.com/stuff/uploads'));

        app.use(cors({
            origin: '*', // allow all origins
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        }));

        // Routes
        homeRouter(app);

        // Socket.IO handling
        io.on('connection', (socket) => {
            console.log('A user connected');

            try {
                // Add your socket logic here if needed
            } catch (err) {
                console.error('Error in socket controller:', err);
            }

            socket.on('disconnect', () => {
                console.log('A user disconnected');
            });
        });

        // Start server
        const PORT = process.env.PORT || 7000;
        server.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });

    } catch (err) {
        console.error('Server initialization error:', err);
        process.exit(1);
    }
}

startServer();
