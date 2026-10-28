import type { Shape, Cell, TetrominoType, Piece, rotateDegree } from "@/game/types/game";
import { BOARD_WIDTH } from "@/game/constants/game";

export function getTetrominoShape(type: TetrominoType): Shape {
    switch (type) {
        case 'I':
            return [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ];
        case 'O':
            return [
                [1, 1],
                [1, 1]
            ];
        case 'T':
            return [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ];
        case 'S':
            return [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ];
        case 'Z':
            return [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ];
        case 'J':
            return [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ];
        case 'L':
            return [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ];
        default:
            throw new Error(`Unknown tetromino type: ${type}`);
    }
}

function rotateShape90Degrees(shape: Shape): Shape {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: Shape = Array<Cell>(cols).fill(0).map(() => Array<Cell>(rows).fill(0)); // 旋转后的形状行数和列数互换
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            rotated[x][rows - 1 - y] = shape[y][x];
        }
    }
    return rotated;
}

function rotateShape(shape: Shape, rotation: 0 | 90 | 180 | 270): Shape {
    let rotatedShape: Shape = shape;
    const times = rotation / 90;
    for (let i = 0; i < times; i++) {
        rotatedShape = rotateShape90Degrees(rotatedShape);
    }
    return rotatedShape;
}

export function getShapeFromPiece(piece: Piece): Shape {
    const baseShape = getTetrominoShape(piece.type);
    return rotateShape(baseShape, piece.rotation);
}

/**
 * 生成一个新的方块
 * @param type :TetrominoType
 * @param rotation :rotateDegree
 * @param position :{ x: number; y: number }
 * @returns Piece
 */
export function generatePiece(type?: TetrominoType, rotation: rotateDegree = 0, position: { x: number; y: number } = { x: -1, y: 0 }): Piece {
    if (!type) {
        const tetrominoTypes: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        type = tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)];
    }
    return { type, rotation, position };
}

/**
 * 根据方块的形状获取其在棋盘上的初始位置
 * @param shape:Shape 
 * @returns position :{ x: number; y: number }
 */
export function getSpawnPosition(shape: Shape): { x: number; y: number } {
    const cols = shape[0].length;
    return { x: Math.floor((BOARD_WIDTH - cols) / 2), y: 0 };
}
