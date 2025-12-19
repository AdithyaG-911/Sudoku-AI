"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { HintResult } from "@/lib/sudoku"
import { Lightbulb, Check, X } from "lucide-react"

interface HintPanelProps {
  hint: HintResult
  onApply: () => void
  onDismiss: () => void
}

export function HintPanel({ hint, onApply, onDismiss }: HintPanelProps) {
  return (
    <div className="fixed inset-x-4 bottom-24 lg:relative lg:inset-auto lg:bottom-0 z-[60] animate-in slide-in-from-bottom-10 lg:slide-in-from-right-4 duration-300">
      <Card className="w-full lg:w-80 border-primary/50 bg-background/95 backdrop-blur-md lg:bg-primary/5 shadow-2xl lg:shadow-none">
        <CardHeader className="pb-3 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full"
            onClick={onDismiss}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
          <CardTitle className="flex items-center gap-2 text-lg pr-8 lg:pr-0">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            {hint.technique}
          </CardTitle>
          <CardDescription>
            Row {hint.row + 1}, Column {hint.col + 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{hint.explanation}</p>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
            <span className="text-sm text-muted-foreground">Correct value:</span>
            <span className="text-2xl font-bold text-primary">{hint.value}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 lg:hidden" onClick={onDismiss}>
              Dismiss
            </Button>
            <Button className="flex-1 lg:w-full gap-2" onClick={onApply}>
              <Check className="h-4 w-4" />
              Apply Hint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
