import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Zap, Search, ArrowRight, ShieldCheck } from 'lucide-react';

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return Math.min(Math.max(((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin, Math.min(outMin, outMax)), Math.max(outMin, outMax));
};

const getOpacity = (p: number, startIn: number, endIn: number, startOut: number, endOut: number) => {
  if (p < startIn) return 0;
  if (p >= startIn && p <= endIn) return startIn === endIn ? 1 : mapRange(p, startIn, endIn, 0, 1);
  if (p > endIn && p < startOut) return 1;
  if (p >= startOut && p < endOut) return mapRange(p, startOut, endOut, 1, 0);
  return 0;
};

const Loader = ({ onComplete }: { onComplete: () => void }) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const duration = prefersReducedMotion ? 500 : 1800;
    const timer = setTimeout(() => {
      document.body.style.overflow = '';
      onComplete();
    }, duration);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [onComplete, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center animate-[fadeOut_0.5s_ease-out_forwards]">
        <div className="font-bold text-xl tracking-tighter flex items-center gap-2 text-white">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
          CRAG
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center pointer-events-none" style={{ animation: 'loader-overlay 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
      <style>{`
        @keyframes loader-logo {
          0% { opacity: 0; transform: scale(0.95); }
          10% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
        @keyframes loader-doc {
          0%, 15% { opacity: 0; transform: translateY(20px); }
          25% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; }
        }
        @keyframes scanner {
          0%, 25% { top: 0; opacity: 0; }
          30% { opacity: 1; }
          50% { top: 100%; opacity: 0; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes loader-text-1 {
          0%, 25% { opacity: 0; transform: scaleX(0); }
          35%, 100% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes loader-text-2 {
          0%, 30% { opacity: 0; transform: scaleX(0); }
          40%, 100% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes loader-text-3 {
          0%, 35% { opacity: 0; transform: scaleX(0); }
          45%, 100% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes loader-highlight {
          0%, 50% { border-color: transparent; background: transparent; }
          55%, 100% { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.1); }
        }
        @keyframes connect-line {
          0%, 55% { width: 0; opacity: 0; }
          60% { opacity: 1; width: 0; }
          70%, 100% { opacity: 1; width: 60px; }
        }
        @keyframes answer-indicator {
          0%, 65% { opacity: 0; transform: translateX(-10px); }
          75%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes loader-overlay {
          0%, 80% { opacity: 1; pointer-events: auto; background: #050505; }
          100% { opacity: 0; pointer-events: none; background: transparent; }
        }
      `}</style>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="absolute font-bold text-2xl tracking-tighter flex items-center gap-2 text-white z-50" style={{ animation: 'loader-logo 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <div className="w-2.5 h-2.5 bg-primary rounded-full" />
          </div>
          CRAG
        </div>

        <div className="absolute flex items-center justify-center -mt-20" style={{ animation: 'loader-doc 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
           <div className="relative w-72 h-96 bg-neutral-900 border border-neutral-700/80 rounded-xl p-8 shadow-2xl overflow-hidden flex flex-col gap-4 z-20">
             <div className="absolute left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_rgba(139,92,246,1)] z-30" style={{ animation: 'scanner 1.8s linear forwards' }} />
             
             <div className="w-1/3 h-5 bg-neutral-800 rounded-md mb-6 origin-left" style={{ animation: 'loader-text-1 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>
             <div className="w-full h-3 bg-neutral-800/80 rounded-md origin-left" style={{ animation: 'loader-text-2 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>
             
             <div className="relative flex flex-col gap-4">
               <div className="absolute -inset-x-3 -inset-y-2 rounded-md border" style={{ animation: 'loader-highlight 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>
               <div className="w-5/6 h-3 bg-neutral-800/80 rounded-md origin-left relative z-10" style={{ animation: 'loader-text-2 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>
               <div className="w-full h-3 bg-neutral-800/80 rounded-md origin-left relative z-10" style={{ animation: 'loader-text-3 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>
             </div>
             
             <div className="w-4/5 h-3 bg-neutral-800/80 rounded-md origin-left" style={{ animation: 'loader-text-3 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>
             <div className="w-3/4 h-3 bg-neutral-800/80 rounded-md origin-left" style={{ animation: 'loader-text-3 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>
             <div className="w-full h-3 bg-neutral-800/80 rounded-md origin-left" style={{ animation: 'loader-text-3 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>
           </div>

           <div className="absolute left-[calc(50%+144px)] top-1/2 -translate-y-1/2 h-[2px] bg-primary/60 z-10 origin-left" style={{ animation: 'connect-line 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}></div>

           <div className="absolute left-[calc(50%+204px)] top-1/2 -translate-y-1/2 bg-neutral-900 border border-primary/40 rounded-lg p-3 shadow-[0_0_30px_rgba(139,92,246,0.3)] flex items-center gap-3 w-40 z-20" style={{ animation: 'answer-indicator 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/40 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                 <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <div className="w-full h-1.5 bg-neutral-700 rounded-sm"></div>
                <div className="w-3/4 h-1.5 bg-neutral-700 rounded-sm"></div>
              </div>
           </div>
        </div>
      </div>
      
      <button 
        onClick={onComplete}
        className="absolute bottom-8 px-4 py-2 text-neutral-500 hover:text-white text-sm transition-colors z-[110] pointer-events-auto bg-[#050505]/50 rounded-md"
      >
        Skip intro
      </button>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const s1Ref = useRef<HTMLDivElement>(null);
  const s2Ref = useRef<HTMLDivElement>(null);
  const s3Ref = useRef<HTMLDivElement>(null);
  const s4Ref = useRef<HTMLDivElement>(null);
  const s5Ref = useRef<HTMLDivElement>(null);
  const s6Ref = useRef<HTMLDivElement>(null);

  const visDocRef = useRef<HTMLDivElement>(null);
  const chunk1Ref = useRef<HTMLDivElement>(null);
  const chunk2Ref = useRef<HTMLDivElement>(null);
  const chunk3Ref = useRef<HTMLDivElement>(null);

  const visVectorsRef = useRef<HTMLDivElement>(null);
  const visSearchRef = useRef<HTMLDivElement>(null);
  const visAnswerRef = useRef<HTMLDivElement>(null);

  const [showLoader, setShowLoader] = useState(() => {
    return !sessionStorage.getItem('hasSeenIntro');
  });

  const handleLoaderComplete = () => {
    setShowLoader(false);
    sessionStorage.setItem('hasSeenIntro', 'true');
  };

  useEffect(() => {
    let rAF: number;
    const onScroll = () => {
      rAF = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const totalScroll = rect.height - windowHeight;
        const currentScroll = -rect.top;
        const p = Math.max(0, Math.min(1, currentScroll / totalScroll));

        // Text animations
        if (s1Ref.current) {
          s1Ref.current.style.opacity = getOpacity(p, 0, 0, 0.1, 0.15).toString();
          s1Ref.current.style.transform = `translateY(${mapRange(p, 0, 0.15, 0, -30)}px)`;
        }
        if (s2Ref.current) {
          s2Ref.current.style.opacity = getOpacity(p, 0.15, 0.2, 0.3, 0.35).toString();
          s2Ref.current.style.transform = `translateY(${mapRange(p, 0.15, 0.35, 30, -30)}px)`;
        }
        if (s3Ref.current) {
          s3Ref.current.style.opacity = getOpacity(p, 0.35, 0.4, 0.5, 0.55).toString();
          s3Ref.current.style.transform = `translateY(${mapRange(p, 0.35, 0.55, 30, -30)}px)`;
        }
        if (s4Ref.current) {
          s4Ref.current.style.opacity = getOpacity(p, 0.55, 0.6, 0.7, 0.75).toString();
          s4Ref.current.style.transform = `translateY(${mapRange(p, 0.55, 0.75, 30, -30)}px)`;
        }
        if (s5Ref.current) {
          s5Ref.current.style.opacity = getOpacity(p, 0.75, 0.8, 0.85, 0.9).toString();
          s5Ref.current.style.transform = `translateY(${mapRange(p, 0.75, 0.9, 30, -30)}px)`;
        }
        if (s6Ref.current) {
          s6Ref.current.style.opacity = getOpacity(p, 0.9, 0.95, 1, 1).toString();
          s6Ref.current.style.transform = `translateY(${mapRange(p, 0.9, 1, 30, 0)}px)`;
          s6Ref.current.style.pointerEvents = p > 0.9 ? 'auto' : 'none';
        }

        // Visuals
        if (visDocRef.current) {
          const op = getOpacity(p, 0, 0, 0.3, 0.35);
          const scale = mapRange(p, 0, 0.15, 0.8, 1);
          const y = mapRange(p, 0, 0.35, 20, -20);
          visDocRef.current.style.opacity = op.toString();
          visDocRef.current.style.transform = `translateY(${y}px) scale(${scale})`;
        }

        if (chunk1Ref.current && chunk2Ref.current && chunk3Ref.current) {
          const separation = mapRange(p, 0.15, 0.35, 0, 80);
          const splitOp = mapRange(p, 0.15, 0.25, 1, 0.5);
          chunk1Ref.current.style.transform = `translateY(-${separation}px) scale(0.95)`;
          chunk1Ref.current.style.opacity = splitOp.toString();
          chunk2Ref.current.style.transform = `translateY(0px)`;
          chunk3Ref.current.style.transform = `translateY(${separation}px) scale(1.05)`;
          chunk3Ref.current.style.opacity = splitOp.toString();
        }

        if (visVectorsRef.current) {
          const op = getOpacity(p, 0.35, 0.4, 0.5, 0.55);
          const scale = mapRange(p, 0.35, 0.55, 0.8, 1.2);
          visVectorsRef.current.style.opacity = op.toString();
          visVectorsRef.current.style.transform = `scale(${scale})`;
        }

        if (visSearchRef.current) {
          const op = getOpacity(p, 0.55, 0.6, 0.7, 0.75);
          const y = mapRange(p, 0.55, 0.75, 20, -20);
          visSearchRef.current.style.opacity = op.toString();
          visSearchRef.current.style.transform = `translateY(${y}px)`;
        }

        if (visAnswerRef.current) {
          const op = getOpacity(p, 0.75, 0.8, 0.85, 0.9);
          const y = mapRange(p, 0.75, 0.9, 40, 0);
          visAnswerRef.current.style.opacity = op.toString();
          visAnswerRef.current.style.transform = `translateY(${y}px)`;
        }

      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rAF);
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-[#050505] text-white min-h-[600vh] relative selection:bg-primary/30 font-sans">
      
      {showLoader && <Loader onComplete={handleLoaderComplete} />}

      {/* Header */}
      <header className="fixed top-0 w-full px-8 py-6 flex justify-between items-center z-50 mix-blend-difference pointer-events-auto">
        <div className="font-bold text-xl tracking-tighter flex items-center gap-2 text-white">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
          CRAG
        </div>
        <nav className="flex gap-4">
          <Link to="/login" className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors">Log in</Link>
          <Link to="/register" className="px-4 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors">Get Started</Link>
        </nav>
      </header>

      {/* Sticky Story Canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

        {/* Text Layers */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 px-6">
          <div ref={s1Ref} className="absolute text-center max-w-3xl opacity-0 flex flex-col items-center justify-center drop-shadow-2xl">
             <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Your answers are buried in your documents.</h2>
             <p className="text-xl md:text-2xl text-neutral-400">Pages of information. Important details. Answers you know are somewhere in there.</p>
          </div>
          
          <div ref={s2Ref} className="absolute text-center max-w-3xl opacity-0 drop-shadow-2xl mt-64">
             <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">First, CRAG reads and organizes your documents.</h2>
          </div>
          
          <div ref={s3Ref} className="absolute text-center max-w-3xl opacity-0 drop-shadow-2xl mt-64">
             <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Meaning becomes something the system can search.</h2>
          </div>
          
          <div ref={s4Ref} className="absolute text-center max-w-3xl opacity-0 drop-shadow-2xl mb-64">
             <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Ask a question. Find the information that matters.</h2>
          </div>
          
          <div ref={s5Ref} className="absolute text-center max-w-3xl opacity-0 drop-shadow-2xl mb-80">
             <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">From scattered pages to a clear answer.</h2>
          </div>
          
          <div ref={s6Ref} className="absolute text-center max-w-3xl opacity-0 pointer-events-none drop-shadow-2xl">
             <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">Your knowledge. Ready when you are.</h2>
             <p className="text-xl md:text-2xl text-neutral-400 mb-12">Bring your documents together and make their knowledge easier to explore.</p>
             <div className="flex justify-center gap-6 pointer-events-auto">
               <Link to="/register" className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                 Get Started <ArrowRight className="w-5 h-5" />
               </Link>
               <Link to="/workspace" className="px-8 py-4 bg-neutral-900 border border-neutral-700 text-white font-medium rounded-xl hover:bg-neutral-800 transition-colors">
                 Explore the Experience
               </Link>
             </div>
          </div>
        </div>

        {/* Visual Layers */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
           
           {/* Visual 1 & 2: Document -> Chunks */}
           <div ref={visDocRef} className="absolute flex items-center justify-center opacity-0 -mt-20">
              <div className="relative w-72 h-96">
                 {[3, 2, 1].map((i) => (
                    <div 
                       key={i} 
                       ref={i === 1 ? chunk1Ref : i === 2 ? chunk2Ref : chunk3Ref} 
                       className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-xl p-8 shadow-2xl flex flex-col gap-4 transform-gpu"
                       style={{ zIndex: 10 - i }}
                    >
                       <div className="w-1/3 h-5 bg-neutral-800 rounded-md mb-6"></div>
                       <div className="w-full h-3 bg-neutral-800/80 rounded-md"></div>
                       <div className="w-5/6 h-3 bg-neutral-800/80 rounded-md"></div>
                       <div className="w-full h-3 bg-neutral-800/80 rounded-md"></div>
                       <div className="w-4/5 h-3 bg-neutral-800/80 rounded-md"></div>
                       <div className="w-3/4 h-3 bg-neutral-800/80 rounded-md"></div>
                       <div className="w-full h-3 bg-neutral-800/80 rounded-md"></div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Visual 3: Vectors */}
           <div ref={visVectorsRef} className="absolute inset-0 flex items-center justify-center opacity-0 -mt-20">
              <div className="relative w-[600px] h-[600px]">
                 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible opacity-60">
                    <g stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" fill="none">
                       <line x1="10" y1="50" x2="90" y2="50" />
                       <line x1="50" y1="10" x2="50" y2="90" />
                       <line x1="20" y1="20" x2="80" y2="80" />
                       <line x1="20" y1="80" x2="80" y2="20" />
                       <circle cx="50" cy="50" r="20" />
                       <circle cx="50" cy="50" r="35" strokeDasharray="1 2" />
                    </g>
                    <g fill="#8b5cf6">
                       <circle cx="40" cy="40" r="1.5" className="animate-pulse" />
                       <circle cx="65" cy="30" r="2" />
                       <circle cx="30" cy="70" r="1" />
                       <circle cx="75" cy="65" r="1.5" />
                       <circle cx="50" cy="50" r="2.5" className="animate-pulse" />
                    </g>
                    <g fill="#ffffff">
                       <circle cx="45" cy="25" r="1" />
                       <circle cx="60" cy="80" r="1" />
                       <circle cx="20" cy="50" r="1.5" />
                       <circle cx="80" cy="40" r="1" />
                       <circle cx="35" cy="60" r="1" />
                    </g>
                    <path d="M 40 40 L 50 50 L 65 30" stroke="#8b5cf6" strokeWidth="0.5" strokeDasharray="1 1" fill="none" opacity="0.8" />
                    <path d="M 30 70 L 50 50 L 75 65" stroke="#8b5cf6" strokeWidth="0.3" strokeDasharray="1 2" fill="none" opacity="0.4" />
                 </svg>
              </div>
           </div>

           {/* Visual 4: Search & Retrieval */}
           <div ref={visSearchRef} className="absolute inset-0 flex flex-col items-center justify-center opacity-0 mt-32 gap-10">
              <div className="bg-neutral-900 border border-primary/40 rounded-full px-8 py-4 shadow-[0_0_40px_rgba(139,92,246,0.3)] z-20">
                 <span className="text-white font-medium text-lg flex items-center gap-3">
                   <Search className="w-5 h-5 text-primary" />
                   "What does my document say about this topic?"
                 </span>
              </div>
              <div className="relative w-80 h-40">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-primary/80 to-transparent"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-neutral-900 border-2 border-primary/60 rounded-xl p-4 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                    <div className="w-full h-2 bg-primary/40 rounded-sm mb-3"></div>
                    <div className="w-5/6 h-2 bg-primary/40 rounded-sm mb-3"></div>
                    <div className="w-4/5 h-2 bg-primary/40 rounded-sm"></div>
                    <div className="text-xs text-primary mt-4 flex items-center gap-1 font-medium"><FileText className="w-3 h-3" /> Source Passage</div>
                 </div>
              </div>
           </div>

           {/* Visual 5: The Answer */}
           <div ref={visAnswerRef} className="absolute inset-0 flex items-center justify-center opacity-0 mt-32">
              <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/80 rounded-2xl p-8 max-w-2xl w-full shadow-2xl mx-6">
                 <div className="flex items-start gap-5 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                       <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-medium text-white mb-3">Generated Answer</h4>
                      <p className="text-base text-neutral-300 leading-relaxed">
                        Based on the retrieved context, the system extracts precise segments from your files and synthesizes them into a coherent answer. This completely eliminates hallucinations, as every claim is strictly grounded in the provided document chunks.
                      </p>
                    </div>
                 </div>
                 <div className="border-t border-neutral-800/80 pt-5 flex items-center justify-between">
                    <div className="flex gap-3">
                       <span className="text-xs px-3 py-1.5 bg-neutral-800/80 rounded-md border border-neutral-700 text-neutral-300 flex items-center gap-2 shadow-sm">
                          <FileText className="w-3.5 h-3.5 text-neutral-400" /> architecture.pdf
                       </span>
                       <span className="text-xs px-3 py-1.5 bg-neutral-800/80 rounded-md border border-neutral-700 text-neutral-300 flex items-center gap-2 shadow-sm">
                          <FileText className="w-3.5 h-3.5 text-neutral-400" /> user_manual.txt
                       </span>
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Grounded
                    </div>
                 </div>
              </div>
           </div>

        </div>

      </div>

    </div>
  );
};

export default LandingPage;