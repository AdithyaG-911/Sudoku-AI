"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Difficulty, GameMode } from "@/lib/sudoku"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid3X3, Slash } from "lucide-react"

interface NewGameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (difficulty: Difficulty, gameMode: GameMode) => void
}

const difficulties: { level: Difficulty; label: string; description: string; color: string }[] = [
  { level: "beginner", label: "Beginner", description: "~30 empty cells, 10 mistakes allowed", color: "bg-green-500" },
  { level: "easy", label: "Easy", description: "~40 empty cells, 7 mistakes allowed", color: "bg-teal-500" },
  { level: "medium", label: "Medium", description: "~45 empty cells, 5 mistakes allowed", color: "bg-yellow-500" },
  { level: "hard", label: "Hard", description: "~52 empty cells, 3 mistakes allowed", color: "bg-orange-500" },
  { level: "expert", label: "Expert", description: "~58 empty cells, 2 mistakes allowed", color: "bg-red-500" },
]

export function NewGameDialog({ open, onOpenChange, onSelect }: NewGameDialogProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>("classic")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">New Game</DialogTitle>
          <DialogDescription>Choose your game mode and difficulty level</DialogDescription>
        </DialogHeader>

        <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as GameMode)} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classic" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Classic
            </TabsTrigger>
            <TabsTrigger value="diagonal" className="gap-2">
              <Slash className="h-4 w-4" />
              Diagonal X
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classic" className="mt-3">
            <p className="text-sm text-muted-foreground mb-3">Standard 9x9 Sudoku with rows, columns, and 3x3 boxes.</p>
          </TabsContent>

          <TabsContent value="diagonal" className="mt-3">
            <p className="text-sm text-muted-foreground mb-3">
              Like classic, but both main diagonals must also contain 1-9.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-2 mt-2">
          {difficulties.map(({ level, label, description, color }) => (
            <Button
              key={level}
              variant="outline"
              className="h-auto py-3 justify-start gap-3 hover:bg-muted bg-transparent"
              onClick={() => onSelect(level, selectedMode)}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", color)} />
              <div className="text-left">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
