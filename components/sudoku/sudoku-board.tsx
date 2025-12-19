"use client"

import { cn } from "@/lib/utils"
import { type Board, type Notes, type GameMode, getConflicts } from "@/lib/sudoku"
import { useSound, playClickSound } from "@/hooks/use-sound"

interface SudokuBoardProps {
  board: Board
  initialBoard: Board
  solution: Board
  notes: Notes
  selectedCell: [number, number] | null
  hintCell: [number, number] | null
  onCellClick: (row: number, col: number) => void
  isGameOver?: boolean
  isPaused?: boolean
  gameMode?: GameMode
  highlightedNumber?: number | null
}

export function SudokuBoard({
  board,
  initialBoard,
  solution,
  notes,
  selectedCell,
  hintCell,
  onCellClick,
  isGameOver = false,
  isPaused = false,
  gameMode = "classic",
  highlightedNumber = null,
}: SudokuBoardProps) {
  const conflicts = getConflicts(board, gameMode)
  const selectedValue = selectedCell ? board[selectedCell[0]][selectedCell[1]] : null

  const isOnDiagonal = (row: number, col: number) => {
    if (gameMode !== "diagonal") return false
    return row === col || row + col === 8
  }

  return (
    <div className={cn("relative", (isGameOver || isPaused) && "pointer-events-none")}>
      {isPaused && !isGameOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 rounded-xl backdrop-blur-sm">
          <div className="text-center p-4">
            <p className="text-xl font-bold">Paused</p>
            <p className="text-sm text-muted-foreground">Click play to resume</p>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 rounded-xl">
          <div className="text-center p-4">
            <p className="text-xl font-bold text-destructive">Game Over</p>
            <p className="text-sm text-muted-foreground">Too many mistakes</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-9 border-2 border-foreground rounded-xl overflow-hidden shadow-2xl bg-card max-h-[70vh] aspect-square">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex
            const isInitial = initialBoard[rowIndex][colIndex] !== 0
            const isHint = hintCell?.[0] === rowIndex && hintCell?.[1] === colIndex
            const hasConflict = conflicts.has(`${rowIndex}-${colIndex}`)
            const isWrong = cell !== 0 && !isInitial && cell !== solution[rowIndex][colIndex]
            const isSameNumber = selectedValue && selectedValue !== 0 && cell === selectedValue
            const isGlobalHighlighted = highlightedNumber && highlightedNumber !== 0 && cell === highlightedNumber
            const isRelated =
              selectedCell &&
              (selectedCell[0] === rowIndex ||
                selectedCell[1] === colIndex ||
                (Math.floor(selectedCell[0] / 3) === Math.floor(rowIndex / 3) &&
                  Math.floor(selectedCell[1] / 3) === Math.floor(colIndex / 3)))
            const cellNotes = notes[rowIndex][colIndex]
            const isDiagonal = isOnDiagonal(rowIndex, colIndex)

            const isRightBoxBorder = colIndex === 2 || colIndex === 5
            const isBottomBoxBorder = rowIndex === 2 || rowIndex === 5

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isGameOver && !isPaused) { // Re-added game state checks and sound
                    playClickSound()
                    onCellClick(rowIndex, colIndex)
                  }
                }}
                inputMode="none"
                disabled={isGameOver || isPaused}
                className={cn(
                  "relative w-[min(10.8vw,7.2vh)] h-[min(10.8vw,7.2vh)] sm:w-[min(4.8vw,6.5vh)] sm:h-[min(4.8vw,6.5vh)] md:w-[min(5vw,7vh)] md:h-[min(5vw,7vh)] flex items-center justify-center transition-all duration-150",
                  "border-r border-b border-border/50",
                  isRightBoxBorder && "border-r-2 border-r-foreground/60",
                  isBottomBoxBorder && "border-b-2 border-b-foreground/60",
                  colIndex === 8 && "border-r-0",
                  rowIndex === 8 && "border-b-0",
                  // Diagonal highlighting
                  isDiagonal && !isSelected && "bg-primary/[0.05]",
                  // Standard highlighting - DARKER for better visibility
                  !isGameOver && !isPaused && isRelated && !isSelected && "bg-primary/[0.12]",
                  !isGameOver && !isPaused && isSameNumber && !isSelected && "bg-primary/[0.22]",
                  !isGameOver && !isPaused && isGlobalHighlighted && !isSelected && "bg-primary/[0.35] ring-1 ring-primary/40 ring-inset z-10",
                  !isGameOver && !isPaused && isSelected && "bg-primary/30 ring-2 ring-primary ring-inset z-20",
                  !isGameOver && !isPaused && isHint && "animate-hint-glow bg-primary/20",
                  hasConflict && "bg-destructive/10",
                  isWrong && "bg-destructive/15",
                  !isGameOver && !isPaused && "hover:bg-primary/10 active:scale-95",
                )}
              >
                {cell !== 0 ? (
                  <span
                    className={cn(
                      "text-lg sm:text-lg md:text-2xl font-semibold transition-colors",
                      isInitial ? "text-foreground" : "text-primary",
                      hasConflict && "text-destructive",
                      isWrong && "text-destructive",
                    )}
                  >
                    {cell}
                  </span>
                ) : cellNotes.size > 0 ? (
                  <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <span
                        key={n}
                        className={cn(
                          "text-[6px] sm:text-[8px] md:text-[10px] flex items-center justify-center text-muted-foreground/50",
                          cellNotes.has(n) && "text-primary font-medium",
                        )}
                      >
                        {cellNotes.has(n) ? n : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
