"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Brain, Camera } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Puzzle Experience
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6">
              The smartest way to <span className="text-primary">play Sudoku</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 text-balance">
              Import puzzles from images using deep learning, get intelligent hints, and solve any Sudoku instantly.
              Experience the future of puzzle gaming.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/play">
                <Button size="lg" className="gap-2 text-base px-8">
                  Start Playing <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/play?mode=import">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 bg-transparent">
                  <Camera className="h-4 w-4" /> Import Puzzle
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="grid grid-cols-3 gap-8 md:gap-16 pt-8 border-t border-border/50 w-full max-w-xl">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">99%</div>
                <div className="text-xs md:text-sm text-muted-foreground">Detection Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{"<"}1s</div>
                <div className="text-xs md:text-sm text-muted-foreground">Solve Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">5</div>
                <div className="text-xs md:text-sm text-muted-foreground">Difficulty Levels</div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Floating icons */}
        <div className="absolute top-20 left-[15%] hidden lg:block animate-bounce" style={{ animationDuration: "3s" }}>
          <div className="p-3 rounded-xl bg-card shadow-lg border">
            <Brain className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div
          className="absolute bottom-20 right-[15%] hidden lg:block animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "1s" }}
        >
          <div className="p-3 rounded-xl bg-card shadow-lg border">
            <Camera className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    </section>
  )
}
