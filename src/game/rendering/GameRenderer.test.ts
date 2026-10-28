import { describe, expect, it, vi } from "vitest";
import GameRenderer from "./GameRenderer";
import type { GameState } from "@/game/types/game";

function makeRenderer() {
    const context = {
        beginPath: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        lineTo: vi.fn(),
        moveTo: vi.fn(),
        stroke: vi.fn(),
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
    } as unknown as CanvasRenderingContext2D;
    const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => context),
    } as unknown as HTMLCanvasElement;

    return { canvas, context, renderer: new GameRenderer(canvas) };
}

function makeState(board: GameState["board"], currentPiece: GameState["currentPiece"] = null): GameState {
    return {
        board,
        currentPiece,
        nextPiece: null,
        score: 0,
        level: 1,
        lines: 0,
        status: "playing",
    };
}

describe("GameRenderer", () => {
    it("sizes and draws the grid using the board's row and column counts", () => {
        const { canvas, context, renderer } = makeRenderer();
        const board = Array.from({ length: 3 }, () => Array<0 | 1>(4).fill(0));

        renderer.render(makeState(board));

        expect(canvas.width).toBe(120);
        expect(canvas.height).toBe(90);
        expect(context.clearRect).toHaveBeenCalledWith(0, 0, 120, 90);
        // Four columns produce five vertical grid lines; three rows produce four horizontal lines.
        expect(context.moveTo).toHaveBeenCalledTimes(9);
        expect(context.lineTo).toHaveBeenCalledTimes(9);
        expect(context.stroke).toHaveBeenCalledOnce();
    });

    it("draws locked cells at their board positions", () => {
        const { context, renderer } = makeRenderer();
        const board = [[0, 1, 0], [1, 0, 0]] as Array<Array<0 | 1>>;

        renderer.render(makeState(board));

        expect(context.fillRect).toHaveBeenNthCalledWith(1, 31, 1, 28, 28);
        expect(context.fillRect).toHaveBeenNthCalledWith(2, 1, 31, 28, 28);
        expect(context.fillRect).toHaveBeenCalledTimes(2);
    });

    it("draws the active piece using its rotated shape and grid position", () => {
        const { context, renderer } = makeRenderer();
        const board = Array.from({ length: 6 }, () => Array<0 | 1>(6).fill(0));

        renderer.render(makeState(board, {
            type: "T",
            rotation: 90,
            position: { x: 1, y: 2 },
        }));

        // The rotated T shape occupies (2,2), (2,3), (3,3), and (2,4).
        expect(context.fillRect).toHaveBeenCalledTimes(4);
        expect(context.fillRect).toHaveBeenNthCalledWith(1, 61, 61, 28, 28);
        expect(context.fillRect).toHaveBeenNthCalledWith(2, 61, 91, 28, 28);
        expect(context.fillRect).toHaveBeenNthCalledWith(3, 91, 91, 28, 28);
        expect(context.fillRect).toHaveBeenNthCalledWith(4, 61, 121, 28, 28);
    });

    it("clears the previous frame before drawing a moved piece", () => {
        const { context, renderer } = makeRenderer();
        const board = Array.from({ length: 4 }, () => Array<0 | 1>(4).fill(0));
        const first = makeState(board, { type: "O", rotation: 0, position: { x: 0, y: 0 } });
        const second = makeState(board, { type: "O", rotation: 0, position: { x: 1, y: 1 } });

        renderer.render(first);
        renderer.render(second);

        expect(context.clearRect).toHaveBeenNthCalledWith(1, 0, 0, 120, 120);
        expect(context.clearRect).toHaveBeenNthCalledWith(2, 0, 0, 120, 120);
        expect(context.fillRect).toHaveBeenCalledTimes(8);
        expect(context.fillRect).toHaveBeenNthCalledWith(5, 31, 31, 28, 28);
    });

    it("renders safely when there is no active piece", () => {
        const { context, renderer } = makeRenderer();
        const board = Array.from({ length: 2 }, () => Array<0 | 1>(2).fill(0));

        expect(() => renderer.render(makeState(board, null))).not.toThrow();
        expect(context.fillRect).not.toHaveBeenCalled();
    });
});
