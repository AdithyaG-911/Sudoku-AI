"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Moon, Sun, Grid3X3, Plus, Upload, AlertTriangle, Pause, Play, BarChart2 } from "lucide-react"
import type { Difficulty, GameMode } from "@/lib/sudoku"
import { cn } from "@/lib/utils"

interface SudokuHeaderProps {
  timer: number
  difficulty: Difficulty
  mistakes: number
  maxMistakes: number
  isPaused: boolean
  gameMode: GameMode
  onNewGame: () => void
  onImport: () => void
  onTogglePause: () => void
  onShowStats: () => void
}

export function SudokuHeader({
  timer,
  difficulty,
  mistakes,
  maxMistakes,
  isPaused,
  gameMode,
  onNewGame,
  onImport,
  onTogglePause,
  onShowStats,
}: SudokuHeaderProps) {
  const { theme, setTheme } = useTheme()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const difficultyColors: Record<Difficulty, string> = {
    beginner: "text-green-600 dark:text-green-400",
    easy: "text-green-500",
    medium: "text-yellow-600 dark:text-yellow-400",
    hard: "text-orange-500",
    expert: "text-destructive",
  }

  const mistakeProgress = (mistakes / maxMistakes) * 100
  const isNearLimit = mistakes >= maxMistakes - 1
  const isAtLimit = mistakes >= maxMistakes

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-14 items-center justify-between px-2 sm:px-4 gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary">
            <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
          </div>
          <span className="text-sm sm:text-lg font-bold hidden xs:inline">Sudoku AI</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-4 text-[10px] sm:text-sm flex-1 justify-center min-w-0">
          {/* Timer with pause button */}
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-7 sm:w-7" onClick={onTogglePause}>
              {isPaused ? (
                <Play className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
              ) : (
                <Pause className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
              )}
            </Button>
            <span className={cn("font-mono font-medium truncate", isPaused && "text-muted-foreground/50")}>{formatTime(timer)}</span>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`font-semibold capitalize truncate ${difficultyColors[difficulty]}`}>{difficulty}</span>
          </div>

          {/* Mistakes */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div
              className={cn(
                "flex items-center gap-0.5 sm:gap-1",
                isAtLimit ? "text-destructive" : isNearLimit ? "text-orange-500" : "text-muted-foreground",
              )}
            >
              <AlertTriangle className={cn("h-2.5 w-2.5 sm:h-4 sm:w-4", isNearLimit && "animate-pulse")} />
              <span className="font-bold">
                {mistakes}/{maxMistakes}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={onShowStats}>
            <BarChart2 className="h-4 w-4" />
            <span className="sr-only">Statistics</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex" onClick={onNewGame}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">New Game</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex" onClick={onImport}>
            <Upload className="h-4 w-4" />
            <span className="sr-only">Import</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
