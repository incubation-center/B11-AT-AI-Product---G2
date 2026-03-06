import React from "react";

export function TestimonialSection() {
  return (
    <section className="testi-section">
      <div
        style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}
      >
        <span className="section-eyebrow">What teams say</span>
        <h2 className="section-title">
          QA teams that stopped
          <br />
          <em>guessing and started knowing</em>
        </h2>
      </div>
      <div className="testi-grid">
        <div className="testi-card">
          <div className="testi-stars flex gap-1 text-[#e8930a] mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <div className="testi-quote">
            &quot;We cut our regression bugs by 60% in the first release cycle.
            The AI correctly predicted that our Auth module was high-risk
            &mdash; and it was right.&quot;
          </div>
          <div className="testi-author">
            <div className="testi-av" style={{ background: "var(--teal)" }}>
              SK
            </div>
            <div>
              <div className="testi-name">Sarah K.</div>
              <div className="testi-role">QA Lead &middot; Fintech startup</div>
            </div>
          </div>
        </div>
        <div className="testi-card">
          <div className="testi-stars flex gap-1 text-[#e8930a] mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <div className="testi-quote">
            &quot;Finally, our bug history is useful instead of just taking up
            space in Jira. The test coverage gap feature alone justified the
            subscription.&quot;
          </div>
          <div className="testi-author">
            <div className="testi-av" style={{ background: "var(--blue)" }}>
              MP
            </div>
            <div>
              <div className="testi-name">Marcus P.</div>
              <div className="testi-role">
                Senior QA Engineer &middot; SaaS company
              </div>
            </div>
          </div>
        </div>
        <div className="testi-card">
          <div className="testi-stars flex gap-1 text-[#e8930a] mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <div className="testi-quote">
            &quot;The AI Chat is shockingly accurate. I asked about recurring
            patterns after our last major refactor and it pulled up the exact
            same bugs our team was worried about.&quot;
          </div>
          <div className="testi-author">
            <div className="testi-av" style={{ background: "var(--violet)" }}>
              AT
            </div>
            <div>
              <div className="testi-name">Aisha T.</div>
              <div className="testi-role">
                Engineering Manager &middot; Scale-up
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
