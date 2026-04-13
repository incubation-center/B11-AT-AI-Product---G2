"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Bug,
  BarChart3,
  BotMessageSquare,
  FileText,
  Shield,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";

/* ─── Animated counter hook ─── */
function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let raf: number;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);      // easeOutCubic
      setCount(Math.round(ease * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return { count, ref };
}

/* ─── Scroll-reveal wrapper ─── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Floating bugs (hero decoration) ─── */
function FloatingBugs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Each bug floats with CSS keyframe offsets */}
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          className="absolute text-primary/[0.07] dark:text-primary/[0.10]"
          style={{
            left: `${10 + i * 11}%`,
            top: `${15 + (i % 3) * 25}%`,
            fontSize: `${18 + (i % 4) * 8}px`,
            animation: `floatBug ${5 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.45}s`,
          }}
        >
          <Bug className="w-[1em] h-[1em]" />
        </span>
      ))}
    </div>
  );
}

/* ─── Stat card (wraps useCounter so hooks aren't called in a loop) ─── */
function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="flex flex-col items-center gap-1 py-8">
      <span className="text-2xl font-bold text-primary sm:text-3xl tabular-nums">
        {count}{suffix}
      </span>
      <span className="text-xs text-muted-foreground sm:text-sm">{label}</span>
    </div>
  );
}

/* ─── Typewriter effect ─── */
function Typewriter({ words, typingSpeed = 100, deletingSpeed = 60, pauseMs = 2000 }: { words: string[]; typingSpeed?: number; deletingSpeed?: number; pauseMs?: number }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const tick = useCallback(() => {
    const current = words[wordIdx];
    if (!deleting) {
      setText(current.slice(0, text.length + 1));
      if (text.length + 1 === current.length) {
        setTimeout(() => setDeleting(true), pauseMs);
        return;
      }
    } else {
      setText(current.slice(0, text.length - 1));
      if (text.length - 1 === 0) {
        setDeleting(false);
        setWordIdx((prev) => (prev + 1) % words.length);
        return;
      }
    }
  }, [text, deleting, wordIdx, words, pauseMs]);

  useEffect(() => {
    const id = setTimeout(tick, deleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(id);
  }, [tick, deleting, deletingSpeed, typingSpeed]);

  return (
    <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
      {text}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
}

/* ─── Data ─── */
const features = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Deep-dive into severity distributions, resolution times, reopen rates, and module-level risk scores — all computed automatically.",
  },
  {
    icon: BotMessageSquare,
    title: "AI-Powered Insights",
    description:
      "Ask plain-English questions about your defect data and get instant, context-aware answers powered by AI and vector search.",
  },
  {
    icon: FileText,
    title: "Automated Reports",
    description:
      "Generate professional PDF, CSV, and Excel reports with a single click. Share findings with stakeholders effortlessly.",
  },
  {
    icon: Shield,
    title: "Quality Governance",
    description:
      "Track defect leakage, lifecycle compliance, and severity-resolution correlations to enforce quality gates.",
  },
];

const stats = [
  { value: 99, suffix: "%", label: "Accuracy" },
  { value: 6, suffix: "+", label: "Analytics Metrics" },
  { value: 3, suffix: "", label: "Export Formats" },
  { value: 10, suffix: "x", label: "Faster Insights" },
];

const heroWords = ["Actionable Insights", "Quality Confidence", "Smarter Decisions", "Faster Releases"];

/* ─── CSS keyframes (injected once) ─── */
const keyframes = `
@keyframes floatBug {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-18px) rotate(8deg); }
  50% { transform: translateY(-8px) rotate(-5deg); }
  75% { transform: translateY(-22px) rotate(3deg); }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

/* ─── Page ─── */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Inject keyframes */}
      <style>{keyframes}</style>

      {/* ───── Navbar ───── */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Bug className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">QA Analytics</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5 group/btn">
                Get Started
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative isolate pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Gradient blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-[120px] opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, transparent 60%)",
              animation: "gradientShift 8s ease infinite",
              backgroundSize: "200% 200%",
            }}
          />
          <div className="absolute top-60 -right-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        {/* Floating bugs */}
        <FloatingBugs />

        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              AI-Powered Defect Analytics
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              Turn Defect Data Into{" "}
              <br className="hidden sm:block" />
              <Typewriter words={heroWords} />
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Upload your test cases, and let AI reveal severity trends, quality
              risks, and resolution bottlenecks — so you can ship with confidence.
            </p>
          </Reveal>

          <Reveal delay={450}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 px-8 text-base shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───── Stats ribbon (animated counters) ───── */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* ───── Features ───── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need for QA Excellence
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                From raw defect data to executive-ready reports — one platform,
                zero guesswork.
              </p>
            </div>
          </Reveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <div
                  className="group relative rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-default"
                >
                  {/* Glow on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-3">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative isolate py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[100px]" />
        </div>

        <Reveal>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Elevate Your QA Process?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join teams that use AI to catch quality issues before they reach
              production.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 px-8 text-base shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Get Started — It&apos;s Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bug className="h-4 w-4" />
            <span>QA Analytics Platform</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} QA Analytics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
