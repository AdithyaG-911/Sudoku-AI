import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingDemo } from "@/components/landing/landing-demo"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingDemo />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
