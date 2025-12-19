import Link from "next/link"
import { Grid3X3 } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Grid3X3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Sudoku AI</span>
          </Link>

          <p className="text-sm text-muted-foreground">Built with deep learning and love for puzzles</p>

          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/play" className="hover:text-foreground transition-colors">
              Play
            </Link>
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
