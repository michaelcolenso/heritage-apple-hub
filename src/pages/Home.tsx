import Hero from "@/sections/Hero";
import FeaturedVarieties from "@/sections/FeaturedVarieties";
import HowItWorks from "@/sections/HowItWorks";
import MarketplacePreview from "@/sections/MarketplacePreview";
import PreservationImpact from "@/sections/PreservationImpact";
import Community from "@/sections/Community";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedVarieties />
      <HowItWorks />
      <MarketplacePreview />
      <PreservationImpact />
      <Community />
      <Footer />
    </div>
  );
}
