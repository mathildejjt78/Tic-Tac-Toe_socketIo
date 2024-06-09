const express = require('express');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = require('http').Server(app);
const io = new Server(server);

let rooms = 0;

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

io.on('connection', (socket) => {
    // Create a new game room and notify the creator of the game.
    socket.on('createGame', (data) => {
        const roomName = `room-${++rooms}`;
        socket.join(roomName);
        socket.emit('newGame', { name: data.name, room: roomName });
    });

    // Connect the Player 2 to the room he requested. Show error if room full.
    socket.on('joinGame', (data) => {
        const room = io.sockets.adapter.rooms.get(data.room);
        if (room && room.size === 1) {
            socket.join(data.room);
            socket.broadcast.to(data.room).emit('player1', {});
            socket.emit('player2', { name: data.name, room: data.room });
        } else {
            socket.emit('err', { message: 'Désolé, la salle est pleine!' });
        }
    });

    // Handle the turn played by either player and notify the other.
    socket.on('playTurn', (data) => {
        socket.broadcast.to(data.room).emit('turnPlayed', {
            tile: data.tile,
            room: data.room
        });
    });

    // Notify the players about the victor.
    socket.on('gameEnded', (data) => {
        socket.broadcast.to(data.room).emit('gameEnd', data);
    });
});

// Use the PORT environment variable provided by Render
const PORT = process.env.PORT || 8005;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
