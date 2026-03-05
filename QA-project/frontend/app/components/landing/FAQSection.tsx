"use client";

import React, { useState } from 'react';

export function FAQSection() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggleFaq = (index: number) => {
    setOpenIndexes(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const faqs = [
    {
      q: "How is this different from just using ChatGPT?",
      a: "ChatGPT has no idea what your bugs are. QA Intelligence is grounded in your actual defect history using a RAG (Retrieval-Augmented Generation) pipeline. Every answer comes from your data, not generic AI knowledge. You also get source citations showing exactly which records were used to generate the answer."
    },
    {
      q: "What file formats do you support for import?",
      a: "We support CSV, XLSX, and JSON exports. Any bug tracker that can export to these formats works — Jira, GitHub Issues, Linear, Azure DevOps, YouTrack, GitLab, and more. Our column mapping UI handles non-standard field names automatically."
    },
    {
      q: "Is my defect data secure and private?",
      a: "Yes. Your data is encrypted at rest and in transit. We never use your data to train shared models. Each team's data is isolated in its own vector namespace. Enterprise customers can opt for on-premise deployment for full data sovereignty."
    },
    {
      q: "How many defects do I need for it to work well?",
      a: "The system starts generating useful patterns from as few as 50–100 defects. The more historical data you upload, the more accurate the predictions. Teams with 6–12 months of defect history see the best results from the regression risk and pattern analysis features."
    },
    {
      q: "Can I integrate it directly with Jira instead of exporting?",
      a: "A native Jira integration is on our roadmap for Q3 2025. Currently, the easiest workflow is to export your Jira backlog as a CSV (takes 30 seconds) and upload it. We also offer a Slack bot integration on the Enterprise plan for querying from within your workflow."
    },
    {
      q: "What happens after my 14-day trial ends?",
      a: "You'll automatically drop to the free Starter plan (up to 500 defects, limited AI queries). Your data stays intact. You can upgrade to Team at any time to restore full access. No data is ever deleted unless you explicitly request it."
    }
  ];

  return (
    <section className="faq-section" id="faq">
      <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
        <span className="section-eyebrow">FAQ</span>
        <h2 className="section-title">Questions we<br /><em>always get asked</em></h2>
      </div>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className={`faq-item ${openIndexes.includes(index) ? 'open' : ''}`} 
            onClick={() => toggleFaq(index)}
          >
            <div className="faq-q">
              {faq.q} <span className="faq-icon">+</span>
            </div>
            <div className="faq-a">{faq.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
