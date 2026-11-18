import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Build from "@/components/Build";
import Rulers from "@/components/Rulers";
import { Contact, Footer, Industries, Reveals, Services, Testimonial, Values, Work } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Nav />
      <div id="page">
        <main>
          <Hero />
          <Build />
          <Values />
          <Services />
          <Industries />
          <Work />
          <Testimonial />
          <Contact />
        </main>
        <Footer />
      </div>
      <Rulers />
      <Reveals />
    </>
  );
}
