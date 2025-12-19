"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { GameStatistics, Difficulty } from "@/lib/sudoku"
import { Trophy, Target, Clock, Flame, BarChart2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  statistics: GameStatistics
}

export function StatsDialog({ open, onOpenChange, statistics }: StatsDialogProps) {
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const winRate = statistics.gamesPlayed > 0 ? ((statistics.gamesWon / statistics.gamesPlayed) * 100).toFixed(1) : "0"
  const difficulties: Difficulty[] = ["beginner", "easy", "medium", "hard", "expert"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Statistics
          </DialogTitle>
          <DialogDescription>Your Sudoku performance overview</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-2">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center hover:bg-muted/80 transition-colors">
              <Trophy className="h-6 w-6 mx-auto text-yellow-500 mb-1" />
              <div className="text-2xl font-bold">{statistics.gamesWon}</div>
              <div className="text-xs text-muted-foreground">Won</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center hover:bg-muted/80 transition-colors">
              <Target className="h-6 w-6 mx-auto text-primary mb-1" />
              <div className="text-2xl font-bold">{winRate}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center hover:bg-muted/80 transition-colors">
              <Clock className="h-6 w-6 mx-auto text-blue-500 mb-1" />
              <div className="text-2xl font-bold">
                {statistics.totalPlayTime > 0 ? Math.floor(statistics.totalPlayTime / 60) : "0"}
              </div>
              <div className="text-xs text-muted-foreground">Minutes Played</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center hover:bg-muted/80 transition-colors">
              <Flame className="h-6 w-6 mx-auto text-orange-500 mb-1" />
              <div className="text-2xl font-bold">{statistics.currentStreak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>

          {/* Best Times */}
          <div className="bg-background/50 p-4 rounded-xl border">
            <h3 className="font-medium flex items-center gap-2 mb-3 text-sm text-foreground/80">
              <Clock className="h-4 w-4 text-blue-500" />
              Best Times
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {difficulties.map((difficulty) => (
                <div
                  key={difficulty}
                  className="bg-muted/50 hover:bg-muted/80 transition-colors rounded-lg p-3 text-center"
                >
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {difficulty}
                  </div>
                  <div className="text-lg font-semibold mt-1">
                    {formatTime(statistics.bestTimes[difficulty])}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Average Times */}
          <div className="bg-background/50 p-4 rounded-xl border">
            <h3 className="font-medium flex items-center gap-2 mb-3 text-sm text-foreground/80">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Average Times
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {difficulties.map((difficulty) => (
                <div
                  key={`avg-${difficulty}`}
                  className="bg-muted/50 hover:bg-muted/80 transition-colors rounded-lg p-3 text-center"
                >
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {difficulty}
                  </div>
                  <div className="text-lg font-semibold mt-1">
                    {formatTime(statistics.averageTimes[difficulty])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}