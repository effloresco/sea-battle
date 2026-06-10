import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

function createEmptyBoard() {
    let board = [];
    for (let y = 1; y <= BOARD_SIZE; y++) {
        for (let x = 1; x <= BOARD_SIZE; x++) {
            board.push({ X: x, Y: y, Status: 0 });
        }
    }
    return board;
}

server.listen(3000, () => console.log('Server is online on port 3000'));