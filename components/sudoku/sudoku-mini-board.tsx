"use client"

import { cn } from "@/lib/utils"

interface SudokuMiniBoardProps {
  board: number[][]
}

export function SudokuMiniBoard({ board }: SudokuMiniBoardProps) {
  return (
    <div className="grid grid-cols-9 gap-0 border-2 border-foreground/20 rounded-lg overflow-hidden">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={cn(
              "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-sm md:text-base font-medium transition-colors",
              "border-r border-b border-border/50",
              colIndex % 3 === 2 && colIndex !== 8 && "border-r-foreground/30",
              rowIndex % 3 === 2 && rowIndex !== 8 && "border-b-foreground/30",
              cell !== 0 ? "bg-muted/50 text-foreground" : "bg-card text-muted-foreground",
            )}
          >
            {cell !== 0 ? cell : ""}
          </div>
        )),
      )}
    </div>
  )
}
