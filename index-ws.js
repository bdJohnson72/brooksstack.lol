const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

// Create HTTP server
const server = http.createServer(app);

// Handle WebSocket connections
const wss = new WebSocket.Server({ server });

// Set up the WebSocket connection and event handling
wss.on('connection', (ws) => {
    const numClients = wss.clients.size;

    console.log('clients connected: ', numClients);

    wss.broadcast(`Current visitors: ${numClients}`);

    if (ws.readyState === WebSocket.OPEN) {
        ws.send('welcome!');
    }

    db.run(`INSERT INTO visitors (count, time) VALUES (?, datetime('now'))`, numClients);

    ws.on('close', () => {
        wss.broadcast(`Current visitors: ${wss.clients.size}`);
        console.log('A client has disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Broadcast data to all connected clients
wss.broadcast = function broadcast(data) {
    console.log('Broadcasting: ', data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run(`
        CREATE TABLE visitors (
            count INTEGER,
            time TEXT
        )
    `);
});

// Function to log visitor counts
function getCounts() {
    db.each("SELECT * FROM visitors", (err, row) => {
        if (err) {
            console.error('Database error:', err);
        } else {
            console.log(row);
        }
    });
}

// Function to shut down the database
function shutDownDB() {
    getCounts();
    console.log('shutting down db');
    db.close();
}

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT');
    wss.clients.forEach((client) => {
        client.close();
    });
    server.close(() => {
        shutDownDB();
    });
});

// Start the server
server.listen(PORT, () => {
    console.log('Listening on ' + PORT);
});
