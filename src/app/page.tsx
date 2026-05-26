import Header from "@/components/header";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Stats } from "@/components/stats";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <HowItWorks />
      <Stats />
    </main>
  );
}
