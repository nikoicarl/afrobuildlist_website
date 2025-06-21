require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');


const homeRouter = require('./routers/homeRouter');


// Initialize the server
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


        // Route to index page
        homeRouter(app);

        // Socket.IO connection handling
        io.on('connection', (socket) => {
            console.log('A user connected');

            try {
                
            } catch (err) {
                console.error('Error in socket controller:', err);
            }

            socket.on('disconnect', () => {
                console.log('A user disconnected');
            });
        });

        // Start server
        const PORT = process.env.PORT || 7000;
        const ENV = process.env.NODE_ENV || 'development';

        server.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });

    } catch (err) {
        console.error('Server initialization error:', err);
        process.exit(1);
    }
}

startServer();
