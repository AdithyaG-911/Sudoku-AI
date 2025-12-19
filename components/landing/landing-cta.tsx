"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function LandingCTA() {
  return (
    <section className="py-20 md:py-32 bg-primary/5">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to challenge yourself?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Start playing now and experience the smartest Sudoku app ever built. No sign-up required.
            </p>
            <Link href="/play">
              <Button size="lg" className="gap-2 text-base px-8">
                Play Free Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
