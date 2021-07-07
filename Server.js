const express = require('express');
const app = express()
const http = require('http')
const server = http.Server(app);
const io = require("socket.io")(server)
const players = require("./players/index")
const generate = require('project-name-generator');


io.on('connection', function (socket) {
    const userName = generate().dashed;
    players[socket.id] = {
        userName: userName,
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        team: (Math.floor(Math.random() * 2) === 0) ? 'red' : 'blue'
    };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
    console.log(`User "${userName}" will be connected!`, players);
    socket.on('disconnect', function () {
        console.log(`User ${userName} will be disconnected!`, players);
        delete players[socket.id];
        io.emit('disconnected', socket.id);
    });
    // когда игроки движутся, то обновляем данные по ним
    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        // отправляем общее сообщение всем игрокам о перемещении игрока
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8080, "localhost", () => {
    console.log('Server listening on http://localhost:8080');
    console.log(" ")
    console.log("===WELCOME TO SPACE DEFENDER!===")
    console.log(" ")
});
