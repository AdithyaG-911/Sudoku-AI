"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { XCircle, RotateCcw, Sparkles } from "lucide-react"
import type { Difficulty } from "@/lib/sudoku"

interface GameOverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mistakes: number
  maxMistakes: number
  difficulty: Difficulty
  onRetry: () => void
  onNewGame: () => void
}

export function GameOverDialog({
  open,
  onOpenChange,
  mistakes,
  maxMistakes,
  difficulty,
  onRetry,
  onNewGame,
}: GameOverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-destructive">
            <XCircle className="h-6 w-6" />
            Game Over
          </DialogTitle>
          <DialogDescription>
            You've made {mistakes} mistakes out of {maxMistakes} allowed for {difficulty} difficulty.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <p className="text-muted-foreground mb-2">
              Don't give up! Every puzzle is solvable with patience and practice.
            </p>
            <p className="text-sm text-muted-foreground">
              Tip: Use the Notes mode to track possible candidates for each cell.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            Retry Same Puzzle
          </Button>
          <Button className="flex-1 gap-2" onClick={onNewGame}>
            <Sparkles className="h-4 w-4" />
            New Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
