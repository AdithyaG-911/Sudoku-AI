"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Undo2, Redo2, Lightbulb, Wand2, RotateCcw, PencilLine, Eraser, Lock } from "lucide-react"
import { playClickSound } from "@/hooks/use-sound"

interface SudokuControlsProps {
  isNotesMode: boolean
  onToggleNotes: () => void
  onNumberClick: (num: number) => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onSolve: () => void
  onReset: () => void
  canUndo: boolean
  canRedo: boolean
  disabled: boolean
  aiSolverUnlocked: boolean
  isGameOver: boolean
  board?: number[][] // NEW: for checking completed numbers
}

export function SudokuControls({
  isNotesMode,
  onToggleNotes,
  onNumberClick,
  onUndo,
  onRedo,
  onHint,
  onSolve,
  onReset,
  canUndo,
  canRedo,
  disabled,
  aiSolverUnlocked,
  isGameOver,
  board, // NEW
}: SudokuControlsProps) {
  // Check if a number is completed (appears 9 times)
  const isNumberCompleted = (num: number): boolean => {
    if (!board) return false;
    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === num) count++;
      }
    }
    return count === 9;
  };
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-2 sm:gap-4 w-full max-w-[288px] sm:max-w-[324px] md:max-w-[450px] pb-4 sm:pb-0">
        {/* Number pad */}
        <div className="grid grid-cols-9 gap-1 sm:gap-1.5 md:gap-2 px-1 sm:px-0">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const completed = isNumberCompleted(num);
            return (
              <Button
                key={num}
                variant="secondary"
                size="lg"
                disabled={disabled || completed}
                onClick={() => {
                  playClickSound()
                  onNumberClick(num)
                }}
                className={cn(
                  "h-10 sm:h-10 md:h-12 text-base sm:text-lg font-semibold p-0 transition-all shadow-sm",
                  isNotesMode && !completed && "bg-primary/10 hover:bg-primary/20",
                  completed && "opacity-30 line-through cursor-not-allowed",
                )}
              >
                {num}
              </Button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 sm:gap-2 justify-center flex-wrap px-1 sm:px-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isNotesMode ? "default" : "outline"}
                size="icon"
                disabled={disabled}
                onClick={onToggleNotes}
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <PencilLine className="h-4 w-4" />
                <span className="sr-only">Toggle Notes Mode</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Notes Mode (N)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={disabled}
                onClick={() => onNumberClick(0)}
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <Eraser className="h-4 w-4" />
                <span className="sr-only">Erase</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Erase Cell (Delete/0)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={disabled || !canUndo}
                onClick={onUndo}
                className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
              >
                <Undo2 className="h-4 w-4" />
                <span className="sr-only">Undo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={disabled || !canRedo}
                onClick={onRedo}
                className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
              >
                <Redo2 className="h-4 w-4" />
                <span className="sr-only">Redo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={disabled}
                onClick={onHint}
                className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
              >
                <Lightbulb className="h-4 w-4" />
                <span className="sr-only">Get Hint</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get Hint</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={aiSolverUnlocked || isGameOver ? "default" : "outline"}
                size="icon"
                disabled={!aiSolverUnlocked && !isGameOver}
                onClick={onSolve}
                className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10",
                  aiSolverUnlocked && "bg-primary text-primary-foreground",
                  !aiSolverUnlocked && !isGameOver && "opacity-50",
                )}
              >
                {aiSolverUnlocked || isGameOver ? <Wand2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                <span className="sr-only">AI Auto-Solve</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {aiSolverUnlocked || isGameOver ? (
                <p>AI Auto-Solve (Unlocked)</p>
              ) : (
                <p>AI Auto-Solve (Make more mistakes to unlock)</p>
              )}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onReset}
                className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reset Game</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset Puzzle</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
