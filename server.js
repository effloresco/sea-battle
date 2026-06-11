import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const BOARD_SIZE = 10;
let game = {
    players: [],
    boards: {},
    turn: null,
    winner: null
};

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

function sendState() {
    if (game.players.length === 0) return;

    game.players.forEach(pId => {
        const oppId = game.players.find(id => id !== pId);

        const opponentBoard = oppId ? game.boards[oppId].map(c => ({
            X: c.X, Y: c.Y, Status: (c.Status === 1 && !game.winner) ? 0 : c.Status
        })) : createEmptyBoard();

        const myBoard = game.boards[pId];

        io.to(pId).emit('update', {
            opponentBoard: opponentBoard,
            myBoard: myBoard,
            isMyTurn: game.turn === pId,
            ready: game.players.length === 2,
            winner: game.winner ? (game.winner === pId ? "YOU WIN!" : "YOU LOSE!") : null
        });
    });
}

io.on('connection', (socket) => {
    console.log('User connected: ', socket.id);

    socket.on('joinGame', () => {
        if (game.players.length < 2) {
            game.players.push(socket.id);

            if (game.players.length == 1)
                game.turn = socket.id;

            const board = createEmptyBoard();
            placeShips(board);
            game.boards[socket.id] = board;
        };

        sendState();
    });

    socket.on('shot', ({x, y }) => {
        if (game.winner || game.turn !== socket.id) return;
        const oppId = game.players.find(id => id !== socket.id);
        const cell = game.boards[oppId].find(c => c.X == x && c.Y == y);
        if (cell && cell.Status <= 1) {
            if (cell.Status === 1) {
                cell.Status = 3;
                if (!game.boards[oppId].some(c => c.Status === 1)) game.winner = socket.id;
            } else {
                cell.Status = 2;
                game.turn = oppId;
            }
            sendState();
        }
    });

    socket.on("disconnect", () => {
        console.log('User disconnected: ', socket.id);

        const index = game.players.indexOf(socket.id);
        if (index > -1) {
            game.players.splice(index, 1);

            delete game.boards[socket.id];
            game.winner = null;

            if (game.players.length > 0) {
                const remainingPlayerId = game.players[0];

                const newBoard = createEmptyBoard();
                placeShips(newBoard);
                game.boards[remainingPlayerId] = newBoard;

                game.turn = remainingPlayerId;
            } else {
                game.turn = null;
            }
            sendState();
        }
    });
});

server.listen(3000, () => console.log('Server is online on port 3000'));