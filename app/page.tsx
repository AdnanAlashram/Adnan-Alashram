import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Navigation from "@/components/Navigation";
import Process from "@/components/Process";
import Projects from "@/components/Projects";
import Services from "@/components/Services";
import TechStack from "@/components/TechStack";
import LiveChat from "@/components/LiveChat";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Marquee />
        <Projects />
        <Services />
        <About />
        <Process />
        <TechStack />
        <Contact />
      </main>
      <Footer />
      <LiveChat />
    </>
  );
}
