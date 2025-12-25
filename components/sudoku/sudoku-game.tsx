"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSudokuGame } from "@/hooks/use-sudoku-game"
import { playClickSound } from "@/hooks/use-sound"
import { SudokuBoard } from "./sudoku-board"
import { SudokuControls } from "./sudoku-controls"
import { SudokuHeader } from "./sudoku-header"
import { NewGameDialog } from "./new-game-dialog"
import { ImportDialog } from "./import-dialog"
import { HintPanel } from "./hint-panel"
import { VictoryDialog } from "./victory-dialog"
import { GameOverDialog } from "./game-over-dialog"
import { StatsDialog } from "./stats-dialog"
import type { Difficulty, GameMode } from "@/lib/sudoku"

export function SudokuGame() {
  const searchParams = useSearchParams()
  const {
    gameState,
    isNotesMode,
    setIsNotesMode,
    currentHint,
    statistics,
    startNewGame,
    importBoard,
    selectCell,
    setNumber,
    undo,
    redo,
    requestHint,
    applyHint,
    solveBoard,
    resetGame,
    clearHint,
    togglePause,
  } = useSudokuGame()

  const [showNewGameDialog, setShowNewGameDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showVictory, setShowVictory] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const mode = searchParams.get("mode")
    if (mode === "import") {
      setShowImportDialog(true)
      // Remove query param to prevent loop when gameState updates (e.g. timer)
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete("mode")
      router.replace(`?${newParams.toString()}`)
    } else if (!gameState) {
      setShowNewGameDialog(true)
    }
  }, [searchParams, gameState, router])

  // Handle game completion and new game state
  useEffect(() => {
    if (gameState?.isComplete) {
      setShowVictory(true)
      setShowGameOver(false)
    } else if (gameState?.isGameOver) {
      setShowGameOver(true)
      setShowVictory(false)
    } else {
      // Reset dialogs when starting a new game
      setShowVictory(false)
      setShowGameOver(false)
    }
  }, [gameState?.isComplete, gameState?.isGameOver])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (showNewGameDialog || showImportDialog || showVictory || showGameOver || showStats) return

      if (!gameState?.selectedCell || gameState?.isGameOver || gameState?.isPaused) {
        if (e.key === " " || e.key === "Escape") {
          e.preventDefault()
          togglePause()
        }
        return
      }

      if (e.key >= "1" && e.key <= "9") {
        playClickSound()
        setNumber(Number.parseInt(e.key))
      } else if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        setNumber(0)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const [row, col] = gameState.selectedCell
        if (row > 0) selectCell(row - 1, col)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        const [row, col] = gameState.selectedCell
        if (row < 8) selectCell(row + 1, col)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        const [row, col] = gameState.selectedCell
        if (col > 0) selectCell(row, col - 1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        const [row, col] = gameState.selectedCell
        if (col < 8) selectCell(row, col + 1)
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault()
        redo()
      } else if (e.key === "n" || e.key === "N") {
        setIsNotesMode(!isNotesMode)
      } else if (e.key === " " || e.key === "Escape") {
        e.preventDefault()
        togglePause()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    gameState,
    isNotesMode,
    selectCell,
    setNumber,
    setIsNotesMode,
    undo,
    redo,
    togglePause,
    showNewGameDialog,
    showImportDialog,
    showVictory,
    showGameOver,
    showStats,
  ])

  const handleNewGame = (difficulty: Difficulty, gameMode: GameMode) => {
    // Reset any completion states
    setShowVictory(false)
    setShowGameOver(false)
    // Start new game
    startNewGame(difficulty, gameMode)
    setShowNewGameDialog(false)
  }

  const handleImport = (board: number[][]) => {
    // Reset any completion states
    setShowVictory(false)
    setShowGameOver(false)
    // Import the board
    importBoard(board)
    setShowImportDialog(false)
  }

  const handleRetry = () => {
    resetGame()
    setShowGameOver(false)
  }

  const handleNewGameFromGameOver = () => {
    setShowGameOver(false)
    setShowNewGameDialog(true)
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      <SudokuHeader
        timer={gameState?.timer ?? 0}
        difficulty={gameState?.difficulty ?? "medium"}
        mistakes={gameState?.mistakes ?? 0}
        maxMistakes={gameState?.maxMistakes ?? 5}
        isPaused={gameState?.isPaused ?? false}
        gameMode={gameState?.gameMode ?? "classic"}
        onNewGame={() => setShowNewGameDialog(true)}
        onImport={() => setShowImportDialog(true)}
        onTogglePause={togglePause}
        onShowStats={() => setShowStats(true)}
      />

      <main
        className="flex-1 flex flex-col items-center justify-center px-1 sm:px-4 py-1 sm:py-2 md:py-4 overflow-hidden"
        onClick={() => selectCell(null, null)}
      >
        <div
          className="flex flex-col lg:flex-row gap-1 sm:gap-2 lg:gap-8 items-center lg:items-center justify-center w-full max-w-6xl mx-auto h-full"
        >
          <div
            className="flex flex-col items-center gap-2 sm:gap-4 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {gameState ? (
              <SudokuBoard
                board={gameState.board}
                initialBoard={gameState.initialBoard}
                solution={gameState.solution}
                notes={gameState.notes}
                selectedCell={gameState.selectedCell}
                hintCell={currentHint ? [currentHint.row, currentHint.col] : null}
                onCellClick={selectCell}
                isGameOver={gameState.isGameOver}
                isPaused={gameState.isPaused}
                gameMode={gameState.gameMode}
                highlightedNumber={gameState.highlightedNumber}
              />
            ) : (
              <div className="w-[288px] h-[288px] sm:w-[324px] sm:h-[324px] md:w-[450px] md:h-[450px] bg-muted/30 rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                <p className="text-muted-foreground text-center px-4 text-sm">
                  Start a new game or import a puzzle to begin playing
                </p>
              </div>
            )}

            <SudokuControls
              isNotesMode={isNotesMode}
              onToggleNotes={() => setIsNotesMode(!isNotesMode)}
              onNumberClick={setNumber}
              onUndo={undo}
              onRedo={redo}
              onHint={requestHint}
              onSolve={solveBoard}
              onReset={resetGame}
              canUndo={gameState ? gameState.historyIndex > 0 : false}
              canRedo={gameState ? gameState.historyIndex < gameState.history.length - 1 : false}
              disabled={!gameState || gameState.isGameOver || gameState.isPaused}
              aiSolverUnlocked={gameState?.aiSolverUnlocked ?? false}
              isGameOver={gameState?.isGameOver ?? false}
              board={gameState?.board}
            />
          </div>

          {currentHint && (
            <div onClick={(e) => e.stopPropagation()}>
              <HintPanel hint={currentHint} onApply={applyHint} onDismiss={clearHint} />
            </div>
          )}
        </div>
      </main>

      <NewGameDialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog} onSelect={handleNewGame} />

      <ImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} onImport={handleImport} />

      <VictoryDialog
        open={showVictory}
        onOpenChange={setShowVictory}
        time={gameState?.timer ?? 0}
        mistakes={gameState?.mistakes ?? 0}
        difficulty={gameState?.difficulty ?? "medium"}
        onNewGame={() => {
          setShowVictory(false)
          setShowNewGameDialog(true)
        }}
      />

      <GameOverDialog
        open={showGameOver}
        onOpenChange={setShowGameOver}
        mistakes={gameState?.mistakes ?? 0}
        maxMistakes={gameState?.maxMistakes ?? 5}
        difficulty={gameState?.difficulty ?? "medium"}
        onRetry={handleRetry}
        onNewGame={handleNewGameFromGameOver}
      />

      <StatsDialog open={showStats} onOpenChange={setShowStats} statistics={statistics} />
    </div>
  )
}
