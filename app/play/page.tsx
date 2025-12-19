"use client"

import { Suspense } from "react"
import { SudokuGame } from "@/components/sudoku/sudoku-game"

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SudokuGame />
    </Suspense>
  )
}
