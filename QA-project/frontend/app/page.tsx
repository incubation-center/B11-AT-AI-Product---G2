"use client";

import React, { useEffect } from "react";

import { Navbar } from "./components/landing/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { LogosStrip } from "./components/landing/LogosStrip";
import { ProblemSection } from "./components/landing/ProblemSection";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { HowItWorksSection } from "./components/landing/HowItWorksSection";
import { DemoSection } from "./components/landing/DemoSection";
import { PricingSection } from "./components/landing/PricingSection";
import { TestimonialSection } from "./components/landing/TestimonialSection";
import { FAQSection } from "./components/landing/FAQSection";
import { CTABanner } from "./components/landing/CTABanner";
import { Footer } from "./components/landing/Footer";

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 },
    );

    const elSelector =
      ".feat-card, .step-item, .testi-card, .prob-item, .price-card, .dq-item";
    const elements = document.querySelectorAll(elSelector);

    elements.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = "0";
      htmlEl.style.transform = "translateY(24px)";
      htmlEl.style.transition = `opacity .5s ${i * 0.07}s ease, transform .5s ${i * 0.07}s ease`;
      observer.observe(htmlEl);
    });

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <LogosStrip />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <PricingSection />
      <TestimonialSection />
      <FAQSection />
      <CTABanner />
      <Footer />
    </div>
  );
}
