import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Radio, Eye, ShieldCheck, FlaskConical, Github, Menu, X, Wallet, Droplets, ArrowDownLeft } from 'lucide-react';
import { Badge, Belt, Button, Logo, cx } from '../components/ui';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
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
    const colors = ['rgba(238, 241, 250, ', 'rgba(143, 193, 255, ', 'rgba(255, 138, 91, ']; // starlight, Rigel, Betelgeuse
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
      const targetAngleX = (mouseRef.current.y / height - 0.5) * 0.9;
      const targetAngleY = (mouseRef.current.x / width - 0.5) * 0.9;

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
        const scale = perspective / Math.max(1, perspective + z2);
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
        ctx.arc(pt.x, pt.y, Math.max(0, pt.scale * sizePulse * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

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

        const scale = 550 / Math.max(1, 550 + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        const opacity = Math.max(0.05, (0.45 - (z2 / (size * 5))) * star.brightness);
        
        // Twinkling effect
        const finalOpacity = opacity * (0.7 + Math.sin(star.angle * 10) * 0.3);

        ctx.fillStyle = `${star.color}${finalOpacity})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0, scale * 1.2), 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const REPO_URL = 'https://github.com/arg0506/Orion';

  const features = [
    {
      icon: ArrowUpRight,
      title: 'Payments that follow the rules',
      body: "Orion knows Stellar's minimum balance, fees and 28-byte memo limit, and creates the account automatically when you pay a brand-new address.",
    },
    {
      icon: Radio,
      title: 'Live activity',
      body: 'Your history streams straight from Horizon. Incoming payments appear, and your balance updates, the moment they land.',
    },
    {
      icon: Eye,
      title: 'Watchlist',
      body: "Track any testnet address you don't control, like a team treasury or a judge's wallet, with totals at a glance.",
    },
    {
      icon: ShieldCheck,
      title: 'Safe by default',
      body: 'Your keys stay in Freighter or MetaMask. Sending is blocked on the wrong network, and errors are shown, never papered over.',
    },
  ];

  return (
    <div className="min-h-screen orion-sky text-starlight font-sans overflow-x-hidden relative" onMouseMove={handleMouseMove}>
      {/* 3D star field */}
      <div className="absolute inset-x-0 top-0 h-[92vh] z-0 opacity-30 sm:opacity-70 pointer-events-none overflow-hidden" aria-hidden="true">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Navigation */}
      <header className={cx('sticky top-0 z-40 transition-colors', scrolled ? 'bg-night/85 backdrop-blur-md border-b border-line' : 'border-b border-transparent')}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" aria-label="Orion home">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-[15px]" aria-label="Main">
            <button onClick={() => scrollToSection('features')} className="px-3 h-9 rounded-lg text-mist hover:text-starlight">Features</button>
            <button onClick={() => scrollToSection('how')} className="px-3 h-9 rounded-lg text-mist hover:text-starlight">How it works</button>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="px-3 h-9 rounded-lg text-mist hover:text-starlight inline-flex items-center gap-1.5">
              <Github size={16} /> Source
            </a>
            <Link to="/terminal" className="ml-3">
              <Button variant="primary" size="sm" icon={<Wallet size={15} />}>Open wallet</Button>
            </Link>
          </nav>
          <button className="md:hidden p-2 rounded-lg text-mist hover:text-starlight" onClick={() => setMobileMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-night/95 px-5 py-3 flex flex-col gap-1">
            <button onClick={() => { setMobileMenuOpen(false); scrollToSection('features'); }} className="h-11 text-left text-mist">Features</button>
            <button onClick={() => { setMobileMenuOpen(false); scrollToSection('how'); }} className="h-11 text-left text-mist">How it works</button>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="h-11 flex items-center text-mist">Source on GitHub</a>
            <Link to="/terminal" className="mt-1"><Button variant="primary" className="w-full">Open wallet</Button></Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 pb-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-[13px] font-medium text-rigel mb-5">
            <Belt className="w-6" /> Stellar testnet wallet
          </p>
          <h1 className="font-display font-bold tracking-tight leading-[1.02] text-[44px] sm:text-[64px] lg:text-[72px]">
            Your clear window
            <br />
            onto the <span className="text-rigel">Stellar</span> testnet.
          </h1>
          <p className="text-[17px] sm:text-lg text-mist mt-6 max-w-xl leading-relaxed">
            Connect Freighter, fund an account with Friendbot, send XLM and keep an eye on any address, all on the real testnet. Made for developers building and demoing Stellar apps.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/terminal">
              <Button variant="primary" size="lg" icon={<ArrowRight size={17} />}>Open wallet</Button>
            </Link>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Button size="lg" icon={<Github size={17} />}>View source</Button>
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-ok" /> Reads live from Horizon</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rigel" /> Keys never leave your wallet</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-betel" /> No sign-up needed</li>
          </ul>
        </div>

        {/* Product preview (illustrative) */}
        <div className="relative" aria-label="Preview of the Orion wallet">
          <div className="absolute -inset-8 bg-rigel/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative rounded-3xl border border-line bg-deep/90 backdrop-blur p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-mist">Testnet balance</span>
              <Badge tone="neutral">Example</Badge>
            </div>
            <p className="font-display font-bold text-[44px] leading-none mt-3 num">
              10,000.00 <span className="text-xl text-mist font-semibold">XLM</span>
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <span className="h-10 rounded-xl bg-rigel text-night font-semibold text-sm flex items-center justify-center gap-2"><ArrowUpRight size={16} /> Send</span>
              <span className="h-10 rounded-xl bg-deeper border border-line font-semibold text-sm flex items-center justify-center gap-2"><ArrowDownLeft size={16} /> Receive</span>
            </div>
            <ul className="mt-6 divide-y divide-line">
              {[
                { inc: true, who: 'GDF7…MHHP', amt: '+250.00', when: 'just now' },
                { inc: false, who: 'GCAK…EYFP', amt: '−1,200.00', when: '2 h ago' },
                { inc: true, who: 'Friendbot', amt: '+10,000.00', when: '2 d ago', fund: true },
              ].map((r) => (
                <li key={r.who} className="flex items-center gap-3 py-3">
                  <span className={cx('w-9 h-9 rounded-xl grid place-items-center border', r.inc ? 'text-rigel bg-rigel/10 border-rigel/20' : 'text-betel bg-betel/10 border-betel/20')}>
                    {r.fund ? <Droplets size={15} /> : r.inc ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-starlight">{r.inc ? 'Received from' : 'Sent to'} <span className="font-mono text-[13px]">{r.who}</span></span>
                    <span className="block text-[12px] text-haze">{r.when}</span>
                  </span>
                  <span className={cx('text-sm font-semibold num', r.inc ? 'text-rigel' : 'text-starlight')}>{r.amt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 border-t border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <h2 className="font-display font-bold text-[32px] sm:text-[40px] tracking-tight max-w-2xl leading-tight">Everything you need to test a Stellar payment flow.</h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-line bg-deep/70 p-6">
                <span className="w-10 h-10 rounded-xl grid place-items-center bg-deeper border border-line text-rigel">
                  <Icon size={18} />
                </span>
                <h3 className="font-display font-semibold text-xl mt-4">{title}</h3>
                <p className="text-[15px] text-mist mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 border-t border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 grid lg:grid-cols-[0.8fr_1.2fr] gap-10">
          <div>
            <h2 className="font-display font-bold text-[32px] sm:text-[40px] tracking-tight leading-tight">From zero to first payment in a minute.</h2>
            <p className="text-mist mt-4 leading-relaxed">You need the free Freighter browser extension, set to Testnet. Nothing else.</p>
          </div>
          <ol className="grid gap-4">
            {[
              ['Connect Freighter', 'Orion asks Freighter for your public address. Your secret key never leaves the extension.'],
              ['Fund with Friendbot', "New Stellar addresses don't exist until they hold 1 XLM. One click gets you 10,000 free test XLM."],
              ['Send and watch it land', 'Enter an address and amount, approve in Freighter, and see the payment on the ledger seconds later.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-5 rounded-2xl border border-line bg-deep/70 p-5">
                <span className="w-9 h-9 rounded-full border border-line bg-deeper grid place-items-center font-semibold text-rigel shrink-0 num">{i + 1}</span>
                <div>
                  <p className="font-semibold text-[17px]">{t}</p>
                  <p className="text-[15px] text-mist mt-1 leading-relaxed">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Playground */}
      <section className="relative z-10 border-t border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <div className="rounded-3xl border border-line bg-deep/70 p-8 sm:p-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[13px] font-medium text-betel"><FlaskConical size={15} /> Learning playground</p>
              <h2 className="font-display font-bold text-[26px] sm:text-[32px] tracking-tight mt-2 leading-tight">See how a smart contract goes from code to deploy.</h2>
              <p className="text-mist mt-3 leading-relaxed">
                Step through Soroban and Solidity templates, inter-contract calls, events and a CI pipeline. It's a guided simulation that runs in your browser, so nothing is deployed.
              </p>
            </div>
            <Link to="/developer" className="shrink-0">
              <Button size="lg" icon={<ArrowRight size={17} />}>Open playground</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row gap-4 justify-between text-sm text-haze">
          <span className="flex items-center gap-2"><Belt className="w-5 text-mist" /> Orion · Built by Arpan Roy · Test networks only</span>
          <span className="flex gap-5">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-starlight">GitHub</a>
            <a href="https://developers.stellar.org" target="_blank" rel="noreferrer" className="hover:text-starlight">Stellar docs</a>
            <a href="https://www.freighter.app/" target="_blank" rel="noreferrer" className="hover:text-starlight">Get Freighter</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
