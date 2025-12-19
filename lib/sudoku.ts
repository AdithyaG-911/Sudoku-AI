// Sudoku game logic and utilities

export type Board = number[][]
export type Notes = Set<number>[][]
export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "expert"
export type GameMode = "classic" | "diagonal"

export interface GameState {
  board: Board
  solution: Board
  initialBoard: Board
  notes: Notes
  selectedCell: [number, number] | null
  history: { board: Board; notes: Notes }[]
  historyIndex: number
  isComplete: boolean
  isGameOver: boolean
  difficulty: Difficulty
  timer: number
  mistakes: number
  maxMistakes: number
  aiSolverUnlocked: boolean
  isPaused: boolean
  gameMode: GameMode
  highlightedNumber: number | null
  statsUpdated?: boolean
}

export interface GameStatistics {
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  bestTimes: Record<Difficulty, number | null>
  averageTimes: Record<Difficulty, number | null>
  totalPlayTime: number
  currentStreak: number
  bestStreak: number
  lastPlayed: string | null
}

export function createEmptyStatistics(): GameStatistics {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    bestTimes: { beginner: null, easy: null, medium: null, hard: null, expert: null },
    averageTimes: { beginner: null, easy: null, medium: null, hard: null, expert: null },
    totalPlayTime: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayed: null,
  }
}

export function getMaxMistakes(difficulty: Difficulty): number {
  switch (difficulty) {
    case "beginner":
      return 10
    case "easy":
      return 7
    case "medium":
      return 5
    case "hard":
      return 3
    case "expert":
      return 2
  }
}

export function getAiSolverUnlockThreshold(difficulty: Difficulty): number {
  switch (difficulty) {
    case "beginner":
      return 8
    case "easy":
      return 6
    case "medium":
      return 4
    case "hard":
      return 2
    case "expert":
      return 1
  }
}

export function createEmptyNotes(): Notes {
  return Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => new Set<number>()),
    )
}

export function copyBoard(board: Board): Board {
  return board.map((row) => [...row])
}

export function copyNotes(notes: Notes): Notes {
  return notes.map((row) => row.map((cell) => new Set(cell)))
}

export function isValidMove(
  board: Board,
  row: number,
  col: number,
  num: number,
  gameMode: GameMode = "classic",
): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === num) return false
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === num) return false
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === num) return false
    }
  }

  if (gameMode === "diagonal") {
    // Main diagonal (top-left to bottom-right)
    if (row === col) {
      for (let i = 0; i < 9; i++) {
        if (i !== row && board[i][i] === num) return false
      }
    }
    // Anti-diagonal (top-right to bottom-left)
    if (row + col === 8) {
      for (let i = 0; i < 9; i++) {
        if (i !== row && board[i][8 - i] === num) return false
      }
    }
  }

  return true
}

export function isBoardComplete(board: Board, gameMode: GameMode = "classic"): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false
    }
  }
  // All cells filled, check validity
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const num = board[r][c]
      board[r][c] = 0
      const valid = isValidMove(board, r, c, num, gameMode)
      board[r][c] = num
      if (!valid) return false
    }
  }
  return true
}

export function getCandidates(board: Board, row: number, col: number, gameMode: GameMode = "classic"): number[] {
  if (board[row][col] !== 0) return []
  const candidates: number[] = []
  for (let num = 1; num <= 9; num++) {
    if (isValidMove(board, row, col, num, gameMode)) {
      candidates.push(num)
    }
  }
  return candidates
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function solveSudoku(board: Board, gameMode: GameMode = "classic"): Board | null {
  const solved = copyBoard(board)

  function findEmpty(): [number, number] | null {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (solved[r][c] === 0) return [r, c]
      }
    }
    return null
  }

  function solve(): boolean {
    const empty = findEmpty()
    if (!empty) return true

    const [row, col] = empty

    for (let num = 1; num <= 9; num++) {
      if (isValidMove(solved, row, col, num, gameMode)) {
        solved[row][col] = num
        if (solve()) return true
        solved[row][col] = 0
      }
    }

    return false
  }

  return solve() ? solved : null
}

function generateSolvedBoard(gameMode: GameMode = "classic"): Board {
  const board: Board = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0))

  function fillBoard(pos: number): boolean {
    if (pos === 81) return true

    const row = Math.floor(pos / 9)
    const col = pos % 9

    const candidates = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])

    for (const num of candidates) {
      if (isValidMove(board, row, col, num, gameMode)) {
        board[row][col] = num
        if (fillBoard(pos + 1)) return true
        board[row][col] = 0
      }
    }

    return false
  }

  fillBoard(0)
  return board
}

function getCellsToRemove(difficulty: Difficulty): number {
  switch (difficulty) {
    case "beginner":
      return 30
    case "easy":
      return 38
    case "medium":
      return 45
    case "hard":
      return 50
    case "expert":
      return 55
  }
}

export function generatePuzzle(
  difficulty: Difficulty,
  gameMode: GameMode = "classic",
): { puzzle: Board; solution: Board } {
  const solution = generateSolvedBoard(gameMode)
  const puzzle = copyBoard(solution)

  const cellsToRemove = getCellsToRemove(difficulty)

  const positions: [number, number][] = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c])
    }
  }
  const shuffledPositions = shuffleArray(positions)

  let removed = 0
  for (const [r, c] of shuffledPositions) {
    if (removed >= cellsToRemove) break

    const backup = puzzle[r][c]
    puzzle[r][c] = 0

    if (difficulty === "beginner" || difficulty === "easy") {
      let solutionCount = 0
      const testBoard = copyBoard(puzzle)

      function countSolutions(pos: number): boolean {
        if (solutionCount > 1) return true
        if (pos === 81) {
          solutionCount++
          return solutionCount > 1
        }

        const row = Math.floor(pos / 9)
        const col = pos % 9

        if (testBoard[row][col] !== 0) {
          return countSolutions(pos + 1)
        }

        for (let num = 1; num <= 9; num++) {
          if (isValidMove(testBoard, row, col, num, gameMode)) {
            testBoard[row][col] = num
            if (countSolutions(pos + 1)) return true
            testBoard[row][col] = 0
          }
        }
        return false
      }

      countSolutions(0)

      if (solutionCount === 1) {
        removed++
      } else {
        puzzle[r][c] = backup
      }
    } else {
      removed++
    }
  }

  return { puzzle, solution }
}

export interface HintResult {
  row: number
  col: number
  value: number
  technique: string
  explanation: string
}

export function getHint(board: Board, solution: Board, gameMode: GameMode = "classic"): HintResult | null {
  // Find cells with errors first
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
        return {
          row: r,
          col: c,
          value: solution[r][c],
          technique: "Error Correction",
          explanation: `The value ${board[r][c]} at this cell is incorrect. The correct value is ${solution[r][c]}.`,
        }
      }
    }
  }

  // Find naked singles
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const candidates = getCandidates(board, r, c, gameMode)
        if (candidates.length === 1) {
          return {
            row: r,
            col: c,
            value: candidates[0],
            technique: "Naked Single",
            explanation: `This cell can only contain ${candidates[0]} as all other numbers are already present in the same row, column, or box${gameMode === "diagonal" && (r === c || r + c === 8) ? " or diagonal" : ""}.`,
          }
        }
      }
    }
  }

  // Fallback
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        return {
          row: r,
          col: c,
          value: solution[r][c],
          technique: "Direct Hint",
          explanation: `The value for this cell is ${solution[r][c]}.`,
        }
      }
    }
  }

  return null
}

export function getConflicts(board: Board, gameMode: GameMode = "classic"): Set<string> {
  const conflicts = new Set<string>()

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const num = board[r][c]
      if (num === 0) continue

      // Check row
      for (let col = 0; col < 9; col++) {
        if (col !== c && board[r][col] === num) {
          conflicts.add(`${r}-${c}`)
          conflicts.add(`${r}-${col}`)
        }
      }
      // Check column
      for (let row = 0; row < 9; row++) {
        if (row !== r && board[row][c] === num) {
          conflicts.add(`${r}-${c}`)
          conflicts.add(`${row}-${c}`)
        }
      }
      // Check box
      const boxRow = Math.floor(r / 3) * 3
      const boxCol = Math.floor(c / 3) * 3
      for (let br = boxRow; br < boxRow + 3; br++) {
        for (let bc = boxCol; bc < boxCol + 3; bc++) {
          if ((br !== r || bc !== c) && board[br][bc] === num) {
            conflicts.add(`${r}-${c}`)
            conflicts.add(`${br}-${bc}`)
          }
        }
      }

      if (gameMode === "diagonal") {
        if (r === c) {
          for (let i = 0; i < 9; i++) {
            if (i !== r && board[i][i] === num) {
              conflicts.add(`${r}-${c}`)
              conflicts.add(`${i}-${i}`)
            }
          }
        }
        if (r + c === 8) {
          for (let i = 0; i < 9; i++) {
            if (i !== r && board[i][8 - i] === num) {
              conflicts.add(`${r}-${c}`)
              conflicts.add(`${i}-${8 - i}`)
            }
          }
        }
      }
    }
  }

  return conflicts
}
