import React from 'react';

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F5F5F3] p-4 md:p-6 items-center justify-center font-sans">
      <div className="flex w-full max-w-[1100px] h-[calc(100vh-3rem)] max-h-[850px] min-h-[600px] rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-100">
        
        {/* Left Panel (Dark) — 45% width */}
        <div className="hidden md:flex flex-col justify-between w-[45%] bg-[#1b1b1a] p-12 text-white">
          <div className="flex items-center gap-3 mt-4">
            <div className="w-3 h-3 rounded-full bg-[#18a098]"></div>
            <span className="font-bold text-xl tracking-wide select-none">QA Intelligence</span>
          </div>
          
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] mb-6 tracking-tight">
              AI-Powered<br />Defect Analysis
            </h1>
            <p className="text-gray-400 text-lg mb-10 max-w-sm leading-relaxed">
              Turn your historical bug data into actionable engineering insights.
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18a098]"></span>
                Defect pattern analysis
              </li>
              <li className="flex items-center gap-3 text-gray-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18a098]"></span>
                Regression risk predictor
              </li>
              <li className="flex items-center gap-3 text-gray-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18a098]"></span>
                AI-powered QA assistant
              </li>
            </ul>
          </div>
          
          <div>{/* Empty div for flex justify-between to work */}</div>
        </div>

        {/* Right Panel (Form) — 55% width */}
        <div className="w-full md:w-[55%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-8 overflow-y-auto">
          {children}
        </div>
        
      </div>
    </div>
  );
}
