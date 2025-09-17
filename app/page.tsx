import { HeroSection } from "@/components/hero-section"
import { ServicesShowcase } from "@/components/services-showcase"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ServicesShowcase />
    </div>
  )
}
