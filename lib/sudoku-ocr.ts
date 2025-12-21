import { Difficulty, generatePuzzle } from './sudoku';

export interface OCRResult {
  board: number[][]; // Post-processed board
  rawBoard?: number[][]; // NEW: Raw predictions before post-processing
  confidence: number;
  processingTime: number;
  cellConfidences: number[][];
  stats?: {
    duplicatesFixed: number;
    autoFilled: number;
    lowConfidence: number;
  };
  gridCorners?: { topLeft: [number, number], topRight: [number, number], bottomRight: [number, number], bottomLeft: [number, number] };
  debugWarpedImage?: string;
}


// Helper to keep UI responsive
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));


export async function extractSudokuFromImage(
  imageFile: File,
): Promise<OCRResult> {
  const startTime = performance.now();

  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await fetch("/api/extract-sudoku", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Data:", errorData);
      throw new Error(errorData.error || `OCR Failed with status ${response.status}`);
    }

    const data = await response.json();
    const processingTime = performance.now() - startTime;

    // Calculate average confidence
    let totalConfidence = 0;
    if (data.confidences) {
      data.confidences.flat().forEach((c: number) => totalConfidence += c);
    }
    const confidence = totalConfidence / 81;

    return {
      board: data.board,
      rawBoard: data.board, // Python script currently does post-processing implicitly via model/solver or clean output
      confidence: confidence,
      processingTime,
      cellConfidences: data.confidences || [],
      stats: {
        duplicatesFixed: 0,
        autoFilled: 0,
        lowConfidence: 0
      },
      // Map new fields
      gridCorners: data.corners ? {
        topLeft: data.corners[0],
        topRight: data.corners[1],
        bottomRight: data.corners[2],
        bottomLeft: data.corners[3]
      } : undefined,
      debugWarpedImage: data.warped_image
    };

  } catch (error) {
    console.error("Sudoku Extraction Error:", error);
    throw error;
  }
}

export function generateDemoOCRBoard(): number[][] {
  // Randomly select a difficulty level
  const difficulties: Difficulty[] = [
    "beginner",
    "easy",
    "medium",
    "hard",
    "expert",
  ];
  const randomDifficulty =
    difficulties[Math.floor(Math.random() * difficulties.length)];

  // Generate a random puzzle
  const { puzzle } = generatePuzzle(randomDifficulty, "classic");

  return puzzle;
}
