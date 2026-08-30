import { ArrowRight, BellRing, BrainCircuit, CalendarDays, CloudSun, MapPinned, ShieldCheck, Sprout } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/Button";

type RevealProps = { children: ReactNode; className?: string };

function Reveal({ children, className = "" }: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !window.IntersectionObserver) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.16 });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={elementRef} className={`landing-reveal ${visible ? "is-visible" : ""} ${className}`}>{children}</div>;
}

const problemSignals = [
  { icon: CloudSun, title: "Weather can turn quickly", description: "Harvest and drying windows need to account for changing conditions." },
  { icon: CalendarDays, title: "Deadlines do not move", description: "Buyer commitments and harvest readiness can put pressure on every decision." },
  { icon: Sprout, title: "Each field is different", description: "A plan must begin with the crop, field, and context you know best." },
];

const planSteps = [
  { icon: MapPinned, label: "Share what is happening", detail: "Describe your field, crop readiness, target, and deadline in plain language." },
  { icon: CloudSun, label: "Review a practical plan", detail: "TUNAS combines confirmed details with forecast context to suggest harvest and drying windows." },
  { icon: ShieldCheck, label: "Approve before you act", detail: "You review the schedule, risks, and assumptions before a mission is created." },
];

const features = [
  { icon: BellRing, title: "Proactive risk alerts", detail: "Keep an eye on weather-related risks and changes that could affect the harvest plan." },
  { icon: CloudSun, title: "Weather-aware missions", detail: "Turn confirmed field details and forecast context into practical harvest and drying work." },
  { icon: BrainCircuit, title: "Outcome-informed recommendations", detail: "Use recorded past harvest outcomes as context for future planning and review." },
];

export function LandingRoute() {
  return (
    <main id="home" className="landing-shell overflow-hidden bg-[#f7f5ee] text-forest-700">
      <a className="landing-skip-link" href="#landing-content">Skip to content</a>
      <header className="landing-nav">
        <a href="#home" aria-label="TUNAS home" className="inline-flex shrink-0 items-center">
          <img src="/images/tunas-ai-logo.png" alt="TUNAS" className="h-12 w-auto sm:h-14" />
        </a>
        <nav aria-label="Primary navigation">
          <div className="landing-nav-controls">
            <div className="landing-nav-links">
              <a href="#home">Home</a>
              <a href="#problem">Problem</a>
              <a href="#solution">Solution</a>
            </div>
            <Button asChild size="sm" className="landing-nav-action rounded-full px-4 sm:px-5">
              <Link to="/login">Open TUNAS <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </nav>
      </header>

      <div id="landing-content" className="landing-content">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-grid" aria-hidden="true" />
          <svg className="landing-path landing-path-hero" viewBox="0 0 800 580" fill="none" aria-hidden="true">
            <path d="M-10 134C125 70 190 214 310 164C425 116 419 277 532 239C651 199 674 343 816 284" />
            <path d="M-10 144C125 80 190 224 310 174C425 126 419 287 532 249C651 209 674 353 816 294" className="landing-path-shadow" />
            <circle cx="310" cy="164" r="9" /><circle cx="532" cy="239" r="9" />
          </svg>
          <Reveal className="landing-hero-copy">
            <p className="landing-kicker">SHALLOT HARVEST PLANNING FOR INDONESIAN FARMS</p>
            <h1 id="landing-title">Plan the harvest.<br /><em>Not the guesswork.</em></h1>
            <p className="landing-lede">TUNAS helps turn your field conditions, harvest deadline, weather context, and drying needs into a plan you can review with confidence.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
              <Button asChild size="lg" className="landing-primary-cta rounded-full px-7 shadow-lift">
                <Link to="/login">Open TUNAS <ArrowRight aria-hidden="true" /></Link>
              </Button>
              <span className="text-sm font-semibold text-forest-700/70">For farmers planning a shallot harvest</span>
            </div>
          </Reveal>
          <div className="landing-hero-companion">
            <Reveal className="landing-hero-note">
              <span className="landing-note-icon"><Sprout aria-hidden="true" /></span>
              <p><strong>Start with what you know.</strong><br />TUNAS keeps the farmer in charge of every plan.</p>
            </Reveal>
            <img src="/images/mascot-thinking.png" alt="" className="landing-mascot" aria-hidden="true" />
          </div>
        </section>

        <section id="problem" className="landing-section landing-problem" aria-labelledby="problem-heading">
          <Reveal className="landing-section-intro">
            <p className="landing-kicker">THE PROBLEM</p>
            <h2 id="problem-heading">The best harvest window is a moving target.</h2>
            <p>Shallot harvest timing carries real trade-offs. Conditions in the field, forecast shifts, market deadlines, and drying all have to work together.</p>
          </Reveal>
          <div className="landing-signal-list">
            {problemSignals.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} className="landing-signal" >
                <span className="landing-signal-index">0{index + 1}</span>
                <Icon className="h-6 w-6 text-harvest-700" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </Reveal>
            ))}
          </div>
          <img src="/images/mascot-shocked.png" alt="" className="landing-problem-mascot" aria-hidden="true" />
        </section>

        <section id="solution" className="landing-section landing-solution" aria-labelledby="solution-heading">
          <svg className="landing-path landing-path-solution" viewBox="0 0 800 700" fill="none" aria-hidden="true"><path d="M104 10C88 157 291 184 283 322C277 431 513 417 521 576C526 659 665 663 796 644" /><circle cx="283" cy="322" r="9" /><circle cx="521" cy="576" r="9" /></svg>
          <Reveal className="landing-section-intro landing-solution-intro">
            <p className="landing-kicker">THE SOLUTION</p>
            <h2 id="solution-heading">A clear path from field signals to harvest work.</h2>
            <p>TUNAS is an AI-assisted planning workspace built around your farm’s context—not a black box that makes decisions for you.</p>
          </Reveal>
          <div className="landing-plan-steps">
            {planSteps.map(({ icon: Icon, label, detail }, index) => (
              <Reveal key={label} className="landing-plan-step">
                <div className="landing-step-number">{index + 1}</div>
                <div className="landing-step-icon"><Icon aria-hidden="true" /></div>
                <div><h3>{label}</h3><p>{detail}</p></div>
              </Reveal>
            ))}
          </div>
          <Reveal className="landing-disclaimer"><ShieldCheck aria-hidden="true" /><p>AI-assisted estimates support planning; review every plan before you act.</p></Reveal>
        </section>

        <section className="landing-features" aria-labelledby="features-heading">
          <Reveal className="landing-features-intro">
            <p className="landing-kicker">WHAT TUNAS CAN DO</p>
            <h2 id="features-heading">A planning partner that stays close to the field.</h2>
            <p>TUNAS brings the changing details of a harvest into one reviewable plan, then helps you carry it forward.</p>
          </Reveal>
          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, title, detail }) => (
              <Reveal key={title} className="landing-feature-card">
                <span className="landing-feature-icon"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{detail}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="landing-features-cta">
            <Button asChild size="lg" className="rounded-full px-7 shadow-lift">
              <Link to="/login">Open TUNAS <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </Reveal>
          <img src="/images/mascot-eureka.png" alt="" className="landing-features-mascot" aria-hidden="true" />
        </section>
      </div>

      <footer className="landing-footer">
        <div className="landing-footer-content">
          <img src="/images/tunas-ai-logo-white.png" alt="TUNAS" className="h-10 w-auto" />
          <p>AI-assisted shallot harvest planning for Indonesian farms.</p>
          <Link to="/login" className="landing-footer-link">Open TUNAS <ArrowRight aria-hidden="true" /></Link>
        </div>
      </footer>
    </main>
  );
}
