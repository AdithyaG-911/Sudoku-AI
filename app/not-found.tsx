"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, RefreshCw } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="grid grid-cols-9 h-full w-full">
                    {Array.from({ length: 81 }).map((_, i) => (
                        <div key={i} className="border border-foreground/20 flex items-center justify-center text-4xl font-mono">
                            {Math.random() > 0.7 ? Math.floor(Math.random() * 9) + 1 : ""}
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative z-10 text-center space-y-6 max-w-md mx-auto">
                <div className="relative">
                    <h1 className="text-9xl font-black text-primary/20 select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold bg-background px-4 border-2 border-primary rounded-xl -rotate-12 shadow-xl">
                            Missing Number?
                        </span>
                    </div>
                </div>

                <p className="text-xl text-muted-foreground font-medium">
                    Oops! The page you are looking for doesn't exist. It might have been erased like a wrong pencil mark.
                </p>

                <div className="flex gap-4 justify-center">
                    <Button asChild size="lg" className="rounded-full">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" /> Go Home
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-full" onClick={() => window.location.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Reloading
                    </Button>
                </div>
            </div>
        </div>
    )
}
