import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, ArrowRight, Shield, Zap, Activity, Monitor, Globe, 
  Cpu, Terminal, Sparkles, RefreshCw, CheckCircle, ExternalLink, 
  ArrowDownCircle, Info, Wifi, Battery, Orbit, ShieldCheck, Server, Star,
  Menu, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import orionLogo from '../assets/images/orion_logo_1783011957450.jpg';
import ledgerScheme from '../assets/images/ledger_grid_monochrome_1783009823001.jpg';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scrolling to shrink notch if wanted, or adjust styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Custom 3D Space Constellation & Star Ledger Orbit Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 750);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 750;
    };
    window.addEventListener('resize', handleResize);

    // Stellar constellation nodes
    interface SpaceNode {
      x: number;
      y: number;
      z: number;
      size: number;
      pulseSpeed: number;
      pulsePhase: number;
      label: string;
    }

    const size = Math.min(width, height) * 0.18;
    const nodes: SpaceNode[] = [
      { x: -size, y: -size * 0.5, z: -size, size: 4, pulseSpeed: 0.02, pulsePhase: 0, label: "ORION_CORE" },
      { x: size, y: -size * 0.8, z: -size * 0.5, size: 5, pulseSpeed: 0.015, pulsePhase: Math.PI / 4, label: "HORIZON_NODE_A" },
      { x: size * 0.6, y: size * 0.7, z: -size * 1.2, size: 3.5, pulseSpeed: 0.03, pulsePhase: Math.PI / 2, label: "VALIDATOR_SOLAR" },
      { x: -size * 0.8, y: size * 0.6, z: -size * 0.2, size: 4, pulseSpeed: 0.01, pulsePhase: Math.PI, label: "MEMPOOL_STRATUM" },
      { x: -size * 0.2, y: -size * 1.2, z: size, size: 5, pulseSpeed: 0.025, pulsePhase: Math.PI * 1.5, label: "SDF_TESTNET" },
      { x: size * 1.1, y: -size * 0.2, z: size * 0.8, size: 3.5, pulseSpeed: 0.018, pulsePhase: Math.PI * 0.3, label: "GATEWAY_XLM" },
      { x: size * 0.3, y: size * 1.1, z: size * 0.5, size: 4.5, pulseSpeed: 0.022, pulsePhase: Math.PI * 0.8, label: "LEDGER_INDEX_B" },
      { x: -size * 1.2, y: size * 0.1, z: size * 1.1, size: 4, pulseSpeed: 0.012, pulsePhase: Math.PI * 1.2, label: "CIPHER_PORT" },
    ];

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Main constellation outer
      [4, 5], [5, 6], [6, 7], [7, 4], // Front constellation outer
      [0, 4], [1, 5], [2, 6], [3, 7], // Structural cross lines
      [0, 5], [2, 7], [1, 6], [3, 4]  // Core diagonal orbits
    ];

    // Orbiting space stardust dust specs
    interface StarSpec {
      x: number;
      y: number;
      z: number;
      angle: number;
      radius: number;
      speed: number;
      brightness: number;
      color: string;
    }

    const stardust: StarSpec[] = [];
    const colors = ['rgba(255, 255, 255, ', 'rgba(147, 197, 253, ', 'rgba(196, 181, 253, ']; // white, blue-300, purple-300
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = size * (1.1 + Math.random() * 2.6);
      const color = colors[Math.floor(Math.random() * colors.length)];
      stardust.push({
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * size * 2.2,
        z: Math.sin(angle) * radius,
        angle,
        radius,
        speed: (Math.random() * 0.005 + 0.001) * (Math.random() > 0.45 ? 1 : -1),
        brightness: 0.35 + Math.random() * 0.65,
        color
      });
    }

    let angleX = 0.003;
    let angleY = 0.005;

    // Projection & Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Fine Space Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
      ctx.lineWidth = 1;
      const gridSpacing = 60;
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
      const cy = height * 0.45;

      // Parallax rotation based on mouse coordinates
      const targetAngleX = (mousePos.y / height - 0.5) * 0.9;
      const targetAngleY = (mousePos.x / width - 0.5) * 0.9;

      angleX += (targetAngleX - angleX) * 0.04;
      angleY += (targetAngleY - angleY) * 0.04;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Render Orbits
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 1.5, size * 0.7, angleY, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 2.2, size * 1.0, -angleY * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Project vertices to 2D
      const projectedNodes = nodes.map((node) => {
        // Rotate Y
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.x * sinY + node.z * cosY;

        // Rotate X
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = node.y * sinX + z1 * cosX;

        // Perspective
        const perspective = 550;
        const scale = perspective / (perspective + z2);
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          z: z2,
          scale,
          node
        };
      });

      // Draw constellation wireframe lines
      connections.forEach(([p1, p2]) => {
        const pt1 = projectedNodes[p1];
        const pt2 = projectedNodes[p2];

        const avgZ = (pt1.z + pt2.z) / 2;
        const opacity = Math.max(0.04, 0.25 - (avgZ / (size * 4)));

        // Silver-white futuristic vectors
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
      });

      // Draw star nodes
      projectedNodes.forEach((pt) => {
        pt.node.pulsePhase += pt.node.pulseSpeed;
        const sizePulse = pt.node.size + Math.sin(pt.node.pulsePhase) * 1.5;
        const opacity = Math.max(0.1, 0.65 - (pt.z / (size * 3.5)));

        // Metallic star sparkle aura
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = pt.scale * 12;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.scale * sizePulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Micro telemetry tag alongside the stellar node
        if (pt.scale > 0.8) {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
          ctx.font = '7px monospace';
          ctx.fillText(pt.node.label, pt.x + 8, pt.y + 3);
        }
      });

      // Update & render space stardust
      stardust.forEach((star) => {
        // Orbit update
        star.angle += star.speed;
        star.x = Math.cos(star.angle) * star.radius;
        star.z = Math.sin(star.angle) * star.radius;

        // Rotate Y
        let x1 = star.x * cosY - star.z * sinY;
        let z1 = star.x * sinY + star.z * cosY;

        // Rotate X
        let y2 = star.y * cosX - z1 * sinX;
        let z2 = star.y * sinX + z1 * cosX;

        const scale = 550 / (550 + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        const opacity = Math.max(0.05, (0.45 - (z2 / (size * 5))) * star.brightness);
        
        // Twinkling effect
        const finalOpacity = opacity * (0.7 + Math.sin(star.angle * 10) * 0.3);

        ctx.fillStyle = `${star.color}${finalOpacity})`;
        ctx.beginPath();
        ctx.arc(px, py, scale * 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

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
      className="min-h-screen text-zinc-100 immersive-bg space-stardust font-sans overflow-x-hidden relative selection:bg-white selection:text-black"
      onMouseMove={handleMouseMove}
    >
      {/* Space Light Nebula Glows (Indigo, Violet, and Charcoal) */}
      <div className="absolute top-[5%] left-[10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-indigo-900/10 rounded-full blur-[150px] pointer-events-none z-0 animate-pulse-slow"></div>
      <div className="absolute top-[35%] right-[5%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-purple-950/10 rounded-full blur-[180px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] left-[15%] w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-zinc-900/15 rounded-full blur-[160px] pointer-events-none z-0"></div>

      {/* Deep Celestial Star Orbit Canvas background */}
      <div className="absolute top-0 left-0 w-full h-[95vh] z-0 opacity-80 pointer-events-none overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Top thin pure silver highlight strip */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-zinc-400 to-transparent z-50 opacity-60"></div>

      {/* Modern Center Floating Navigation Bar Wrapper */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center px-4 sm:px-6">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 }}
          className={`pointer-events-auto w-full max-w-4xl transition-[padding,margin,background-color,border-color,box-shadow] duration-300 ease-in-out ${
            scrolled 
              ? 'mt-3 py-2 bg-zinc-950/90 border-zinc-850/80 shadow-[0_15px_40px_rgba(0,0,0,0.9)]' 
              : 'mt-4 py-3 bg-zinc-950/75 border-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
          } backdrop-blur-md border rounded-2xl px-4 sm:px-6 flex items-center justify-between gap-4 relative`}
        >
          {/* Left: Brand & Logo */}
          <Link to="/" className="flex items-center gap-2.5 group active:scale-98 transition-transform">
            <div className="relative">
              {/* Spinning/pulsing celestial outline ring */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-zinc-500/30 to-white/20 blur-sm opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 animate-spin-slow"></div>
              <img 
                src={orionLogo} 
                alt="Orion Logo" 
                className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-zinc-500/80 object-cover shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-extrabold tracking-[0.18em] text-white font-sans flex items-center">
                ORION
              </span>
              <span className="text-[7px] text-zinc-500 font-mono tracking-widest uppercase leading-none mt-0.5">
                CELESTIAL
              </span>
            </div>
          </Link>

          {/* Center: Beautifully Styled Navigation Deck */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/40 p-1 rounded-full border border-zinc-800/40">
            <button 
              onClick={() => scrollToSection('features')} 
              className="px-3 py-1.5 rounded-full text-zinc-300 hover:text-white text-[10.5px] font-sans font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 hover:bg-zinc-800/60"
            >
              <Monitor size={11} className="text-zinc-400" />
              Surveillance
            </button>
            <button 
              onClick={() => scrollToSection('interactive-demo')} 
              className="px-3 py-1.5 rounded-full text-zinc-300 hover:text-white text-[10.5px] font-sans font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 hover:bg-zinc-800/60"
            >
              <Zap size={11} className="text-zinc-400" />
              Faucet Sandbox
            </button>
            <button 
              onClick={() => scrollToSection('architecture')} 
              className="px-3 py-1.5 rounded-full text-zinc-300 hover:text-white text-[10.5px] font-sans font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 hover:bg-zinc-800/60"
            >
              <Cpu size={11} className="text-zinc-400" />
              Architecture
            </button>
          </nav>

          {/* Right Actions & Telemetry Widget */}
          <div className="flex items-center gap-3">
            {/* Live System Signal telemetry */}
            <div className="hidden lg:flex items-center gap-2.5 bg-black/40 border border-zinc-900/80 px-3.5 py-1.5 rounded-full text-zinc-500 font-mono text-[8px] tracking-widest">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-zinc-400">TESTNET_5G</span>
              </div>
              <span className="text-zinc-800">|</span>
              <div className="flex items-center gap-1">
                <Server size={9} className="text-zinc-500" />
                <span>NODES_OK</span>
              </div>
            </div>

            <Link
              to="/terminal"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-[10.5px] font-sans font-extrabold tracking-wider uppercase transition-all duration-300 hover:bg-zinc-200 hover:scale-[1.02] active:scale-98 shadow-[0_3px_15px_rgba(255,255,255,0.2)]"
            >
              LAUNCH CONSOLE
              <ArrowRight size={11} />
            </Link>

            {/* Mobile Menu Toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden items-center justify-center p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 transition-colors"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Mobile Dropdown Panel inside navbar */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute top-full left-0 right-0 overflow-hidden bg-zinc-950/95 border border-zinc-800/90 rounded-[20px] p-4 flex flex-col gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.9)] z-40 md:hidden backdrop-blur-lg pointer-events-auto"
              >
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection('features');
                  }} 
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-3 transition-colors"
                >
                  <Monitor size={14} className="text-zinc-400" />
                  Surveillance
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection('interactive-demo');
                  }} 
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-3 transition-colors"
                >
                  <Zap size={14} className="text-zinc-400" />
                  Faucet Sandbox
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection('architecture');
                  }} 
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-3 transition-colors"
                >
                  <Cpu size={14} className="text-zinc-400" />
                  Architecture
                </button>
                <div className="h-px bg-zinc-900 my-1"></div>
                <Link
                  to="/terminal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl bg-white text-black font-sans font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300"
                >
                  LAUNCH CONSOLE
                  <ArrowRight size={13} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Spacer to push content past fixed floating notch */}
      <div className="h-24 sm:h-26"></div>

      {/* Hero Section - Stark premium monochrome layout */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-10 md:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Badges Wrapper */}
            <div className="flex flex-wrap items-center gap-3">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-zinc-800 text-zinc-300 text-[10px] font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.02)]"
              >
                <Sparkles size={11} className="text-zinc-400 animate-pulse" />
                NON-CUSTODIAL &bull; CONSOLE v3.0
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-zinc-800 text-zinc-300 text-[10px] font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.02)]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-ping shrink-0"></span>
                CREATED BY ARPAN ROY
              </motion.div>
            </div>

            {/* Headline with metallic silver text glow */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
                className="font-sans font-black text-5xl sm:text-7xl tracking-tight text-white leading-tight uppercase"
              >
                CELESTIAL <br />
                <span className="silver-text-glow font-black">
                  BLOCK LEDGER
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-zinc-400 text-xs sm:text-sm max-w-xl font-sans font-light leading-relaxed tracking-wide"
              >
                Monitor multiple on-chain vaults, sign zero-trust payments, and broadcast instant SDF Testnet contract executions securely via the premium Freighter & EVM secure gateway.
              </motion.p>
            </div>

            {/* Action Buttons wrapped in Motion */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <Link
                to="/terminal"
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-full btn-metallic text-xs font-mono font-bold uppercase transition-all duration-300 text-center shadow-[0_12px_24px_-8px_rgba(255,255,255,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(255,255,255,0.4)]"
              >
                <Terminal size={14} />
                ENTER TERMINAL CONSOLE
              </Link>

              <button
                onClick={() => scrollToSection('interactive-demo')}
                className="flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-black/40 border border-zinc-700/60 text-zinc-300 hover:text-white hover:border-zinc-400 font-bold text-xs font-mono tracking-widest uppercase transition-all text-center cursor-pointer backdrop-blur-md"
              >
                TESTNET FAUCET SANDBOX
              </button>
            </motion.div>

            {/* Cosmic Telemetry Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.35 }}
              className="pt-8 grid grid-cols-3 gap-6 border-t border-zinc-900 max-w-lg"
            >
              <div>
                <span className="block text-[9px] font-mono text-zinc-500 font-bold tracking-widest uppercase">CONCURRENT SECURE</span>
                <span className="text-sm font-extrabold text-zinc-100 font-display">100% SECURE</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-zinc-500 font-bold tracking-widest uppercase">HORIZON TRANSIT</span>
                <span className="text-sm font-extrabold text-zinc-100 font-display">&lt; 4.8s LAT</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-zinc-500 font-bold tracking-widest uppercase">ON-CHAIN FEES</span>
                <span className="text-sm font-extrabold text-zinc-100 font-display">0.0001 XLM</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Right Graphic - Embedded image with neat futuristic space frame */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.0, cubicBezier: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative mt-6 lg:mt-0"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>
            <div className="p-1 rounded-[24px] bg-gradient-to-b from-zinc-700 via-transparent to-zinc-900 border border-zinc-800/80 relative z-10 shadow-2xl">
              <div className="rounded-[20px] overflow-hidden bg-black aspect-[16/10] relative group">
                <img 
                  src={ledgerScheme} 
                  alt="Stellar Decentralized Ledger Scheme" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[1.5s] filter grayscale contrast-125"
                />
                
                {/* Visual interface elements overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 p-3.5 bg-black/85 backdrop-blur-md rounded-xl border border-zinc-800 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span className="text-zinc-200">ORION_SATELLITE_ORBIT.DAT</span>
                  </div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold">SYSTEM MAP</span>
                </div>
              </div>
            </div>

            {/* Corner Bracket Accents (Silver-plated look) */}
            <div className="absolute top-[-15px] left-[-15px] w-6 h-6 border-t-2 border-l-2 border-zinc-400/50 pointer-events-none rounded-tl"></div>
            <div className="absolute bottom-[-15px] right-[-15px] w-6 h-6 border-b-2 border-r-2 border-zinc-400/50 pointer-events-none rounded-br"></div>
          </motion.div>

        </div>
      </section>

      {/* Bento Grid Features Layout - Stark silver and black */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10 border-t border-zinc-900">
        <div className="text-center space-y-3 mb-20">
          <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono block">MONOCHROME ENGINE</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight">
            DECENTRALIZED WORKSTATION CAPABILITIES
          </h2>
          <p className="text-zinc-400 text-xs max-w-lg mx-auto font-sans font-light tracking-wide">
            High contrast space typography, multi-monitor ledger telemetry, and absolute wallet autonomy.
          </p>
        </div>

        {/* Bento Grid layout with Framer Motion hover animations */}
        <div id="architecture" className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Live account stream (8 Cols) */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(255, 255, 255, 0.25)' }}
            transition={{ duration: 0.3 }}
            className="md:col-span-8 p-8 sm:p-10 rounded-3xl bg-zinc-950/40 border border-zinc-800/80 flex flex-col justify-between hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all min-h-[380px]"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-zinc-800 text-white flex items-center justify-center mb-6">
                <Orbit className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wider">
                Direct Horizon Node Synchronization
              </h3>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-sans font-light tracking-wide max-w-xl">
                Securely fetch and read account balances, locked asset subentries count, and unique sequence ids. Fully customized for both the Stellar Network and Ethereum Sepolia nodes.
              </p>
            </div>

            {/* Interactive Telemetry Widget inside Card */}
            <div className="mt-8 p-4 rounded-2xl bg-black/60 border border-zinc-800/80 font-mono text-[10px] text-zinc-400 space-y-2">
              <div className="flex justify-between border-b border-zinc-900 pb-2 text-zinc-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  ORION_RPC_ROUTER: ACTIVE
                </span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">TESTNET PROXY</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-1 text-[9px] text-zinc-500">
                <div>
                  INDEX_LEDGERS: <span className="text-zinc-200">ONLINE</span>
                </div>
                <div>
                  LATEST_SEQUENCE: <span className="text-zinc-200">201,495,122</span>
                </div>
                <div>
                  CONSENSUS: <span className="text-zinc-200">SDF_HORIZON</span>
                </div>
                <div>
                  GAS_EST: <span className="text-zinc-200">0.0001 XLM / ETH</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Cryptographic Safeguards (4 Cols) */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(255, 255, 255, 0.25)' }}
            transition={{ duration: 0.3 }}
            className="md:col-span-4 p-8 rounded-3xl bg-zinc-950/40 border border-zinc-800/80 flex flex-col justify-between hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all min-h-[380px]"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-zinc-800 text-white flex items-center justify-center mb-6">
                <ShieldCheck className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wider">
                Cryptographic Safeguards
              </h3>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-sans font-light tracking-wide">
                No storage. Zero cloud servers holding private keys. All transaction envelopes are built completely locally on-chain and authorized inside secure wallet containers.
              </p>
            </div>

            <div className="pt-6 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>CIPHER_STANDARDS</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-zinc-800 text-zinc-200 text-[9px] font-bold">ED25519 Keys</span>
            </div>
          </motion.div>

          {/* Card 3: Watchlist Multi-Monitor (4 Cols) */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(255, 255, 255, 0.25)' }}
            transition={{ duration: 0.3 }}
            className="md:col-span-4 p-8 rounded-3xl bg-zinc-950/40 border border-zinc-800/80 flex flex-col justify-between hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all min-h-[360px]"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-zinc-800 text-white flex items-center justify-center mb-6">
                <Monitor className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wider">
                Multi-Monitor Watchlist
              </h3>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-sans font-light tracking-wide">
                Seamlessly store, save, and surveillance dozens of public key accounts, offline vaults, or payment nodes using encrypted local cache.
              </p>
            </div>

            <div className="space-y-1.5 font-mono text-[9px] mt-6">
              <div className="flex justify-between text-zinc-500 uppercase font-bold text-[8px] tracking-wider mb-1">
                <span>LOCAL_WATCHLIST</span>
                <span>BALANCE</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Cold Storage</span>
                <span className="text-white font-bold">14,895 XLM</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Voyager Core</span>
                <span className="text-white font-bold">2,500 XLM</span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: SDK package (8 Cols) */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(255, 255, 255, 0.25)' }}
            transition={{ duration: 0.3 }}
            className="md:col-span-8 p-8 sm:p-10 rounded-3xl bg-zinc-950/40 border border-zinc-800/80 flex flex-col justify-between hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all min-h-[360px]"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-zinc-800 text-white flex items-center justify-center mb-6">
                <Cpu size={20} className="text-zinc-300" />
              </div>
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wider">
                Official Freighter & MetaMask SDKs
              </h3>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-sans font-light tracking-wide max-w-xl">
                Built and verified with the latest Stellar Freighter API, Friendbot faucet routers, and MetaMask RPC connectors. Perfect sandbox developer toolkit.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 bg-black/60 border border-zinc-800/80 rounded-2xl px-4 py-3.5 font-mono text-xs text-zinc-300 flex items-center justify-between gap-3 overflow-x-auto">
                <span className="shrink-0 text-zinc-500 font-bold">$</span>
                <span className="truncate">npm i @stellar/freighter-api</span>
              </div>
              <button
                onClick={handleCopyCli}
                className="px-6 py-3.5 rounded-full bg-white text-black font-mono font-bold text-[10px] tracking-wider uppercase transition-all duration-300 shrink-0 cursor-pointer text-center hover:bg-zinc-200 hover:scale-103 shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
              >
                COPY PACKAGE
              </button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Interactive Sandbox Demo Section */}
      <section id="interactive-demo" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10 border-t border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono block">SIMULATED LEDGER</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight leading-none">
              TRY THE STELLAR <br />
              <span className="silver-text-glow font-extrabold">TESTNET SANDBOX</span>
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans font-light tracking-wide">
              Create an instantaneous simulated ED25519 cryptographic keypair and claim free XLM test assets via Friendbot inside a fully offline environment.
            </p>

            <div className="space-y-4 font-mono text-[11px] text-zinc-400 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle size={15} className="text-white shrink-0" />
                <span>Simulated ED25519 keypair compile</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={15} className="text-white shrink-0" />
                <span>Friendbot broadcast & network registration</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={15} className="text-white shrink-0" />
                <span>Instant injection of 10,000 XLM sandbox funds</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/terminal"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-bold text-xs font-mono tracking-widest uppercase hover:bg-zinc-200 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
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
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 text-center border-t border-zinc-900 relative z-10">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-10 font-bold">COMPATIBLE BLOCKCHAIN CONNECTIONS</span>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-30">
          <span className="text-xs font-extrabold tracking-widest text-white font-mono">STELLAR TESTNET</span>
          <span className="text-xs font-extrabold tracking-widest text-white font-mono">FREIGHTER EXTENSION</span>
          <span className="text-xs font-extrabold tracking-widest text-white font-mono">HORIZON RPC v3</span>
          <span className="text-xs font-extrabold tracking-widest text-white font-mono">ETHEREUM SEPOLIA</span>
        </div>
      </section>

      {/* Metallic Space Call-To-Action (CTA) Section */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20 text-center relative z-10">
        <div className="p-8 sm:p-14 rounded-[32px] bg-zinc-950/60 border border-zinc-800/80 backdrop-blur-2xl space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/[0.02] rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight">
            INITIATE VOYAGER MISSIONS
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto font-sans font-light tracking-wide leading-relaxed">
            Gain immediate terminal access, securely sign payment envelopes, trigger local faucet allocations, and monitor multiple balance surveillance ports.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
            <Link
              to="/terminal"
              className="w-full py-4 rounded-full bg-zinc-100 text-black hover:bg-white font-bold text-xs font-mono tracking-widest uppercase transition-all text-center shadow-[0_10px_20px_rgba(255,255,255,0.15)] active:scale-98"
            >
              LAUNCH CONSOLE HUB
            </Link>
          </div>
        </div>
      </section>

      {/* Footer bar */}
      <footer className="border-t border-zinc-900 bg-black/90 py-10 px-6 lg:px-8 text-[10px] text-zinc-500 font-mono flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="space-y-1.5 text-center md:text-left">
          <p className="uppercase tracking-widest text-zinc-400 font-bold">© 2026 ORION COSMIC WORKSPACE LOGS. METALLIC EDITION.</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
            DESIGNED & CRAFTED EXCLUSIVELY BY <span className="text-zinc-200 font-bold">ARPAN ROY (arpanroy0506@gmail.com)</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <a href="https://horizon-testnet.stellar.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-0.5">
            HORIZON_NODE
            <ExternalLink size={9} />
          </a>
          <span>•</span>
          <a href="https://stellar.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-0.5">
            STELLAR.ORG
            <ExternalLink size={9} />
          </a>
        </div>
      </footer>
    </div>
  );
}

// Simulated Faucet Sandbox Experience component for the Landing page - fully silver and black with Motion
function InteractiveSandboxDemo() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [status, setStatus] = useState<'idle' | 'generating' | 'funding' | 'completed'>('idle');
  const [txHash, setTxHash] = useState('');

  const generateMockWallet = () => {
    setStatus('generating');
    setTimeout(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let mockAddr = 'GB';
      for (let i = 0; i < 54; i++) {
        mockAddr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setAddress(mockAddr);
      setStatus('funding');
      
      setTimeout(() => {
        setBalance('10,000.00');
        
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
    <div className="p-6 sm:p-8 rounded-[24px] bg-zinc-950/50 border border-zinc-800/80 backdrop-blur-2xl relative overflow-hidden shadow-2xl text-left">
      
      {/* Decorative notch line inside the sandbox card header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span className="text-[9px] font-mono text-zinc-400 font-bold tracking-widest uppercase">TESTNET FAUCET SIMULATOR</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-10 text-center space-y-5"
          >
            <Globe className="w-8 h-8 text-zinc-300 mx-auto animate-pulse" />
            <div className="space-y-1.5">
              <p className="font-mono text-xs text-zinc-100 uppercase font-bold tracking-widest">Uninitialized Sandbox Core</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto font-sans leading-relaxed">
                Generate an immediate ED25519 test session on the simulated Stellar sandbox blockchain.
              </p>
            </div>
            <button
              onClick={generateMockWallet}
              className="px-6 py-3 rounded-full bg-zinc-100 hover:bg-white text-black font-mono font-bold text-[10px] tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-lg active:scale-97"
            >
              INITIALIZE FAUCET CLAIM
            </button>
          </motion.div>
        )}

        {status === 'generating' && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-14 text-center space-y-4"
          >
            <RefreshCw className="w-6 h-6 text-zinc-400 mx-auto animate-spin" />
            <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest animate-pulse font-bold">Compiling Secure Credentials...</p>
          </motion.div>
        )}

        {(status === 'funding' || status === 'completed') && (
          <motion.div 
            key="sandbox-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 font-mono text-xs text-zinc-400"
          >
            <div>
              <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">MOCK PUBLIC KEY (ED25519)</span>
              <div className="p-3.5 bg-black/60 border border-zinc-900 rounded-xl text-[10px] text-white select-all truncate block font-mono">
                {address}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">MOCK ASSETS</span>
                <span className="text-sm font-extrabold text-white block">
                  {balance} <span className="text-[9px] text-zinc-400">XLM</span>
                </span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">CONSENSUS STATE</span>
                <span className={`text-[10px] font-bold block ${status === 'completed' ? 'text-zinc-300 underline' : 'text-zinc-500 animate-pulse'}`}>
                  {status === 'completed' ? 'SUCCESS_SYNCED' : 'BROADCASTING...'}
                </span>
              </div>
            </div>

            {status === 'funding' && (
              <div className="p-3.5 rounded-xl bg-white/5 border border-zinc-800 text-zinc-300 text-[10px] flex items-center gap-2.5 animate-pulse">
                <RefreshCw size={12} className="animate-spin shrink-0 text-zinc-400" />
                <span>Broadcasting test wallet credentials to network validators...</span>
              </div>
            )}

            {status === 'completed' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-3.5 rounded-xl bg-white/5 border border-zinc-800 text-zinc-200 text-[10px] flex items-center gap-2">
                  <CheckCircle size={14} className="shrink-0 text-zinc-400" />
                  <span>Consensus reached. 10,000 XLM injected into local memory storage block.</span>
                </div>

                <div>
                  <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">TX ENVELOPE HASH</span>
                  <span className="p-2.5 bg-black/60 border border-zinc-900 rounded-xl text-[9px] text-zinc-500 block truncate font-mono">
                    {txHash}
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-full bg-white/5 border border-zinc-800 hover:bg-white/10 text-zinc-200 font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer"
                  >
                    RESET SANDBOX
                  </button>
                  <Link
                    to="/terminal"
                    className="flex-1 py-3 rounded-full bg-white text-black font-mono text-[10px] font-bold text-center uppercase tracking-widest transition-all shadow-md active:scale-97"
                  >
                    GO TO TERMINAL
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
