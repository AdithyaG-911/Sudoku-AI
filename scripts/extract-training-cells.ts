/**
 * Extract individual cells from real Sudoku images for training
 * 
 * Reads images from data/training_real/v2_train/
 * Reads ground truth from corresponding .dat files
 * Extracts 81 cells per image and saves with labels
 */

import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, loadImage, Image } from 'canvas';

const INPUT_DIR = path.join(process.cwd(), 'data', 'training_real', 'v2_train');
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'training-cells.json');

interface CellData {
    label: number; // 0-9
    imageData: string; // base64 encoded 28x28 grayscale image
    sourceImage: string; // filename for debugging
    row: number;
    col: number;
}

/**
 * Parse .dat file to extract 9x9 grid
 */
function parseDatFile(datPath: string): number[][] {
    const content = fs.readFileSync(datPath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Lines 3-11 contain the 9x9 grid (skip metadata lines 1-2)
    const grid: number[][] = [];
    for (let i = 2; i < 11; i++) {
        if (i >= lines.length) break;
        const row = lines[i].split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
        if (row.length === 9) {
            grid.push(row);
        }
    }

    if (grid.length !== 9) {
        throw new Error(`Invalid grid in ${datPath}: expected 9 rows, got ${grid.length}`);
    }

    return grid;
}

/**
 * Extract grid from Sudoku image using OpenCV-style approach
 * This is a simplified version - assumes grid is roughly centered
 */
async function extractGrid(imagePath: string): Promise<{ x: number; y: number; width: number; height: number }> {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    // Convert to grayscale and threshold
    const gray = new Uint8Array(img.width * img.height);
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
        gray[i / 4] = grayValue;
    }

    // Find bounding box of dark pixels (grid lines)
    let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
    const threshold = 200; // Pixels darker than this are likely grid/digits

    for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
            const idx = y * img.width + x;
            if (gray[idx] < threshold) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    // Add padding
    const padding = 10;
    return {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(img.width - minX + padding, maxX - minX + 2 * padding),
        height: Math.min(img.height - minY + padding, maxY - minY + 2 * padding)
    };
}

/**
 * Extract 81 cells from image
 */
async function extractCells(imagePath: string, grid: number[][]): Promise<CellData[]> {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Find grid bounds
    const gridBounds = await extractGrid(imagePath);

    const cellWidth = gridBounds.width / 9;
    const cellHeight = gridBounds.height / 9;

    const cells: CellData[] = [];

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const x = gridBounds.x + col * cellWidth;
            const y = gridBounds.y + row * cellHeight;

            // Extract cell
            const cellCanvas = createCanvas(cellWidth, cellHeight);
            const cellCtx = cellCanvas.getContext('2d');
            cellCtx.drawImage(
                canvas,
                x, y, cellWidth, cellHeight,
                0, 0, cellWidth, cellHeight
            );

            // Resize to 28x28 (same as training)
            const resizedCanvas = createCanvas(28, 28);
            const resizedCtx = resizedCanvas.getContext('2d');
            resizedCtx.drawImage(cellCanvas, 0, 0, 28, 28);

            // Convert to grayscale
            const imageData = resizedCtx.getImageData(0, 0, 28, 28);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                data[i] = data[i + 1] = data[i + 2] = gray;
            }
            resizedCtx.putImageData(imageData, 0, 0);

            // Save as base64
            const base64 = resizedCanvas.toDataURL('image/png');

            cells.push({
                label: grid[row][col],
                imageData: base64,
                sourceImage: path.basename(imagePath),
                row,
                col
            });
        }
    }

    return cells;
}

/**
 * Main extraction function
 */
async function main() {
    console.log('🔍 Scanning for training images...');

    const files = fs.readdirSync(INPUT_DIR);
    const imageFiles = files.filter(f => f.endsWith('.jpg'));

    console.log(`📸 Found ${imageFiles.length} images`);

    const allCells: CellData[] = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const imageFile of imageFiles) {
        const imagePath = path.join(INPUT_DIR, imageFile);
        const datPath = imagePath.replace('.jpg', '.dat');

        if (!fs.existsSync(datPath)) {
            console.warn(`⚠️  No .dat file for ${imageFile}, skipping`);
            errorCount++;
            continue;
        }

        try {
            // Parse ground truth
            const grid = parseDatFile(datPath);

            // Extract cells
            const cells = await extractCells(imagePath, grid);
            allCells.push(...cells);

            processedCount++;
            if (processedCount % 10 === 0) {
                console.log(`✅ Processed ${processedCount}/${imageFiles.length} images (${allCells.length} cells)`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${imageFile}:`, error);
            errorCount++;
        }
    }

    console.log(`\n📊 Extraction complete:`);
    console.log(`   ✅ Processed: ${processedCount} images`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total cells: ${allCells.length}`);

    // Count distribution
    const distribution = new Array(10).fill(0);
    allCells.forEach(cell => distribution[cell.label]++);
    console.log(`\n📈 Label distribution:`);
    distribution.forEach((count, label) => {
        const percentage = ((count / allCells.length) * 100).toFixed(1);
        console.log(`   ${label}: ${count} (${percentage}%)`);
    });

    // Save to file
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allCells, null, 2));
    console.log(`\n💾 Saved to ${OUTPUT_FILE}`);
    console.log(`   File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
