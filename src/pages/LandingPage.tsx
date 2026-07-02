import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Compass, ArrowRight, Shield, Zap, Activity, Monitor, Globe, 
  Cpu, Terminal, Sparkles, RefreshCw, CheckCircle, ExternalLink, ArrowDownCircle, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import orionLogo from '../assets/images/orion_logo_1783011957450.jpg';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Custom 3D Mathematical Block Ledger Model
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 650);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 650;
    };
    window.addEventListener('resize', handleResize);

    // 3D Cube vertices
    const size = Math.min(width, height) * 0.15;
    const vertices = [
      { x: -size, y: -size, z: -size },
      { x: size, y: -size, z: -size },
      { x: size, y: size, z: -size },
      { x: -size, y: size, z: -size },
      { x: -size, y: -size, z: size },
      { x: size, y: -size, z: size },
      { x: size, y: size, z: size },
      { x: -size, y: size, z: size },
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // back face
      [4, 5], [5, 6], [6, 7], [7, 4], // front face
      [0, 4], [1, 5], [2, 6], [3, 7]  // depth lines
    ];

    // Orbiting particle fields
    interface Particle {
      x: number;
      y: number;
      z: number;
      ox: number;
      oy: number;
      oz: number;
      size: number;
      speed: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = size * (1.5 + Math.random() * 1.5);
      particles.push({
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * size * 2,
        z: Math.sin(angle) * radius,
        ox: Math.cos(angle) * radius,
        oy: (Math.random() - 0.5) * size * 2,
        oz: Math.sin(angle) * radius,
        size: Math.random() * 2 + 1,
        speed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    let angleX = 0.005;
    let angleY = 0.008;

    // Interactive Projection Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Grid Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSpacing = 50;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const cx = width / 2;
      const cy = height / 2;

      // Rotate based on mouse coordinates relative to center
      const targetAngleX = (mousePos.y / height - 0.5) * 1.2;
      const targetAngleY = (mousePos.x / width - 0.5) * 1.2;

      angleX += (targetAngleX - angleX) * 0.05;
      angleY += (targetAngleY - angleY) * 0.05;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Render 3D Cube Edges
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;

      const projectedVertices = vertices.map((v) => {
        // Rotate Y
        let x1 = v.x * cosY - v.z * sinY;
        let z1 = v.x * sinY + v.z * cosY;

        // Rotate X
        let y2 = v.y * cosX - z1 * sinX;
        let z2 = v.y * sinX + z1 * cosX;

        // Perspective division
        const perspective = 450;
        const scale = perspective / (perspective + z2);
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          z: z2,
          scale
        };
      });

      // Draw cube lines
      edges.forEach(([p1, p2]) => {
        const pt1 = projectedVertices[p1];
        const pt2 = projectedVertices[p2];

        // Fade out lines that are deep in the background
        const avgZ = (pt1.z + pt2.z) / 2;
        const opacity = Math.max(0.05, 0.4 - (avgZ / (size * 3.5)));

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
      });

      // Draw cube corners (nodes)
      projectedVertices.forEach((pt) => {
        const opacity = Math.max(0.1, 0.6 - (pt.z / (size * 3)));
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = pt.scale * 8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.scale * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Update and Draw Orbiting Particles (blocks floating around main ledger)
      particles.forEach((p) => {
        // Update angle orbit
        const theta = Math.atan2(p.oz, p.ox) + p.speed;
        const r = Math.hypot(p.ox, p.oz);
        p.ox = Math.cos(theta) * r;
        p.oz = Math.sin(theta) * r;

        // Rotate Y
        let x1 = p.ox * cosY - p.oz * sinY;
        let z1 = p.ox * sinY + p.oz * cosY;

        // Rotate X
        let y2 = p.oy * cosX - z1 * sinX;
        let z2 = p.oy * sinX + z1 * cosX;

        const scale = 450 / (450 + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        const opacity = Math.max(0.1, 0.5 - (z2 / (size * 4)));
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fill();

        // Trace tiny connections between particles and cube if close
        projectedVertices.forEach((pt) => {
          const dist = Math.hypot(px - pt.x, py - pt.y);
          if (dist < 70) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * (1 - dist / 70)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
          }
        });
      });

      // Center holographic wireframe globe halo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 1.6, 0, Math.PI * 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npm i @stellar/freighter-api');
    toast.success('SDK command copied to clipboard!');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="min-h-screen text-gray-100 immersive-bg font-sans overflow-x-hidden relative selection:bg-white selection:text-black"
      onMouseMove={handleMouseMove}
    >
      {/* Absolute Noir ambient background textures */}
      <div className="absolute top-0 left-0 w-full h-[85vh] z-0 opacity-40 pointer-events-none overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Elegant thin top white accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent relative z-20"></div>

      {/* Header Bar */}
      <header className="max-w-7xl mx-auto h-24 px-6 lg:px-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <img 
            src={orionLogo} 
            alt="Orion Logo" 
            className="w-9 h-9 rounded-full border border-white/20 object-cover shadow-[0_0_15px_rgba(255,255,255,0.35)]"
            referrerPolicy="no-referrer"
          />
          <span className="text-lg font-bold tracking-widest text-white font-display">
            ORION<span className="text-gray-400 font-light"> TERMINAL</span>
          </span>
        </div>

        {/* Dynamic Nav elements with smooth scrolls */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-gray-400">
          <button 
            onClick={() => scrollToSection('features')} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            Surveillance
          </button>
          <button 
            onClick={() => scrollToSection('interactive-demo')} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            Faucet Sandbox
          </button>
          <button 
            onClick={() => scrollToSection('architecture')} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            Architecture
          </button>
          <a 
            href="https://developers.stellar.org/" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            SDF Docs <ExternalLink size={10} />
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/terminal"
            className="flex items-center gap-1.5 px-4 py-2 border border-white hover:bg-white hover:text-black text-white text-[10px] font-mono tracking-widest uppercase transition-all"
          >
            LAUNCH TERMINAL
            <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      {/* Redesigned Hero Section - Dynamic Startup style */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-20 md:pt-16 md:pb-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                <Sparkles size={11} className="animate-pulse" />
                NON-CUSTODIAL MONITOR &bull; VER V3.0
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></span>
                MADE BY ARPAN ROY
              </div>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-6xl tracking-tighter text-white leading-none uppercase">
              DECENTRALIZED <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
                LEDGER INTELLIGENCE
              </span>
            </h1>

            <p className="text-gray-400 text-xs sm:text-sm max-w-xl font-mono leading-relaxed">
              Verify transactions, monitor multiple on-chain balances, and authorize payments securely on the SDF Testnet using Freighter API protocol. High contrast, zero-fluff, pure functionality.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link
                to="/terminal"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-black font-bold text-xs font-mono tracking-widest uppercase hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] text-center"
              >
                <Terminal size={14} />
                ENTER TERMINAL CONSUL
              </Link>

              <button
                onClick={() => scrollToSection('interactive-demo')}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-transparent border border-white/20 text-white hover:border-white font-bold text-xs font-mono tracking-widest uppercase transition-all text-center cursor-pointer"
              >
                TESTNET SANDBOX DEMO
              </button>
            </div>

            {/* Micro Telemetry stats */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-white/5 max-w-lg">
              <div>
                <span className="block text-[9px] font-mono text-gray-500 font-bold tracking-widest">NETWORK RATE</span>
                <span className="text-base font-extrabold text-white font-display">100% SECURE</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-gray-500 font-bold tracking-widest">PROPAGATION</span>
                <span className="text-base font-extrabold text-white font-display">&lt; 5.0s LAT</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-gray-500 font-bold tracking-widest">COMMISSIONS</span>
                <span className="text-base font-extrabold text-white font-display">0.00001 XLM</span>
              </div>
            </div>
          </div>

          {/* Hero Right Graphic - Embedded image with neat futuristic frame */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent blur-2xl pointer-events-none rounded-2xl"></div>
            <div className="p-1 rounded-[16px] bg-gradient-to-b from-white/20 to-transparent border border-white/10 relative z-10 shadow-2xl">
              <div className="rounded-[12px] overflow-hidden bg-black aspect-[16/10] relative group">
                <img 
                  src="/src/assets/images/ledger_grid_monochrome_1783009823001.jpg" 
                  alt="Stellar Decentralized Ledger Scheme" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700 filter grayscale"
                />
                
                {/* Visual interface elements on top of the image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 backdrop-blur-md rounded border border-white/10 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span className="text-white">NODE_LEDGER_GRID.DAT</span>
                  </div>
                  <span className="text-gray-500">ACTIVE SCHEMATIC</span>
                </div>
              </div>
            </div>

            {/* Absolute visual anchors */}
            <div className="absolute top-[-20px] left-[-20px] w-8 h-8 border-t-2 border-l-2 border-white/40 pointer-events-none"></div>
            <div className="absolute bottom-[-20px] right-[-20px] w-8 h-8 border-b-2 border-r-2 border-white/40 pointer-events-none"></div>
          </div>

        </div>
      </section>

      {/* Bento Grid Features Layout - Stark monochrome */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative z-10 border-t border-white/5">
        <div className="text-center space-y-2 mb-16">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">CORE CAPABILITIES</span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-tight">
            DECENTRALIZED WORKSTATION FEATURES
          </h2>
          <p className="text-gray-400 text-xs max-w-md mx-auto font-mono">
            Pure on-chain logic, high-performance sequence tracking, and frictionless testnet faucet triggers.
          </p>
        </div>

        {/* The Bento Grid */}
        <div id="architecture" className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Live account stream (8 Cols) */}
          <div className="md:col-span-8 p-8 rounded bg-white/[0.02] border border-white/10 flex flex-col justify-between hover:border-white transition-all group min-h-[350px]">
            <div>
              <div className="w-10 h-10 rounded bg-white/5 border border-white/10 text-white flex items-center justify-center mb-6">
                <Activity size={18} />
              </div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
                Direct Horizon Node Synchronization
              </h3>
              <p className="text-gray-400 text-xs mt-2 max-w-md leading-relaxed font-mono">
                Connect your secure browser wallet to instantly load account balances, registered transaction arrays, subentries count, and unique sequence ids.
              </p>
            </div>

            {/* Custom Interactive Telemetry Graphics inside Card */}
            <div className="mt-8 p-4 rounded bg-black/60 border border-white/5 font-mono text-[10px] text-gray-400 space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-1 text-white">
                <span>GATEWAY_INTERFACE: READY</span>
                <span className="animate-pulse">● RPC CONNECTED</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-gray-500">LEDGER INDEX:</span> <span className="text-white">ACTIVE</span>
                </div>
                <div>
                  <span className="text-gray-500">SEQUENCE NO:</span> <span className="text-white">201,482,913</span>
                </div>
                <div>
                  <span className="text-gray-500">VALIDATORS:</span> <span className="text-white">ONLINE</span>
                </div>
                <div>
                  <span className="text-gray-500">PROPAGATION:</span> <span className="text-white">0.0001 XLM FEE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: 100% Non-Custodial (4 Cols) */}
          <div className="md:col-span-4 p-8 rounded bg-white/[0.02] border border-white/10 flex flex-col justify-between hover:border-white transition-all group min-h-[350px]">
            <div>
              <div className="w-10 h-10 rounded bg-white/5 border border-white/10 text-white flex items-center justify-center mb-6">
                <Shield size={18} />
              </div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
                100% Cryptographic Safeguards
              </h3>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed font-mono">
                No storage. No cloud servers holding keys. All envelopes are built locally on-chain and authenticated natively inside the Freighter extension.
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white">
              <span>CIPHER MODE</span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20">ED25519 Keys</span>
            </div>
          </div>

          {/* Card 3: Watchlist Surveillance (4 Cols) */}
          <div className="md:col-span-4 p-8 rounded bg-white/[0.02] border border-white/10 flex flex-col justify-between hover:border-white transition-all group min-h-[340px]">
            <div>
              <div className="w-10 h-10 rounded bg-white/5 border border-white/10 text-white flex items-center justify-center mb-6">
                <Monitor size={18} />
              </div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
                Multi-Account Tracker
              </h3>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed font-mono">
                Store up to dozens of cold storage vaults, target receiving nodes, or public addresses in your workspace using safe localStorage.
              </p>
            </div>

            <div className="space-y-1 text-[10px] font-mono mt-6">
              <div className="flex justify-between text-gray-500 uppercase font-bold text-[8px] tracking-wider mb-1">
                <span>LOCAL WATCHLIST</span>
                <span>STATE</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-300">Savings Vault</span>
                <span className="text-white font-bold">14,891 XLM</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-300">Hot Wallet</span>
                <span className="text-white font-bold">120.00 XLM</span>
              </div>
            </div>
          </div>

          {/* Card 4: Faucet & Cli Command Card (8 Cols) */}
          <div className="md:col-span-8 p-8 rounded bg-white/[0.02] border border-white/10 flex flex-col justify-between hover:border-white transition-all group min-h-[340px] relative overflow-hidden">
            <div>
              <div className="w-10 h-10 rounded bg-white/5 border border-white/10 text-white flex items-center justify-center mb-6">
                <Cpu size={18} />
              </div>
              <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
                Official Freighter Integration
              </h3>
              <p className="text-gray-400 text-xs mt-2 max-w-lg leading-relaxed font-mono">
                Leverages the official SDF developer library. Integrate directly into your node script and start calling secure network procedures instantly.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 bg-black/60 border border-white/5 rounded px-4 py-3 font-mono text-xs text-gray-300 flex items-center justify-between gap-3 overflow-x-auto">
                <span className="shrink-0 text-gray-500">$</span>
                <span className="truncate">npm i @stellar/freighter-api</span>
              </div>
              <button
                onClick={handleCopyCli}
                className="px-5 py-3 rounded bg-white hover:bg-gray-200 text-black font-mono font-bold text-[10px] tracking-wider uppercase transition-all shrink-0 cursor-pointer text-center"
              >
                COPY PACKAGE
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Sandbox Demo Section */}
      <section id="interactive-demo" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative z-10 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono block">SIMULATED LEDGER</span>
            <h2 className="font-display font-extrabold text-3xl text-white uppercase tracking-tight leading-tight">
              TRY THE TESTNET SANDBOX
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed font-mono">
              Simulate creating an ED25519 keypair and registering it with the test network Friendbot instantly in under 3 seconds.
            </p>

            <div className="space-y-4 font-mono text-xs text-gray-400">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={14} className="text-white shrink-0" />
                <span>Instant 1-Click Simulated wallet generation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={14} className="text-white shrink-0" />
                <span>Simulated registration with on-chain consensus</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={14} className="text-white shrink-0" />
                <span>Instant simulated refill of 10,000 XLM</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/terminal"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-xs font-mono tracking-widest uppercase hover:bg-gray-200 transition-all font-display"
              >
                GO TO CORE TERMINAL
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <InteractiveSandboxDemo />
          </div>

        </div>
      </section>

      {/* Startup Partner Badges */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 text-center border-t border-white/5 relative z-10">
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-8">COMPATIBLE INTEGRATIONS</span>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-40">
          <span className="text-xs font-extrabold tracking-widest text-white font-mono">STELLAR NETWORK</span>
          <span className="text-xs font-extrabold tracking-widest text-white font-mono">FREIGHTER AGENT</span>
          <span className="text-xs font-extrabold tracking-widest text-white font-mono">HORIZON API v3</span>
          <span className="text-xs font-extrabold tracking-widest text-white font-mono">SDF LEDGER</span>
        </div>
      </section>

      {/* Noir CTA Section */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-24 text-center relative z-10">
        <div className="p-8 sm:p-12 rounded bg-white/[0.01] border border-white/10 backdrop-blur-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl pointer-events-none"></div>
          
          <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-tight">
            INITIATE LEDGER TRANSMISSIONS
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto font-mono">
            Access secure payments, instant Friendbot testnet claims, and high contrast multi-monitor balance tracking instantly.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
            <Link
              to="/terminal"
              className="w-full py-4 bg-white text-black hover:bg-gray-200 font-bold text-xs font-mono tracking-widest uppercase transition-all text-center"
            >
              LAUNCH CONSOLE HUB
            </Link>
          </div>
        </div>
      </section>

      {/* Footer bar */}
      <footer className="border-t border-white/5 bg-black py-8 px-6 lg:px-8 text-[10px] text-gray-600 font-mono flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <p className="uppercase tracking-widest text-gray-400 font-bold">© 2026 STELLAR VOYAGER SYSTEM LOGS. MONOCHROME PLATFORM.</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest">
            DESIGNED & DEVELOPED SECURELY BY <span className="text-white font-bold">ARPAN ROY (arpanroy0506@gmail.com)</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <a href="https://horizon-testnet.stellar.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-0.5">
            HORIZON
            <ExternalLink size={8} />
          </a>
          <span>•</span>
          <a href="https://stellar.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-0.5">
            STELLAR.ORG
            <ExternalLink size={8} />
          </a>
        </div>
      </footer>
    </div>
  );
}

// Simulated Faucet Sandbox Experience component for the Landing page - fully black and white
function InteractiveSandboxDemo() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [status, setStatus] = useState<'idle' | 'generating' | 'funding' | 'completed'>('idle');
  const [txHash, setTxHash] = useState('');

  const generateMockWallet = () => {
    setStatus('generating');
    setTimeout(() => {
      // Create a nice mock Stellar address
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let mockAddr = 'GB';
      for (let i = 0; i < 54; i++) {
        mockAddr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setAddress(mockAddr);
      setStatus('funding');
      
      // Auto trigger simulated funding
      setTimeout(() => {
        setBalance('10,000.00');
        
        // Mock hash
        let mockHash = '';
        const hex = '0123456789abcdef';
        for (let i = 0; i < 64; i++) {
          mockHash += hex.charAt(Math.floor(Math.random() * hex.length));
        }
        setTxHash(mockHash);
        setStatus('completed');
        toast.success('Simulated Faucet injected 10,000 XLM!');
      }, 2000);

    }, 1000);
  };

  const handleReset = () => {
    setAddress('');
    setBalance('0.00');
    setTxHash('');
    setStatus('idle');
  };

  return (
    <div className="p-6 sm:p-8 rounded bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl text-left">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span className="text-[9px] font-mono text-gray-400 font-bold tracking-widest uppercase">TESTNET FAUCET SIMULATOR</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
        </div>
      </div>

      <div className="space-y-4">
        {status === 'idle' && (
          <div className="py-8 text-center space-y-4">
            <Globe className="w-8 h-8 text-white mx-auto animate-pulse" />
            <div className="space-y-1">
              <p className="font-mono text-xs text-white uppercase font-bold tracking-widest">Uninitialized Sandbox Port</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto font-mono">
                Simulate ED25519 on-chain registration on the Stellar sandbox ledger instantly.
              </p>
            </div>
            <button
              onClick={generateMockWallet}
              className="px-5 py-3 rounded bg-white hover:bg-gray-200 text-black font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
            >
              INITIALIZE FAUCET CLAIM
            </button>
          </div>
        )}

        {status === 'generating' && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-white mx-auto animate-spin" />
            <p className="font-mono text-[10px] text-white uppercase tracking-widest">Compiling Cryptographic Credentials...</p>
          </div>
        )}

        {(status === 'funding' || status === 'completed') && (
          <div className="space-y-4 font-mono text-xs text-gray-400">
            <div>
              <span className="text-[9px] text-gray-600 block mb-1 uppercase tracking-wider">MOCK PUBLIC KEY</span>
              <div className="p-3 bg-black/60 border border-white/5 text-[10px] text-white select-all truncate block font-mono">
                {address}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded bg-black/40 border border-white/5">
                <span className="text-[9px] text-gray-600 block mb-1 uppercase tracking-wider">MOCK ASSETS</span>
                <span className="text-sm font-extrabold text-white block">
                  {balance} <span className="text-[10px] text-gray-400">XLM</span>
                </span>
              </div>
              <div className="p-4 rounded bg-black/40 border border-white/5">
                <span className="text-[9px] text-gray-600 block mb-1 uppercase tracking-wider">LEDGER CONSENSUS</span>
                <span className={`text-[10px] font-bold block ${status === 'completed' ? 'text-white underline' : 'text-gray-500 animate-pulse'}`}>
                  {status === 'completed' ? 'SUCCESS_SYNCED' : 'BROADCASTING...'}
                </span>
              </div>
            </div>

            {status === 'funding' && (
              <div className="p-3 rounded bg-white/5 border border-white/10 text-white text-[10px] flex items-center gap-2 animate-pulse">
                <RefreshCw size={12} className="animate-spin shrink-0" />
                <span>Broadcasting test address registration to consensus validators...</span>
              </div>
            )}

            {status === 'completed' && (
              <div className="space-y-3">
                <div className="p-3 rounded bg-white/5 border border-white/10 text-white text-[10px] flex items-center gap-2">
                  <CheckCircle size={12} className="shrink-0" />
                  <span>Consensus reached. 10,000 XLM injected into local memory storage block.</span>
                </div>

                <div>
                  <span className="text-[9px] text-gray-600 block mb-1 uppercase tracking-wider">TX ENVELOPE HASH</span>
                  <span className="p-2.5 bg-black/60 border border-white/5 text-[9px] text-gray-500 block truncate font-mono">
                    {txHash}
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[10px] transition-all cursor-pointer"
                  >
                    RESET SANDBOX
                  </button>
                  <Link
                    to="/terminal"
                    className="flex-1 py-2.5 rounded bg-white text-black font-mono text-[10px] font-bold text-center uppercase tracking-wider transition-all"
                  >
                    GO TO TERMINAL
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
