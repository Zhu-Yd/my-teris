import { getShapeFromPiece } from "@/game/models/Piece";
import type { Board, GameState, Piece, Shape } from "@/game/types/game";

const CELL_SIZE = 30;
const GRID_COLOR = "#b8c0cc";
const LOCKED_CELL_COLOR = "#526579";
const ACTIVE_CELL_COLOR = "#38a3d1";

/** 将游戏状态绘制到一个 Canvas 2D 画布上。 */
export default class GameRenderer {
    private readonly context: CanvasRenderingContext2D;

    constructor(private readonly canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Unable to get a 2D rendering context from the canvas.");
        }
        this.context = context;
    }

    /** 每次完整重绘，避免活动方块移动后留下上一帧的图像。 */
    render(state: Readonly<GameState>): void {
        const rowCount = state.board.length;
        const columnCount = state.board[0]?.length ?? 0;
        const pixelWidth = columnCount * CELL_SIZE;
        const pixelHeight = rowCount * CELL_SIZE;

        // Canvas 尺寸始终来自 board 的行列数，游戏坐标保持为格子坐标
        if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
        if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;

        this.context.clearRect(0, 0, pixelWidth, pixelHeight);
        this.drawBoard(state.board, rowCount, columnCount);

        // board 先画出已锁定方块，活动方块后画，保证其始终显示在上层
        if (state.currentPiece) {
            this.drawPiece(state.currentPiece, getShapeFromPiece(state.currentPiece), ACTIVE_CELL_COLOR);
        }
    }

    private drawBoard(board: Board, rowCount: number, columnCount: number): void {

        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x] === 1) {
                    this.drawCell(x, y, LOCKED_CELL_COLOR);
                }
            }
        }

        const width = columnCount * CELL_SIZE;
        const height = board.length * CELL_SIZE;

        // 网格线按 board 实际行列数绘制，边界与每个格子的像素尺寸一致
        this.context.beginPath();
        this.context.strokeStyle = GRID_COLOR;
        this.context.lineWidth = 1;
        for (let x = 0; x <= columnCount; x++) {
            const pixelX =
                x === columnCount
                    ? width - 0.5
                    : x * CELL_SIZE + 0.5;
            this.context.moveTo(pixelX, 0);
            this.context.lineTo(pixelX, height);
        }
        for (let y = 0; y <= board.length; y++) {
            const pixelY =
                y === board.length
                    ? height - 0.5
                    : y * CELL_SIZE + 0.5;
            this.context.moveTo(0, pixelY);
            this.context.lineTo(width, pixelY);
        }
        this.context.stroke();
    }

    private drawPiece(piece: Piece, shape: Shape, color: string): void {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] === 1) {
                    // position 与形状偏移相加仍是棋盘格子坐标，drawCell 再转换为像素
                    this.drawCell(piece.position.x + x, piece.position.y + y, color);
                }
            }
        }
    }

    private drawCell(gridX: number, gridY: number, color: string): void {
        const pixelX = gridX * CELL_SIZE;
        const pixelY = gridY * CELL_SIZE;
        this.context.fillStyle = color;
        this.context.fillRect(pixelX + 1, pixelY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }
}
