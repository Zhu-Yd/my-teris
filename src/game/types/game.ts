import type { RefObject } from "react";

export type Cell = 0 | 1;
export type Position = { x: number, y: number };
export type Shape = Cell[][];
export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type rotateDegree = 0 | 90 | 180 | 270;
export interface Piece {
    rotation: rotateDegree;
    position: Position;
    type: TetrominoType;
}
export type Board = Cell[][];

export type GameStatus = "ready" | "playing" | "paused" | "gameover";

export type MoveDirection = "left" | "right" | "down";

export type GameStateListener = (state: GameState) => void;

export interface GameState {
    board: Board;
    currentPiece: Piece | null;
    nextPiece: Piece | null;
    score: number;
    level: number;
    lines: number;
    status: GameStatus;
}

export interface UseTetrisResult {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    state: Readonly<GameState> | null;
    start: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    movePiece: (direction: MoveDirection) => void;
    rotatePiece: () => void;
    hardDrop: () => void;
}