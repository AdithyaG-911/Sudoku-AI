"use client"

import { Brain, Camera, Lightbulb, Zap, History, Palette } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const features = [
  {
    icon: Camera,
    title: "Image Import",
    description:
      "Upload photos of Sudoku puzzles from newspapers, books, or handwritten notes. Our deep learning model extracts the puzzle instantly.",
  },
  {
    icon: Brain,
    title: "AI Solver",
    description:
      "Stuck on a puzzle? Our advanced backtracking algorithm with constraint propagation solves any valid Sudoku in milliseconds.",
  },
  {
    icon: Lightbulb,
    title: "Smart Hints",
    description:
      "Get contextual hints that teach you solving techniques like naked singles, hidden pairs, and X-wing patterns.",
  },
  {
    icon: Zap,
    title: "Multiple Difficulties",
    description:
      "From beginner to expert, choose from 5 difficulty levels with puzzles generated using sophisticated algorithms.",
  },
  {
    icon: History,
    title: "Undo & History",
    description: "Made a mistake? Unlimited undo/redo support lets you explore different strategies without fear.",
  },
  {
    icon: Palette,
    title: "Candidate Notes",
    description:
      "Toggle pencil marks mode to note possible candidates for each cell, essential for advanced solving techniques.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to master Sudoku</h2>
            <p className="text-muted-foreground text-lg">
              Powerful features designed to enhance your puzzle-solving experience
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 100}>
              <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
