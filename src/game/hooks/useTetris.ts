import { useCallback, useEffect, useRef, useState } from "react";
import GameEngine from "@/game/engine/GameEngine";
import GameRenderer from "@/game/rendering/GameRenderer";
import type { GameState, MoveDirection,UseTetrisResult } from "@/game/types/game";


/**
 * 管理俄罗斯方块引擎和 Canvas 渲染循环
 * 只更新引擎并重绘 Canvas; React状态只在引擎发出状态变更时更新
 */
export default function useTetris(): UseTetrisResult {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [state, setState] = useState<Readonly<GameState> | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const engine = new GameEngine();
        const renderer = new GameRenderer(canvas);
        engineRef.current = engine;
        setState(engine.getGameState());

        // 引擎只在游戏逻辑变化时通知 React, 不会由动画帧直接触发组件渲染
        // 游戏画面由 Canvas 更新, 不需要把棋盘绘制过程交给 React
        const unsubscribe = engine.subscribe(nextState => {
            setState(nextState);
            renderer.render(nextState);
        });
        let animationFrameId = 0;
        let previousFrameTime: number | null = null;

        const frame = (time: number) => {
            const deltaTime = previousFrameTime === null ? 0 : time - previousFrameTime;
            previousFrameTime = time;

            engine.update(deltaTime);
            animationFrameId = window.requestAnimationFrame(frame);
        };

        renderer.render(engine.getGameState());
        animationFrameId = window.requestAnimationFrame(frame);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            unsubscribe();
            engineRef.current = null;
        };
    }, []);

    // 这些操作只转发给引擎, 供按钮和后续键盘事件调用。
    const start = useCallback(() => engineRef.current?.start(), []);
    const pause = useCallback(() => engineRef.current?.pause(), []);
    const resume = useCallback(() => engineRef.current?.resume(), []);
    const reset = useCallback(() => engineRef.current?.reset(), []);
    const movePiece = useCallback((direction: MoveDirection) => engineRef.current?.movePiece(direction), []);
    const rotatePiece = useCallback(() => engineRef.current?.rotatePiece(), []);
    const hardDrop = useCallback(() => engineRef.current?.hardDrop(), []);

    return { canvasRef, state, start, pause, resume, reset, movePiece, rotatePiece, hardDrop };
}
