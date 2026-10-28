import { BOARD_HEIGHT, BOARD_WIDTH } from "@/game/constants/game";
import type { Board, Shape, Position } from "@/game/types/game";

export function createEmptyBoard(): Board {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
}

export function isPositionInBounds(position: Position): boolean {
    return position.x >= 0 && position.x < BOARD_WIDTH && position.y >= 0 && position.y < BOARD_HEIGHT;
}

function isEmptyCell(board: Board, position: Position): boolean {
    return board[position.y][position.x] === 0;
}

export function isPositionValid(board: Board, position: Position, shape: Shape): boolean {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] === 1) {
                const toBoardX = position.x + x;
                const toBoardY = position.y + y;
                if (!isPositionInBounds({ x: toBoardX, y: toBoardY }) || !isEmptyCell(board, { x: toBoardX, y: toBoardY })) {
                    return false;
                }
            }
        }
    }
    return true;
}

export function mergePieceToBoard(board: Board, position: Position, shape: Shape): Board {
    // Ensure the position is valid before merging
    if (!isPositionValid(board, position, shape)) {
        return board;
    }

    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] === 1) {
                const toBoardX = position.x + x;
                const toBoardY = position.y + y;
                newBoard[toBoardY][toBoardX] = 1;
            }
        }
    }
    return newBoard;
}

export function clearFullLines(board: Board): { newBoard: Board, linesCleared: number } {
    const newBoard = board.filter(row => row.some(cell => cell === 0));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    return { newBoard, linesCleared };
}