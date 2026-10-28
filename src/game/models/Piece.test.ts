
import { describe, expect, it } from "vitest";
import { getShapeFromPiece } from "./Piece";
import { Piece, rotateDegree } from "../types/game";

describe("rotateShape", () => {
    it("should rotate T tetromino 90 degrees clockwise", () => {
        // Arrange：准备测试数据
        const piece: Piece = { rotation: 90 as rotateDegree, position: { x: 0, y: 0 }, type: "T" }

        // Act：将被测试方块旋转90°
        const result = getShapeFromPiece(piece);

        // Assert：验证执行结果
        expect(result).toEqual([
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0],
        ]);
    });
    it("rotate T 4 times should return to original shape", () => {
        // Arrange：准备测试数据
        let piece: Piece = { rotation: 0 as rotateDegree, position: { x: 0, y: 0 }, type: "T" }
        const originShape = getShapeFromPiece(piece);
        let rotatedShape = null;

        // Act：将被测试方块旋转四次
        for (let i = 0; i < 4; i++) {
            piece = { ...piece, rotation: piece.rotation + 90 as rotateDegree }
            rotatedShape = getShapeFromPiece(piece);
        }

        // Assert：验证与原测试方块Shape是否相同
        expect(rotatedShape).toEqual(originShape);
    });
});
