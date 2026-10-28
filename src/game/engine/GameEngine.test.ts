import { describe, expect, it } from "vitest";
import GameEngine from "./GameEngine";
import { generatePiece } from "@/game/models/Piece";
import type { Board, GameState } from "@/game/types/game";

// 直接准备引擎状态,便于测试特定棋盘和方块情形.
function setState(engine: GameEngine, patch: Partial<GameState>): void {
    Object.assign(engine.getGameState() as GameState, patch);
}

// 创建空的 10x20 棋盘,避免每个用例重复构造.
function makeBoard(): Board {
    return Array.from({ length: 20 }, () => Array<0 | 1>(10).fill(0));
}

// 在指定的 (x, y) 格子放置已有方块.
function occupy(board: Board, positions: Array<[number, number]>): Board {
    for (const [x, y] of positions) board[y][x] = 1;
    return board;
}

describe("GameEngine", () => {
    it("creates a 10x20 board in ready state", () => {
        // 新建引擎后应有空棋盘,且尚未开始游戏.
        const engine = new GameEngine();
        const state = engine.getGameState();

        expect(state.board).toHaveLength(20);
        expect(state.board.every(row => row.length === 10 && row.every(cell => cell === 0))).toBe(true);
        expect(state.status).toBe("ready");
    });

    it("starts with the next piece and repeated starts do not replace it", () => {
        // 固定预览方块,检查首次开始会将其设为当前方块.
        const engine = new GameEngine();
        const nextPiece = generatePiece("T");
        setState(engine, { nextPiece });

        engine.start();
        const firstCurrentPiece = engine.getGameState().currentPiece;
        const firstNextPiece = engine.getGameState().nextPiece;
        // 第二次 start 不应再次生成当前方块或替换预览方块.
        engine.start();

        expect(engine.getGameState().status).toBe("playing");
        expect(firstCurrentPiece).toEqual({ ...nextPiece, position: { x: 3, y: 0 } });
        expect(engine.getGameState().currentPiece).toBe(firstCurrentPiece);
        expect(engine.getGameState().nextPiece).toBe(firstNextPiece);
    });

    it("does not drop the piece while paused", () => {
        // 暂停后推进一段时间,当前方块的位置应保持不变.
        const engine = new GameEngine();
        engine.start();
        engine.pause();
        const before = engine.getGameState().currentPiece;

        engine.update(100);

        expect(engine.getGameState().status).toBe("paused");
        expect(engine.getGameState().currentPiece).toEqual(before);
    });

    it("keeps the piece unchanged when rotation would collide", () => {
        // I 方块横放时不占用 (4, 0),旋转为竖放后会与此处障碍碰撞.
        const engine = new GameEngine();
        const board = occupy(makeBoard(), [[5, 0]]);
        setState(engine, { board, nextPiece: generatePiece("I") });
        engine.start();
        const before = engine.getGameState().currentPiece;

        engine.rotatePiece();

        expect(engine.getGameState().currentPiece).toEqual(before);
    });

    it("clears a line, scores it, and advances the level", () => {
        // 底行只留出 I 方块的四格,并将行数设为 59 以触发升级.
        const engine = new GameEngine();
        const board = makeBoard();
        for (let x = 0; x < 10; x++) if (x < 3 || x > 6) board[19][x] = 1;
        setState(engine, {
            board,
            status: "playing",
            currentPiece: generatePiece("I", 0, { x: 3, y: 18 }),
            nextPiece: generatePiece("O"),
            lines: 59,
        });

        engine.lockPiece();
        const state = engine.getGameState();

        expect(state.lines).toBe(60);
        expect(state.score).toBe(10);
        expect(state.level).toBe(2);
        expect(state.board[0]).toEqual(Array(10).fill(0));
        expect(state.board[19]).toEqual(Array(10).fill(0));
    });

    it("ends the game when the next piece spawn position is occupied", () => {
        // O 方块出生位置包含 (4, 0),预先占据该格后开始游戏应失败.
        const engine = new GameEngine();
        setState(engine, { board: occupy(makeBoard(), [[4, 0]]), nextPiece: generatePiece("O") });

        engine.start();

        expect(engine.getGameState().status).toBe("gameover");
        expect(engine.getGameState().currentPiece).toBeNull();
    });

    it("hard drops and commits the locked board exactly once", () => {
        // 订阅状态变化,只记录棋盘首次出现已锁定方块时的结果.
        const engine = new GameEngine();
        setState(engine, { nextPiece: generatePiece("O") });
        engine.start();
        const lockResults: Board[] = [];
        engine.subscribe(state => {
            const occupied = state.board.flat().filter(cell => cell === 1).length;
            if (occupied > 0) lockResults.push(state.board);
        });

        engine.hardDrop();

        expect(lockResults).toHaveLength(1);
        expect(lockResults[0].flat().filter(cell => cell === 1)).toHaveLength(4);
        expect(engine.getGameState().currentPiece?.position.y).toBe(0);
    });

    it("reset clears the board, counters, and accumulated drop time", () => {
        // 预置非空棋盘、非初始计数和未消费的下落时间,再执行重置.
        const engine = new GameEngine();
        setState(engine, {
            board: occupy(makeBoard(), [[0, 19]]),
            score: 250,
            level: 4,
            lines: 12,
            status: "playing",
            currentPiece: generatePiece("O", 0, { x: 4, y: 0 }),
        });
        // 通过类型断言设置私有计时器,以验证 reset 确实清零了它.
        (engine as unknown as { dropAccumulator: number }).dropAccumulator = 1100;

        engine.reset();
        engine.start();
        engine.update(100);
        const state = engine.getGameState();

        // 清零后的 100ms 不足以让方块下落,说明旧累计时间没有残留.
        expect(state.board.every(row => row.every(cell => cell === 0))).toBe(true);
        expect(state.score).toBe(0);
        expect(state.level).toBe(1);
        expect(state.lines).toBe(0);
        expect(state.currentPiece?.position.y).toBe(0);
    });
});
