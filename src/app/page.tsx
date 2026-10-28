"use client";

import { useEffect, useRef, useState } from "react";
import { isPositionValid } from "@/game/models/Board";
import { getShapeFromPiece } from "@/game/models/Piece";
import GameRenderer from "@/game/rendering/GameRenderer";
import type { GameState, MoveDirection } from "@/game/types/game";

function createPreviewState(): GameState {
    const board = Array.from({ length: 20 }, () => Array<0 | 1>(10).fill(0));
    // 用底部几格已锁定方块展示 board 的绘制效果。
    for (const x of [0, 1, 2, 6, 7, 8, 9]) board[19][x] = 1;
    for (const x of [0, 1, 8, 9]) board[18][x] = 1;

    return {
        board,
        currentPiece: { type: "T", rotation: 90, position: { x: 3, y: 5 } },
        nextPiece: null,
        score: 0,
        level: 1,
        lines: 0,
        status: "playing",
    };
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<GameRenderer | null>(null);
    const [state, setState] = useState(createPreviewState);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        rendererRef.current = new GameRenderer(canvas);
        return () => {
            rendererRef.current = null;
        };
    }, []);

    useEffect(() => {
        rendererRef.current?.render(state);
    }, [state]);

    function movePiece(direction: MoveDirection) {
        setState(previous => {
            if (!previous.currentPiece) return previous;
            const { x, y } = previous.currentPiece.position;
            const offset = direction === "left" ? { x: -1, y: 0 }
                : direction === "right" ? { x: 1, y: 0 }
                    : { x: 0, y: 1 };
            const movedPiece = {
                ...previous.currentPiece,
                position: { x: x + offset.x, y: y + offset.y },
            };
            if (!isPositionValid(previous.board, movedPiece.position, getShapeFromPiece(movedPiece))) return previous;
            return { ...previous, currentPiece: movedPiece };
        });
    }

    function rotatePiece() {
        setState(previous => {
            if (!previous.currentPiece) return previous;
            const rotatedPiece = {
                ...previous.currentPiece,
                rotation: ((previous.currentPiece.rotation + 90) % 360) as 0 | 90 | 180 | 270,
            };
            if (!isPositionValid(previous.board, rotatedPiece.position, getShapeFromPiece(rotatedPiece))) return previous;
            return { ...previous, currentPiece: rotatedPiece };
        });
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 py-8 font-sans text-slate-100">
            <header className="text-center">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">Canvas 2D Preview</p>
                <h1 className="mt-2 text-3xl font-semibold">俄罗斯方块渲染预览</h1>
                <p className="mt-2 text-sm text-slate-400">棋盘格为 30px. 点击按钮观察移动和旋转后的重绘.</p>
            </header>

            <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-950/30">
                <canvas ref={canvasRef} aria-label="俄罗斯方块棋盘" className="block" />
            </div>

            <section className="flex flex-wrap items-center justify-center gap-2" aria-label="方块控制">
                <button className="rounded-md bg-slate-800 px-4 py-2 hover:bg-slate-700" onClick={() => movePiece("left")}>左移</button>
                <button className="rounded-md bg-slate-800 px-4 py-2 hover:bg-slate-700" onClick={() => movePiece("right")}>右移</button>
                <button className="rounded-md bg-slate-800 px-4 py-2 hover:bg-slate-700" onClick={() => movePiece("down")}>下移</button>
                <button className="rounded-md bg-cyan-700 px-4 py-2 hover:bg-cyan-600" onClick={rotatePiece}>旋转</button>
                <button className="rounded-md border border-slate-600 px-4 py-2 hover:bg-slate-800" onClick={() => setState(createPreviewState())}>重置预览</button>
            </section>
            <p className="text-xs text-slate-500">蓝色为活动方块,灰蓝色为已锁定方块.</p>
        </main>
    );
}
