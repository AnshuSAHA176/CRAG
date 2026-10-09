import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Zap } from 'lucide-react';

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const count = 1500;
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#8b5cf6" size={0.03} sizeAttenuation={true} depthWrite={false} />
    </Points>
  );
}

function KnowledgeNodes() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.1;
      group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
        <mesh position={[-1, 1, 0]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#8b5cf6" wireframe />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={2} floatIntensity={1}>
        <mesh position={[1, -0.5, 0]}>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#2dd4bf" wireframe />
        </mesh>
      </Float>
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1.5}>
        <mesh position={[0.5, 1.5, -1]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#3b82f6" wireframe />
        </mesh>
      </Float>
      {/* Central Node */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#000000" emissive="#4c1d95" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden selection:bg-primary/30">
      <header className="px-8 py-6 flex justify-between items-center z-10 border-b border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
          CRAG
        </div>
        <nav className="flex gap-4">
          <Link to="/login" className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">Log in</Link>
          <Link to="/register" className="px-4 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors">Start researching</Link>
        </nav>
      </header>

      <main className="flex-grow flex flex-col relative z-10">
        <div className="absolute inset-0 z-0 h-[600px] w-full">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#2dd4bf" />
            <Particles />
            <KnowledgeNodes />
          </Canvas>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        </div>

        <section className="container mx-auto px-6 pt-32 pb-24 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Next-Gen RAG Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-4xl leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-neutral-500">
            Corrective Retrieval.<br/>Grounded Answers.
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
            Upload documents, retrieve exact evidence, and automatically correct hallucinations. Build a secure knowledge graph with complete transparency.
          </p>
          <div className="flex gap-4">
            <Link to="/register" className="px-6 py-3 bg-white text-black font-medium rounded-xl hover:scale-105 transition-transform flex items-center gap-2">
              Start researching <Search className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="px-6 py-3 glass-panel rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2">
              Explore how it works
            </a>
          </div>
        </section>

        <section id="how-it-works" className="container mx-auto px-6 py-24 relative z-10 border-t border-white/5">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl glow-effect hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center mb-6">
                <Search className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Upload & Index</h3>
              <p className="text-neutral-400 leading-relaxed">
                Securely process your documents using pgvector embeddings. Your data is instantly searchable in a structured knowledge base.
              </p>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl glow-effect hover:-translate-y-1 transition-transform" style={{ transitionDelay: '50ms' }}>
              <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-blue-500 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Evaluate Evidence</h3>
              <p className="text-neutral-400 leading-relaxed">
                The engine evaluates retrieved documents for relevance. Weak evidence is flagged before generation even begins.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl glow-effect hover:-translate-y-1 transition-transform" style={{ transitionDelay: '100ms' }}>
              <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-yellow-500 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Correct & Generate</h3>
              <p className="text-neutral-400 leading-relaxed">
                Instead of hallucinating, the system corrects its retrieval strategy, then streams a verified, source-backed answer.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-neutral-500 bg-background relative z-10">
        <p>&copy; {new Date().getFullYear()} CRAG Workstation. Engineered for truth.</p>
      </footer>
    </div>
  );
};

export default LandingPage;