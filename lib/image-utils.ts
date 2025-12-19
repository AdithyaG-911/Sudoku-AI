/**
 * Image Processing Utilities for Sudoku
 */

export interface Point {
    x: number;
    y: number;
}

/**
 * Solves for the separation vector in a system of linear equations
 * Uses Gaussian elimination
 */
function solveLinearSystem(matrix: number[][], vector: number[]): number[] | null {
    const n = vector.length;
    // Combine to augmented matrix
    const Aug = matrix.map((row, i) => [...row, vector[i]]);

    // Gaussian elimination
    for (let i = 0; i < n; i++) {
        // Find pivot
        let pivotRow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(Aug[j][i]) > Math.abs(Aug[pivotRow][i])) {
                pivotRow = j;
            }
        }

        // Swap
        [Aug[i], Aug[pivotRow]] = [Aug[pivotRow], Aug[i]];

        // Check singular
        if (Math.abs(Aug[i][i]) < 1e-10) return null;

        // Eliminate
        for (let j = i + 1; j < n; j++) {
            const factor = Aug[j][i] / Aug[i][i];
            for (let k = i; k <= n; k++) {
                Aug[j][k] -= factor * Aug[i][k];
            }
        }
    }

    // Back substitution
    const result = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = Aug[i][n];
        for (let j = i + 1; j < n; j++) {
            sum -= Aug[i][j] * result[j];
        }
        result[i] = sum / Aug[i][i];
    }
    return result;
}

/**
 * Calculates 3x3 Homography matrix to map srcPoints to dstPoints
 * srcPoints: [TL, TR, BR, BL]
 * dstPoints: [TL, TR, BR, BL]
 */
function getPerspectiveTransform(src: Point[], dst: Point[]): number[] | null {
    // We want to solve Ah = 0 (or normalized)
    // Detailed math: x' = (h1x + h2y + h3) / (h7x + h8y + h9)
    //                y' = (h4x + h5y + h6) / (h7x + h8y + h9)
    // Set h9 = 1

    const matrix: number[][] = [];
    const vector: number[] = [];

    for (let i = 0; i < 4; i++) {
        const { x: sx, y: sy } = src[i];
        const { x: dx, y: dy } = dst[i];

        matrix.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
        vector.push(dx);

        matrix.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
        vector.push(dy);
    }

    const h = solveLinearSystem(matrix, vector);
    if (!h) return null;

    return [...h, 1]; // Append h9 = 1
}

/**
 * Warps imageData using the 4 source corners to fill the destination size
 */
export function warpPerspective(
    imageData: ImageData,
    corners: { topLeft: [number, number], topRight: [number, number], bottomRight: [number, number], bottomLeft: [number, number] },
    targetSize: number
): ImageData {
    const { width, height, data } = imageData;
    const output = new ImageData(targetSize, targetSize);

    const srcPoints = [
        { x: corners.topLeft[0], y: corners.topLeft[1] },
        { x: corners.topRight[0], y: corners.topRight[1] },
        { x: corners.bottomRight[0], y: corners.bottomRight[1] },
        { x: corners.bottomLeft[0], y: corners.bottomLeft[1] }
    ];

    const dstPoints = [
        { x: 0, y: 0 },
        { x: targetSize, y: 0 },
        { x: targetSize, y: targetSize },
        { x: 0, y: targetSize }
    ];

    // Get homography: Src -> Dst
    // Actually we need Dst -> Src for inverse mapping (pixel filling)
    // So we compute H mapping Dst pixels to Src pixels
    const H = getPerspectiveTransform(dstPoints, srcPoints);

    if (!H) {
        console.warn("Homography failed, returning original crop");
        return new ImageData(targetSize, targetSize); // Return empty or handle error
    }

    // Inverse mapping loop
    for (let y = 0; y < targetSize; y++) {
        for (let x = 0; x < targetSize; x++) {
            // Apply H to (x, y)
            const denom = H[6] * x + H[7] * y + H[8];
            const srcX = (H[0] * x + H[1] * y + H[2]) / denom;
            const srcY = (H[3] * x + H[4] * y + H[5]) / denom;

            if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
                // Bilinear interpolation
                const x0 = Math.floor(srcX);
                const x1 = x0 + 1;
                const y0 = Math.floor(srcY);
                const y1 = y0 + 1;

                const wx = srcX - x0;
                const wy = srcY - y0;

                const i00 = (y0 * width + x0) * 4;
                const i10 = (y0 * width + x1) * 4;
                const i01 = (y1 * width + x0) * 4;
                const i11 = (y1 * width + x1) * 4;

                const destIdx = (y * targetSize + x) * 4;

                for (let c = 0; c < 4; c++) { // R, G, B, A
                    const val =
                        (1 - wx) * (1 - wy) * data[i00 + c] +
                        wx * (1 - wy) * data[i10 + c] +
                        (1 - wx) * wy * data[i01 + c] +
                        wx * wy * data[i11 + c];

                    output.data[destIdx + c] = val;
                }
            } else {
                // Out of bounds -> Black or White? 
                // Grid lines are black, so maybe black? Or white?
                // Let's use White (255) to avoid false edges
                const destIdx = (y * targetSize + x) * 4;
                output.data[destIdx] = 255;
                output.data[destIdx + 1] = 255;
                output.data[destIdx + 2] = 255;
                output.data[destIdx + 3] = 255;
            }
        }
    }

    return output;
}

export function imageDataToDataUrl(imageData: ImageData): string {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}
