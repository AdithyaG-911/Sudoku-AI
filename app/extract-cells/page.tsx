'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Upload, Play } from 'lucide-react';

interface CellData {
    label: number;
    imageData: string;
    sourceImage: string;
    row: number;
    col: number;
}

export default function ExtractCellsPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [datFiles, setDatFiles] = useState<Map<string, string>>(new Map());
    const [extractedCells, setExtractedCells] = useState<CellData[]>([]);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<{ [key: number]: number }>({});

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files).filter(f => f.name.endsWith('.jpg')));
        }
    };

    const handleDatUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const datMap = new Map<string, string>();
            const fileArray = Array.from(e.target.files);

            Promise.all(
                fileArray.map(file =>
                    file.text().then(content => {
                        const baseName = file.name.replace('.dat', '');
                        datMap.set(baseName, content);
                    })
                )
            ).then(() => {
                setDatFiles(datMap);
            });
        }
    };

    const parseDatFile = (content: string): number[][] => {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const grid: number[][] = [];

        for (let i = 2; i < 11; i++) {
            if (i >= lines.length) break;
            const row = lines[i].split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
            if (row.length === 9) {
                grid.push(row);
            }
        }

        return grid;
    };

    const extractCellsFromImage = async (
        imageFile: File,
        grid: number[][]
    ): Promise<CellData[]> => {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);

                // Find grid bounds (simple approach - assumes grid is centered)
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;

                let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
                const threshold = 200;

                for (let y = 0; y < img.height; y++) {
                    for (let x = 0; x < img.width; x++) {
                        const idx = (y * img.width + x) * 4;
                        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                        if (gray < threshold) {
                            minX = Math.min(minX, x);
                            maxX = Math.max(maxX, x);
                            minY = Math.min(minY, y);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                const padding = 10;
                const gridX = Math.max(0, minX - padding);
                const gridY = Math.max(0, minY - padding);
                const gridWidth = maxX - minX + 2 * padding;
                const gridHeight = maxY - minY + 2 * padding;

                const cellWidth = gridWidth / 9;
                const cellHeight = gridHeight / 9;

                const cells: CellData[] = [];

                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        const x = gridX + col * cellWidth;
                        const y = gridY + row * cellHeight;

                        // Extract cell
                        const cellCanvas = document.createElement('canvas');
                        cellCanvas.width = 28;
                        cellCanvas.height = 28;
                        const cellCtx = cellCanvas.getContext('2d')!;

                        // Draw and resize to 28x28
                        cellCtx.drawImage(
                            canvas,
                            x, y, cellWidth, cellHeight,
                            0, 0, 28, 28
                        );

                        // Convert to grayscale
                        const cellImageData = cellCtx.getImageData(0, 0, 28, 28);
                        const cellData = cellImageData.data;
                        for (let i = 0; i < cellData.length; i += 4) {
                            const gray = 0.299 * cellData[i] + 0.587 * cellData[i + 1] + 0.114 * cellData[i + 2];
                            cellData[i] = cellData[i + 1] = cellData[i + 2] = gray;
                        }
                        cellCtx.putImageData(cellImageData, 0, 0);

                        cells.push({
                            label: grid[row][col],
                            imageData: cellCanvas.toDataURL('image/png'),
                            sourceImage: imageFile.name,
                            row,
                            col
                        });
                    }
                }

                resolve(cells);
            };

            reader.readAsDataURL(imageFile);
        });
    };

    const processAllImages = async () => {
        setIsProcessing(true);
        setProgress(0);
        const allCells: CellData[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const baseName = file.name.replace('.jpg', '');
            const datContent = datFiles.get(baseName);

            if (!datContent) {
                console.warn(`No .dat file for ${file.name}`);
                continue;
            }

            try {
                const grid = parseDatFile(datContent);
                const cells = await extractCellsFromImage(file, grid);
                allCells.push(...cells);
                setProgress(((i + 1) / files.length) * 100);
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
            }
        }

        // Calculate stats
        const distribution: { [key: number]: number } = {};
        for (let i = 0; i <= 9; i++) distribution[i] = 0;
        allCells.forEach(cell => distribution[cell.label]++);

        setExtractedCells(allCells);
        setStats(distribution);
        setIsProcessing(false);
    };

    const downloadDataset = () => {
        const json = JSON.stringify(extractedCells, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'training-cells.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Extract Training Cells from Real Images</h1>

            <div className="space-y-6">
                {/* Upload Images */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">1. Upload Sudoku Images (.jpg)</h2>
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept=".jpg"
                            multiple
                            onChange={handleImageUpload}
                            className="flex-1"
                            id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <Button variant="outline" asChild>
                                <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Select Images
                                </span>
                            </Button>
                        </label>
                    </div>
                    {files.length > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            {files.length} images selected
                        </p>
                    )}
                </Card>

                {/* Upload .dat files */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">2. Upload Ground Truth (.dat)</h2>
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept=".dat"
                            multiple
                            onChange={handleDatUpload}
                            className="flex-1"
                            id="dat-upload"
                        />
                        <label htmlFor="dat-upload" className="cursor-pointer">
                            <Button variant="outline" asChild>
                                <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Select .dat Files
                                </span>
                            </Button>
                        </label>
                    </div>
                    {datFiles.size > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            {datFiles.size} .dat files loaded
                        </p>
                    )}
                </Card>

                {/* Process */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">3. Extract Cells</h2>
                    <Button
                        onClick={processAllImages}
                        disabled={files.length === 0 || datFiles.size === 0 || isProcessing}
                        className="w-full"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        {isProcessing ? `Processing... ${progress.toFixed(0)}%` : 'Start Extraction'}
                    </Button>
                </Card>

                {/* Results */}
                {extractedCells.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Results</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-lg">
                                    <strong>Total Cells:</strong> {extractedCells.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    From {files.length} images × 81 cells each
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Label Distribution:</h3>
                                <div className="grid grid-cols-5 gap-2 text-sm">
                                    {Object.entries(stats).map(([label, count]) => (
                                        <div key={label} className="flex justify-between">
                                            <span>{label === '0' ? 'Empty' : label}:</span>
                                            <span className="font-mono">
                                                {count} ({((count / extractedCells.length) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={downloadDataset} className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download training-cells.json
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
