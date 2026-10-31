"use client";

import { useEffect, useCallback, useEffectEvent } from "react";
import { getShapeFromPiece } from "@/game/models/Piece";
import useTetris from "@/game/hooks/useTetris";
import type { Shape } from "@/game/types/game";

function NextPiecePreview({ shape }: { shape: Shape | null }) {
    if (!shape) {
        return <div className="flex h-24 items-center justify-center text-sm text-slate-500">- -</div>;
    }

    return (
        <div className="flex h-24 items-center justify-center" role="img" aria-label="下一个方块">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${shape[0].length}, 1rem)` }}>
                {shape.flatMap((row, y) => row.map((cell, x) => (
                    <span key={`${y}-${x}`} className={`h-4 w-4 rounded-sm ${cell ? "bg-red-700" : "bg-transparent"}`} />
                )))}
            </div>
        </div>
    );
}

export default function TetrisGame() {
    const { canvasRef, state, start, pause, resume, reset, movePiece, rotatePiece, hardDrop } = useTetris();
    const status = state?.status ?? "ready";
    const isRunning = status === "playing";
    const nextShape = state?.nextPiece ? getShapeFromPiece(state.nextPiece) : null;

    // 按引擎状态分派按钮操作, 避免把暂停和继续误当成同一个动作.
    const toggleGame = useCallback(() => {
        if (status === "ready") start();
        else if (status === "playing") pause();
        else if (status === "paused") resume();
    }, [status, start, pause, resume]);

    const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
        // 不拦截输入框中的按键, 也不影响页面上其他可编辑内容.
        const target = event.target;
        if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) {
            return;
        }

        const key = event.key.toLowerCase();
        // 保留按钮和链接的 Enter/空格语义, 让它们仍可通过键盘操作.
        if ((key === "enter" || key === " ") && target instanceof HTMLElement && target.closest("button, a")) {
            return;
        }
        const handledKeys = ["arrowleft", "arrowright", "arrowdown", "arrowup", " ", "enter", "escape"];
        if (!handledKeys.includes(key)) return;

        // 方向键和空格默认会滚动页面, 游戏操作时需要阻止浏览器默认行为.
        event.preventDefault();
        switch (key) {
            case "arrowleft":
                movePiece("left");
                break;
            case "arrowright":
                movePiece("right");
                break;
            case "arrowdown":
                movePiece("down");
                break;
            case "arrowup":
                rotatePiece();
                break;
            case " ":
                if (!event.repeat) hardDrop();
                break;
            case "enter":
                if (!event.repeat && (status === "ready" || status === "paused" || status === "playing")) toggleGame();
                break;
            case "escape":
                if (status === "gameover") reset();
                break;
        }

    });

    useEffect(() => {
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const statusLabel = status === "ready" ? "准备开始" : status === "playing" ? "进行中" : status === "paused" ? "已暂停" : "游戏结束";

    return (
        <main className="flex h-screen h-dvh items-center justify-center bg-slate-950 px-4 py-8 font-sans text-slate-100">
            <div className="w-full max-w-3xl h-full">
                <section className="flex h-full p-4 items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-cyan-950/20  sm:gap-6  sm:items-start" aria-label="俄罗斯方块游戏">
                    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                        <canvas ref={canvasRef} aria-label="俄罗斯方块棋盘" className="block max-w-full" />
                    </div>

                    <aside className="grid grid-cols-4 sm:grid-cols-6 min-w-max max-w-xs gap-3">
                        <div className="col-span-4 flex py-4 items-center justify-center">
                            <h1 className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">Tetris</h1>
                        </div>
                        <div className="col-span-4 sm:col-span-2 flex py-4 items-center justify-center">
                            <p className="text-center text-xs text-yellow-400" role="status">{statusLabel}</p>
                        </div>
                        <div className="col-span-4 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                            <p className="text-xs uppercase tracking-wider text-slate-500">分数</p>
                            <p className="mt-1 text-sm font-semibold tabular-nums">{state?.score ?? 0}</p>
                        </div>
                        <div className="col-span-4 sm:col-span-2 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                            <p className="text-xs uppercase tracking-wider text-slate-500">等级</p>
                            <p className="mt-1 text-sm font-semibold tabular-nums">{state?.level ?? 1}</p>
                        </div>
                        <div className="col-span-4 sm:col-span-6 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                            <p className="text-xs uppercase tracking-wider text-slate-500">下一个方块</p>
                            <NextPiecePreview shape={nextShape} />
                        </div>
                        <div className="hidden col-span-4 sm:col-span-6 leading-5 rounded-lg border border-slate-800 bg-slate-950/70 p-2 sm:block">
                            <p className="text-xs text-center w-full text-slate-500"> ← → ↓ 移动 · ↑ 旋转 </p>
                            <p className="text-xs text-center w-full text-slate-500"> 空格 快速降落 </p>
                            <p className="text-xs text-center w-full text-slate-500"> Enter 开始/继续 · Esc 重置 </p>
                        </div>

                        <div className="flex-col sm:flex-row col-span-4 sm:col-span-6  flex justify-center gap-3 ">
                            <button type="button" onClick={toggleGame} disabled={status === "gameover"} className="rounded-md bg-cyan-800 px-5 py-2.5 font-medium hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50">
                                {isRunning ? "暂停" : status === "paused" ? "继续" : "开始"}
                            </button>
                            <button type="button" onClick={reset} className="rounded-md border border-slate-700 px-5 py-2.5 font-medium hover:bg-slate-800">重置</button>
                        </div>

                    </aside>
                </section>


            </div>
        </main>
    );
}
