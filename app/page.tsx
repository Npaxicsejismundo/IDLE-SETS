import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Join } from "@/components/Join";
import { Marquee } from "@/components/Marquee";
import { Method } from "@/components/Method";
import { Moment } from "@/components/Moment";
import { Results } from "@/components/Results";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Marquee />
        <Results />
        <Method />
        <HowItWorks />
        <Join />
        <Moment />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
