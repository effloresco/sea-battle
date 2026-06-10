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

function canPlaceAt(board, x, y) {
    if (x < 1 || x > 10 || y < 1 || y > 10)
        return false;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const neighbor = board.find(cell => cell.X === x + dx && cell.Y === y + dy);
            if (neighbor && neighbor.Status === 1)
                return false;
        }
    }
    return true;
}

function placeShips(board) {
    const ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
    ships.forEach(size => {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 500) {
            attempts++;
            const horizontal = Math.random() > 0.5;
            const ship_x = Math.floor(Math.random() * 10) + 1;
            const ship_y = Math.floor(Math.random() * 10) + 1;

            let cells = [];
            let ok = true;
            for (let i = 0; i < size; i++) {
                const cell_x = horizontal ? ship_x + i : ship_x;
                const cell_y = horizontal ? ship_y : ship_y + i;
                if (!canPlaceAt(board, cell_x, cell_y)) {
                    ok = false;
                    break;
                }
                cells.push({ X: cell_x, Y: cell_y });
            }
            if (ok) {
                cells.forEach(spot => board.find(cell => cell.X === spot.X && cell.Y === spot.Y).Status = 1);
                placed = true;
            }
        }
    });
}

server.listen(3000, () => console.log('Server is online on port 3000'));