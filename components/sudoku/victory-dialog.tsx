"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Difficulty } from "@/lib/sudoku"
import { Trophy, Clock, AlertTriangle, Sparkles } from "lucide-react"

interface VictoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  time: number
  mistakes: number
  difficulty: Difficulty
  onNewGame: () => void
}

export function VictoryDialog({ open, onOpenChange, time, mistakes, difficulty, onNewGame }: VictoryDialogProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="space-y-4">
          <div className="mx-auto animate-bounce">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
          </div>

          <DialogTitle className="text-3xl">
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              Congratulations!
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </span>
          </DialogTitle>

          <DialogDescription className="text-base">
            You successfully completed the {difficulty} puzzle!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          <div className="p-4 rounded-xl bg-muted/50">
            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{formatTime(time)}</div>
            <div className="text-xs text-muted-foreground">Time</div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50">
            <AlertTriangle className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{mistakes}</div>
            <div className="text-xs text-muted-foreground">Mistakes</div>
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={onNewGame}>
          Play Another Game
        </Button>

        {/* CSS Confetti effect */}
        {open && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: "-10px",
                  backgroundColor: ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"][i % 5],
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
