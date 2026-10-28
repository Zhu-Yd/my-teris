import type { GameState, Piece, MoveDirection, rotateDegree, GameStateListener, GameStatus } from '@/game/types/game';
import { createEmptyBoard, isPositionValid, mergePieceToBoard, clearFullLines } from '@/game/models/Board';
import { getTetrominoShape, getShapeFromPiece, generatePiece, getSpawnPosition } from '@/game/models/Piece';

export default class GameEngine {
    private gameState: GameState;
    private listeners: Set<GameStateListener>;

    private dropAccumulator = 0; // 自动下落累计时间，单位：ms

    constructor() {
        this.gameState = {
            board: createEmptyBoard(),
            score: 0,
            level: 1,
            lines: 0,
            currentPiece: null,
            nextPiece: generatePiece(),
            status: "ready"
        };
        this.listeners = new Set<GameStateListener>();
    }

    /**
     * 获取游戏状态
     * @returns GameState
     */
    getGameState(): Readonly<GameState> {
        return this.gameState;
    }

    /**
     * 更改游戏状态
     * @param newState :Partial<GameState>
     */
    private updateGameState(newState: Partial<GameState>): void {
        this.gameState = { ...this.gameState, ...newState };
        this.notifyListeners();
    }

    /**
     * 初始化游戏状态
     */
    private initializeState(): void {
        this.dropAccumulator = 0; // 先更新内部状态,再更新外部状态,防止脏读
        this.updateGameState({ board: createEmptyBoard(), score: 0, level: 1, lines: 0, currentPiece: null, nextPiece: generatePiece(), status: "ready" })
    }

    /**
     * 订阅游戏状态变化
     * @param listener 状态变化时需要执行的回调
     * @returns 取消订阅的函数
     */
    subscribe(listener: GameStateListener): () => void {
        this.listeners.add(listener);

        // 返回取消订阅函数
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * 通知所有订阅者:游戏状态已更新
     */
    private notifyListeners(): void {
        // 遍历快照：监听器在回调中订阅或取消订阅时，不会直接改变本次遍历的集合
        for (const listener of [...this.listeners]) {
            listener(this.gameState);
        }
    }
    // 当前等级对应的自动下落间隔 单位:ms
    private getDropInterval(): number {
        return 1200 / Math.pow(1.2, this.gameState.level - 1);
    }

    /**
     * 根据经过的时间推进游戏
     * @param deltaTime 距离上次更新经过的毫秒数
     */
    update(deltaTime: number): void {
        if (this.gameState.status !== "playing" || !this.gameState.currentPiece || !Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }
        if (deltaTime >= 100) { deltaTime = 100; } // 限制最大deltaTime，避免在游戏暂停或切换标签页后出现大跳跃
        this.dropAccumulator += deltaTime;

        const dropInterval = this.getDropInterval();

        while (this.dropAccumulator >= dropInterval) {

            // 非playing状态直接退出循环
            if (this.gameState.status !== "playing") {
                this.dropAccumulator = 0;
                break;
            }

            this.dropAccumulator -= dropInterval;

            const tetrominoShape = getShapeFromPiece(this.gameState.currentPiece)
            const { x, y } = this.gameState.currentPiece.position;

            if (!isPositionValid(this.gameState.board, { x, y: y + 1 }, tetrominoShape)) {
                this.lockPiece(); // 如果方块触底,执行锁定逻辑
                break; // 退出循环,等待下一次 update 调用  
            } else {
                this.movePiece("down");  // 如果方块未触底,继续下落
            }
        }
    }



    /**
     * 游戏准备
     */
    reset() {
        this.initializeState();
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.gameState.status !== "ready") {
            return
        }

        const nextPiece: Piece | null = this.gameState.nextPiece;
        if (nextPiece === null) {
            // 没有预览方块，不能继续生成
            return;
        }

        const spawnPosition = getSpawnPosition(
            getTetrominoShape(nextPiece.type)
        );

        const currentPiece = {
            ...nextPiece,
            position: spawnPosition
        };

        if (!isPositionValid(this.gameState.board, spawnPosition, getShapeFromPiece(currentPiece))) {
            // 出生位置冲突，游戏结束
            return this.gameOver();
        }


        this.updateGameState({ status: "playing", currentPiece, nextPiece: generatePiece() });

    }

    /**
     * 暂停游戏
     */
    pause() {
        if (this.gameState.status === "playing") {
            this.updateGameState({ status: "paused" });
        }
    }

    /**
     * 恢复游戏
     */
    resume() {
        if (this.gameState.status === "paused") {
            this.updateGameState({ status: "playing" });
        }
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.updateGameState({ status: "gameover" });
    }

    /**
     * 移动方块
     * @param direction: MoveDirection 
     */
    movePiece(direction: MoveDirection): void {
        if (this.gameState.status !== "playing" || !this.gameState.currentPiece) {
            return;
        }
        const { currentPiece } = this.gameState;
        const tetrominoShape = getShapeFromPiece(currentPiece);

        const newPosition = { ...currentPiece.position };
        switch (direction) {
            case "left":
                newPosition.x -= 1;
                break;
            case "right":
                newPosition.x += 1;
                break;
            case "down":
                newPosition.y += 1;
                break;
        }
        //check for collisions and update the piece's position accordingly.
        if (isPositionValid(this.gameState.board, newPosition, tetrominoShape)) {
            this.updateGameState({ currentPiece: { ...currentPiece, position: newPosition } });
        }
    }

    /**
     * 旋转方块
     */
    rotatePiece(): void {
        if (this.gameState.status !== "playing" || !this.gameState.currentPiece) {
            return;
        }
        const { currentPiece } = this.gameState;
        const newRotation = (currentPiece.rotation + 90) % 360 as rotateDegree;
        const rotatePiece = { ...currentPiece, rotation: newRotation } //旋转后的方块
        const tetrominoShape = getShapeFromPiece(rotatePiece); //获取旋转后方块的Shape

        //check for collisions and update the piece's position accordingly.
        if (isPositionValid(this.gameState.board, currentPiece.position, tetrominoShape)) {
            this.updateGameState({ currentPiece: rotatePiece });
        }
    }

    /**
     * 快速下落方块
     */
    hardDrop(): void {
        if (this.gameState.status !== "playing" || !this.gameState.currentPiece) {
            return;
        }
        const { currentPiece } = this.gameState;
        const tetrominoShape = getShapeFromPiece(currentPiece);
        const newPosition = { ...currentPiece.position };

        while (isPositionValid(this.gameState.board, { ...newPosition, y: newPosition.y + 1 }, tetrominoShape)) {
            newPosition.y += 1;
        }

        this.updateGameState({ currentPiece: { ...currentPiece, position: newPosition } });
        this.lockPiece();
    }

    /**
     * Lock the current piece into the board and generate a new piece
     */
    lockPiece(): void {
        if (this.gameState.status !== "playing" || !this.gameState.currentPiece) {
            return;
        }
        const { currentPiece, nextPiece } = this.gameState;
        if (nextPiece === null) {
            throw new Error('游戏状态异常:nextPiece is null');
        }

        const tetrominoShape = getShapeFromPiece(currentPiece);

        const lockedBoard = mergePieceToBoard(this.gameState.board, currentPiece.position, tetrominoShape); // Merge the current piece into the board
        const { newBoard, linesCleared } = clearFullLines(lockedBoard); // Clear full lines and get the new board and number of lines cleared
        const newScore = this.calculateScore(linesCleared); // Calculate the new score based on lines cleared

        // level up logic: increase level every 60 lines cleared
        const newLines = this.gameState.lines + linesCleared;
        const newLevel = Math.floor(newLines / 60) + 1;

        // Check if the new current piece is in a valid position; if not, the game is over
        let gameStatus: GameStatus = this.gameState.status;
        let isGameOver = false;

        const newTetrominoShape = getShapeFromPiece(nextPiece);
        const spawnPosition = getSpawnPosition(newTetrominoShape);
        if (!isPositionValid(newBoard, spawnPosition, newTetrominoShape)) {
            // 如果新方块无法放置,游戏结束
            gameStatus = "gameover";
            isGameOver = true
        }
        // Update the game state with the new board, updated lines cleared,update the score based on lines cleared,update level
        // Update the current piece and generate a new piece 
        this.updateGameState({ board: newBoard, lines: newLines, currentPiece: isGameOver ? null : { ...nextPiece, position: spawnPosition }, nextPiece: generatePiece(), score: newScore, level: newLevel, status: gameStatus });


    }

    /**
     * Calculate the player's score based on the number of lines cleared
     * @param linesCleared The number of lines cleared in the current move
     */
    private calculateScore(linesCleared: number): number {
        const baseScoreIncrement = linesCleared * 10;
        let newScore = this.gameState.score;
        switch (linesCleared) {
            case 1:
                newScore += 1 * baseScoreIncrement;
                break;
            case 2:
                newScore += 2 * baseScoreIncrement;
                break;
            case 3:
                newScore += 4 * baseScoreIncrement;
                break;
            case 4:
                newScore += 8 * baseScoreIncrement;
                break;
        }
        return newScore;
    }
}
