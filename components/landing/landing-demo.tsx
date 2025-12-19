"use client"

import { ScrollReveal } from "@/components/scroll-reveal"
import { SudokuMiniBoard } from "@/components/sudoku/sudoku-mini-board"

export function LandingDemo() {
  const demoBoard = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ]

  return (
    <section id="demo" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal direction="left">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Beautiful, intuitive interface</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Our clean, modern design makes solving Sudoku a joy. Every interaction is carefully crafted for the best
                possible experience on any device.
              </p>

              <ul className="space-y-4">
                {[
                  "Responsive design works perfectly on mobile and desktop",
                  "Visual feedback highlights conflicts and valid moves",
                  "Dark and light modes for comfortable play anytime",
                  "Keyboard shortcuts for power users",
                ].map((item, i) => (
                  <ScrollReveal key={i} delay={i * 100}>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span>{item}</span>
                    </li>
                  </ScrollReveal>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="flex justify-center">
              <div className="p-6 rounded-2xl bg-card border shadow-xl">
                <SudokuMiniBoard board={demoBoard} />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
