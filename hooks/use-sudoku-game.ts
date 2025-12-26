"use client"

import { useCallback, useEffect, useState } from "react"
import {
  type Difficulty,
  type Board,
  type GameState,
  type GameMode,
  type GameStatistics,
  createEmptyNotes,
  copyBoard,
  copyNotes,
  generatePuzzle,
  solveSudoku,
  getHint,
  isBoardComplete,
  getMaxMistakes,
  getAiSolverUnlockThreshold,
  createEmptyStatistics,
  type HintResult,
} from "@/lib/sudoku"
import { playClickSound, playVictorySound } from "@/hooks/use-sound"

const STORAGE_KEY = "sudoku-game-state"
const STATS_KEY = "sudoku-statistics"

export function useSudokuGame() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isNotesMode, setIsNotesMode] = useState(false)
  const [currentHint, setCurrentHint] = useState<HintResult | null>(null)
  const [statistics, setStatistics] = useState<GameStatistics>(createEmptyStatistics())

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        parsed.notes = parsed.notes.map((row: number[][]) => row.map((cell: number[]) => new Set<number>(cell)))
        parsed.history = parsed.history.map((h: { board: Board; notes: number[][][] }) => ({
          board: h.board,
          notes: h.notes.map((row: number[][]) => row.map((cell: number[]) => new Set<number>(cell))),
        }))
        if (parsed.maxMistakes === undefined) parsed.maxMistakes = getMaxMistakes(parsed.difficulty)
        if (parsed.isGameOver === undefined) parsed.isGameOver = false
        if (parsed.aiSolverUnlocked === undefined) parsed.aiSolverUnlocked = false
        if (parsed.isPaused === undefined) parsed.isPaused = false
        if (parsed.gameMode === undefined) parsed.gameMode = "classic"
        if (parsed.highlightedNumber === undefined) parsed.highlightedNumber = null
        if (parsed.statsUpdated === undefined) parsed.statsUpdated = parsed.isComplete || parsed.isGameOver
        setGameState(parsed)
      }

      const savedStats = localStorage.getItem(STATS_KEY)
      if (savedStats) {
        setStatistics(JSON.parse(savedStats))
      }
    } catch (e) {
      console.error("Failed to load saved game:", e)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Save game state
  useEffect(() => {
    if (gameState) {
      try {
        const toSave = {
          ...gameState,
          notes: gameState.notes.map((row) => row.map((cell) => Array.from(cell))),
          history: gameState.history.map((h) => ({
            board: h.board,
            notes: h.notes.map((row) => row.map((cell) => Array.from(cell))),
          })),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      } catch (e) {
        console.error("Failed to save game:", e)
      }
    }
  }, [gameState])

  // Save statistics
  useEffect(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(statistics))
    } catch (e) {
      console.error("Failed to save statistics:", e)
    }
  }, [statistics])

  const updateStatistics = useCallback((won: boolean, time: number, difficulty: Difficulty) => {
    setStatistics((prev) => {
      const newStats = { ...prev }
      newStats.gamesPlayed++
      newStats.totalPlayTime += time
      newStats.lastPlayed = new Date().toISOString()

      if (won) {
        newStats.gamesWon++
        newStats.currentStreak++
        newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak)

        // Update best time
        if (newStats.bestTimes[difficulty] === null || time < newStats.bestTimes[difficulty]!) {
          newStats.bestTimes[difficulty] = time
        }

        // Update average time
        if (newStats.averageTimes[difficulty] === null) {
          newStats.averageTimes[difficulty] = time
        } else {
          // Simple moving average
          newStats.averageTimes[difficulty] = Math.floor(newStats.averageTimes[difficulty]! * 0.8 + time * 0.2)
        }
      } else {
        newStats.gamesLost++
        newStats.currentStreak = 0
      }

      return newStats
    })
  }, [])

  const startNewGame = useCallback((difficulty: Difficulty, gameMode: GameMode = "classic") => {
    const { puzzle, solution } = generatePuzzle(difficulty, gameMode)
    const maxMistakes = getMaxMistakes(difficulty)
    setGameState({
      board: copyBoard(puzzle),
      solution,
      initialBoard: copyBoard(puzzle),
      notes: createEmptyNotes(),
      selectedCell: null,
      history: [{ board: copyBoard(puzzle), notes: createEmptyNotes() }],
      historyIndex: 0,
      isComplete: false,
      isGameOver: false,
      difficulty,
      timer: 0,
      mistakes: 0,
      maxMistakes,
      aiSolverUnlocked: false,
      isPaused: false,
      gameMode,
      highlightedNumber: null,
      statsUpdated: false,
    })
    setCurrentHint(null)
    setIsNotesMode(false)
  }, [])

  const importBoard = useCallback((board: Board, gameMode: GameMode = "classic") => {
    const solution = solveSudoku(board, gameMode)
    if (!solution) {
      throw new Error("Invalid Sudoku puzzle - no solution exists")
    }

    const difficulty: Difficulty = "medium"
    const maxMistakes = getMaxMistakes(difficulty)

    setGameState({
      board: copyBoard(board),
      solution,
      initialBoard: copyBoard(board),
      notes: createEmptyNotes(),
      selectedCell: null,
      history: [{ board: copyBoard(board), notes: createEmptyNotes() }],
      historyIndex: 0,
      isComplete: false,
      isGameOver: false,
      difficulty,
      timer: 0,
      mistakes: 0,
      maxMistakes,
      aiSolverUnlocked: false,
      isPaused: false,
      gameMode,
      highlightedNumber: null,
      statsUpdated: false,
    })
    setCurrentHint(null)
    setIsNotesMode(false)
  }, [])

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.isComplete || prev.isGameOver) return prev
      return { ...prev, isPaused: !prev.isPaused }
    })
  }, [])

  const selectCell = useCallback((row: number | null, col: number | null) => {
    setGameState((prev) => {
      if (!prev || prev.isGameOver || prev.isPaused) return prev
      return { ...prev, selectedCell: row !== null && col !== null ? [row, col] : null, highlightedNumber: null }
    })
    setCurrentHint(null)
  }, [])

  const setNumber = useCallback(
    (num: number) => {
      setGameState((prev) => {
        if (!prev || prev.isGameOver || prev.isPaused) return prev

        if (!prev.selectedCell) {
          // Toggle highlightedNumber if no cell is selected
          const newHighlighted = prev.highlightedNumber === num ? null : num
          return { ...prev, highlightedNumber: newHighlighted }
        }

        const [row, col] = prev.selectedCell

        if (prev.initialBoard[row][col] !== 0) return prev

        const newBoard = copyBoard(prev.board)
        const newNotes = copyNotes(prev.notes)

        if (isNotesMode && num !== 0) {
          if (newNotes[row][col].has(num)) {
            newNotes[row][col].delete(num)
          } else {
            newNotes[row][col].add(num)
          }
        } else {
          newBoard[row][col] = num
          newNotes[row][col] = new Set()

          if (num !== 0) {
            for (let c = 0; c < 9; c++) newNotes[row][c].delete(num)
            for (let r = 0; r < 9; r++) newNotes[r][col].delete(num)
            const boxRow = Math.floor(row / 3) * 3
            const boxCol = Math.floor(col / 3) * 3
            for (let r = boxRow; r < boxRow + 3; r++) {
              for (let c = boxCol; c < boxCol + 3; c++) {
                newNotes[r][c].delete(num)
              }
            }
          }
        }

        let mistakes = prev.mistakes
        let aiSolverUnlocked = prev.aiSolverUnlocked
        if (!isNotesMode && num !== 0 && num !== prev.solution[row][col]) {
          mistakes++
          const unlockThreshold = getAiSolverUnlockThreshold(prev.difficulty)
          if (mistakes >= unlockThreshold && !aiSolverUnlocked) {
            aiSolverUnlocked = true
          }
        }

        const isGameOver = mistakes >= prev.maxMistakes

        const newHistory = prev.history.slice(0, prev.historyIndex + 1)
        newHistory.push({ board: copyBoard(newBoard), notes: copyNotes(newNotes) })

        const isComplete = isBoardComplete(newBoard, prev.gameMode)
        if (isComplete) {
          playVictorySound()
        }

        return {
          ...prev,
          board: newBoard,
          notes: newNotes,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isComplete,
          isGameOver,
          mistakes,
          aiSolverUnlocked,
          highlightedNumber: null,
        }
      })
      setCurrentHint(null)
    },
    [isNotesMode],
  )

  const undo = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.historyIndex === 0 || prev.isGameOver || prev.isPaused) return prev
      const newIndex = prev.historyIndex - 1
      const state = prev.history[newIndex]
      return {
        ...prev,
        board: copyBoard(state.board),
        notes: copyNotes(state.notes),
        historyIndex: newIndex,
      }
    })
    setCurrentHint(null)
  }, [])

  const redo = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.historyIndex >= prev.history.length - 1 || prev.isGameOver || prev.isPaused) return prev
      const newIndex = prev.historyIndex + 1
      const state = prev.history[newIndex]
      return {
        ...prev,
        board: copyBoard(state.board),
        notes: copyNotes(state.notes),
        historyIndex: newIndex,
      }
    })
    setCurrentHint(null)
  }, [])

  const requestHint = useCallback(() => {
    if (!gameState || gameState.isGameOver || gameState.isPaused) return
    const hint = getHint(gameState.board, gameState.solution, gameState.gameMode)
    setCurrentHint(hint)
    if (hint) {
      setGameState((prev) => (prev ? { ...prev, selectedCell: [hint.row, hint.col] } : prev))
    }
  }, [gameState])

  const applyHint = useCallback(() => {
    if (!currentHint) return
    selectCell(currentHint.row, currentHint.col)
    setIsNotesMode(false)
    setTimeout(() => {
      setGameState((prev) => {
        if (!prev || prev.isGameOver || prev.isPaused) return prev
        const newBoard = copyBoard(prev.board)
        const newNotes = copyNotes(prev.notes)

        newBoard[currentHint.row][currentHint.col] = currentHint.value
        newNotes[currentHint.row][currentHint.col] = new Set()

        for (let c = 0; c < 9; c++) newNotes[currentHint.row][c].delete(currentHint.value)
        for (let r = 0; r < 9; r++) newNotes[r][currentHint.col].delete(currentHint.value)
        const boxRow = Math.floor(currentHint.row / 3) * 3
        const boxCol = Math.floor(currentHint.col / 3) * 3
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            newNotes[r][c].delete(currentHint.value)
          }
        }

        const newHistory = prev.history.slice(0, prev.historyIndex + 1)
        newHistory.push({ board: copyBoard(newBoard), notes: copyNotes(newNotes) })

        return {
          ...prev,
          board: newBoard,
          notes: newNotes,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isComplete: isBoardComplete(newBoard, prev.gameMode),
        }
      })
      setCurrentHint(null)
    }, 50)
  }, [currentHint, selectCell])

  const clearHint = useCallback(() => {
    setCurrentHint(null)
  }, [])

  const solveBoard = useCallback(() => {
    if (!gameState) return;
    if (!gameState.aiSolverUnlocked && !gameState.isGameOver) return; // Only allow solve if unlocked or game is over

    // Animated solve - fill cells one by one
    const cellsToSolve: [number, number][] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const currentVal = gameState.board[row][col];
        const correctVal = gameState.solution[row][col];
        // Include empty cells AND incorrect cells
        if (currentVal === 0 || currentVal !== correctVal) {
          cellsToSolve.push([row, col]);
        }
      }
    }

    if (cellsToSolve.length === 0) {
      setGameState((prev) => (prev ? { ...prev, isComplete: true } : prev));
      return;
    }

    // Animate filling cells
    let currentIndex = 0;
    const fillNextCell = () => {
      if (currentIndex >= cellsToSolve.length) {
        // All cells filled - mark as complete
        playVictorySound()
        setTimeout(() => {
          setGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              isComplete: true,
              isGameOver: false, // Ensure game is not marked as over if solved
              selectedCell: null, // Deselect cell after solve
            };
          });
        }, 300);
        return;
      }

      const [row, col] = cellsToSolve[currentIndex];
      const correctValue = gameState.solution[row][col];

      // Select the cell and fill it
      playClickSound()
      setGameState((prev) => {
        if (!prev) return prev;

        const newBoard = prev.board.map((r) => [...r]);
        newBoard[row][col] = correctValue;

        // Clear notes for the filled cell
        const newNotes = copyNotes(prev.notes);
        newNotes[row][col] = new Set();

        // Update history
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push({ board: copyBoard(newBoard), notes: copyNotes(newNotes) });

        return {
          ...prev,
          board: newBoard,
          notes: newNotes,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          selectedCell: [row, col], // Show which cell is being filled
        };
      });

      currentIndex++;
      // Continue with next cell after a short delay
      setTimeout(fillNextCell, 100); // 100ms between each cell
    };

    // Start the animation
    fillNextCell();
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        board: copyBoard(prev.initialBoard),
        notes: createEmptyNotes(),
        history: [{ board: copyBoard(prev.initialBoard), notes: createEmptyNotes() }],
        historyIndex: 0,
        isComplete: false,
        isGameOver: false,
        timer: 0,
        mistakes: 0,
        selectedCell: null,
        aiSolverUnlocked: false,
        isPaused: false,
        highlightedNumber: null,
      }
    })
    setCurrentHint(null)
  }, [])

  useEffect(() => {
    if (!gameState || gameState.isComplete || gameState.isGameOver || gameState.isPaused) return
    const interval = setInterval(() => {
      setGameState((prev) => (prev ? { ...prev, timer: prev.timer + 1 } : prev))
    }, 1000)
    return () => clearInterval(interval)
  }, [!!gameState, gameState?.isComplete, gameState?.isGameOver, gameState?.isPaused])

  useEffect(() => {
    if (!gameState || gameState.statsUpdated) return

    if (gameState.isComplete && !gameState.isGameOver) {
      updateStatistics(true, gameState.timer, gameState.difficulty)
      setGameState(prev => prev ? { ...prev, statsUpdated: true } : prev)
    } else if (gameState.isGameOver && !gameState.isComplete) {
      updateStatistics(false, gameState.timer, gameState.difficulty)
      setGameState(prev => prev ? { ...prev, statsUpdated: true } : prev)
    }
  }, [gameState, updateStatistics])

  return {
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
    clearHint,
    solveBoard,
    resetGame,
    togglePause,
  }
}
