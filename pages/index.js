import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Head from "next/head";
import { useStateContext } from "../Context/index";

// Particle Canvas Component
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];
    let mouse = { x: 0, y: 0 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse);

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? "124, 58, 237" : "59, 130, 246",
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();

        // Connect nearby particles
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });

        // Mouse interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(124, 58, 237, ${0.15 * (1 - dist / 200)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

// Floating 3D NFT Ticket
const FloatingTicket = ({ delay, style }) => (
  <div
    className="floating-ticket"
    style={{
      animationDelay: `${delay}s`,
      ...style,
    }}
  >
    <div className="floating-ticket-inner">
      <div className="floating-ticket-front">
        <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>🎫</div>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: 1 }}>NFT TICKET</div>
        <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>#0001</div>
      </div>
    </div>
  </div>
);

export default function Home() {
  const { GET_ALL_EVENTS, GET_TOTAL_TICKETS_MINTED, isConnected } = useStateContext();
  const [stats, setStats] = useState({ events: 0, tickets: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadStats();
    setTimeout(() => setVisible(true), 100);
  }, []);

  const loadStats = async () => {
    try {
      const events = await GET_ALL_EVENTS();
      const tickets = await GET_TOTAL_TICKETS_MINTED();
      setStats({ events: events.length, tickets });
    } catch (e) { }
  };

  return (
    <>
      <Head>
        <title>EventTicketNFT — The Future of Event Ticketing</title>
        <meta name="description" content="Mint NFT tickets, validate at the gate, and trade on-chain with organizer royalties." />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
                /* ── 3D Landing Page Styles ─── */
                .landing-hero {
                    position: relative;
                    min-height: 90vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    overflow: hidden;
                    perspective: 1000px;
                }

                .landing-hero::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 800px;
                    height: 800px;
                    background: radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 60%);
                    pointer-events: none;
                    animation: pulseGlow 4s ease-in-out infinite;
                }

                .landing-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -30%;
                    right: -10%;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%);
                    pointer-events: none;
                    animation: pulseGlow 5s ease-in-out infinite reverse;
                }

                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
                    50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
                }

                .hero-content {
                    position: relative;
                    z-index: 2;
                    max-width: 900px;
                    padding: 0 24px;
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 20px;
                    background: rgba(124, 58, 237, 0.1);
                    border: 1px solid rgba(124, 58, 237, 0.3);
                    border-radius: 50px;
                    font-size: 0.85rem;
                    color: #a78bfa;
                    margin-bottom: 32px;
                    animation: fadeInUp 0.6s ease forwards;
                    backdrop-filter: blur(10px);
                }

                .hero-title-3d {
                    font-family: 'Outfit', 'Space Grotesk', sans-serif;
                    font-size: 5rem;
                    font-weight: 800;
                    line-height: 1.05;
                    margin-bottom: 28px;
                    letter-spacing: -2px;
                    opacity: 0;
                    animation: title3DIn 1s ease forwards 0.2s;
                }

                .hero-title-3d .line-1 {
                    display: block;
                    color: rgba(255, 255, 255, 0.95);
                    text-shadow: 0 0 80px rgba(124, 58, 237, 0.3);
                }

                .hero-title-3d .line-2 {
                    display: block;
                    background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    background-size: 200% 200%;
                    animation: gradientShift 3s ease infinite;
                    filter: drop-shadow(0 0 30px rgba(124, 58, 237, 0.4));
                }

                .hero-title-3d .line-3 {
                    display: block;
                    font-size: 3.5rem;
                    font-weight: 400;
                    color: rgba(255, 255, 255, 0.6);
                    letter-spacing: 0;
                }

                @keyframes title3DIn {
                    0% { opacity: 0; transform: translateY(40px) rotateX(15deg); }
                    100% { opacity: 1; transform: translateY(0) rotateX(0); }
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .hero-desc {
                    font-size: 1.15rem;
                    color: rgba(255, 255, 255, 0.55);
                    max-width: 550px;
                    margin: 0 auto 40px;
                    line-height: 1.7;
                    opacity: 0;
                    animation: fadeInUp 0.8s ease forwards 0.5s;
                }

                .hero-buttons {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    opacity: 0;
                    animation: fadeInUp 0.8s ease forwards 0.7s;
                }

                .btn-glow {
                    position: relative;
                    padding: 16px 36px;
                    font-size: 1.05rem;
                    font-weight: 600;
                    border-radius: 50px;
                    overflow: hidden;
                    transition: all 0.3s;
                }

                .btn-glow-primary {
                    background: linear-gradient(135deg, #7c3aed, #3b82f6);
                    color: white;
                    border: none;
                    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
                }

                .btn-glow-primary:hover {
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 8px 40px rgba(124, 58, 237, 0.5);
                }

                .btn-glow-outline {
                    background: transparent;
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }

                .btn-glow-outline:hover {
                    border-color: rgba(124, 58, 237, 0.5);
                    background: rgba(124, 58, 237, 0.1);
                    transform: translateY(-2px);
                }

                /* ── Floating Tickets ─── */
                .floating-ticket {
                    position: absolute;
                    animation: float3D 6s ease-in-out infinite;
                    perspective: 600px;
                    z-index: 1;
                }

                .floating-ticket-inner {
                    width: 70px;
                    height: 90px;
                    transform-style: preserve-3d;
                    animation: ticketSpin 8s linear infinite;
                }

                .floating-ticket-front {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(59, 130, 246, 0.2));
                    border: 1px solid rgba(124, 58, 237, 0.3);
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(124, 58, 237, 0.15);
                }

                @keyframes float3D {
                    0%, 100% { transform: translateY(0) rotateX(0); }
                    50% { transform: translateY(-20px) rotateX(5deg); }
                }

                @keyframes ticketSpin {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }

                /* ── Features Section ─── */
                .features-section {
                    position: relative;
                    z-index: 2;
                    padding: 80px 0;
                }

                .section-label {
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    font-size: 0.8rem;
                    color: #7c3aed;
                    font-weight: 600;
                    margin-bottom: 12px;
                }

                .section-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 2.8rem;
                    font-weight: 700;
                    margin-bottom: 16px;
                    letter-spacing: -1px;
                }

                .feature-card-3d {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 40px 32px;
                    text-align: center;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                    cursor: default;
                }

                .feature-card-3d::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(124, 58, 237, 0.05), transparent);
                    opacity: 0;
                    transition: opacity 0.4s;
                }

                .feature-card-3d:hover {
                    transform: translateY(-8px) rotateX(2deg);
                    border-color: rgba(124, 58, 237, 0.3);
                    box-shadow: 0 20px 60px rgba(124, 58, 237, 0.15), 0 0 0 1px rgba(124, 58, 237, 0.1);
                }

                .feature-card-3d:hover::before {
                    opacity: 1;
                }

                .feature-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    margin: 0 auto 20px;
                    position: relative;
                }

                .feature-icon-1 { background: rgba(124, 58, 237, 0.15); }
                .feature-icon-2 { background: rgba(16, 185, 129, 0.15); }
                .feature-icon-3 { background: rgba(59, 130, 246, 0.15); }
                .feature-icon-4 { background: rgba(245, 158, 11, 0.15); }

                .feature-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 10px;
                }

                .feature-desc {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.9rem;
                    line-height: 1.6;
                }

                /* ── Stats Section ─── */
                .stats-section {
                    position: relative;
                    z-index: 2;
                    padding: 60px 0;
                }

                .stat-card-3d {
                    text-align: center;
                    padding: 40px 20px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    transition: all 0.3s;
                }

                .stat-card-3d:hover {
                    transform: translateY(-4px);
                    border-color: rgba(124, 58, 237, 0.2);
                }

                .stat-number {
                    font-family: 'Outfit', sans-serif;
                    font-size: 3rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #7c3aed, #06b6d4);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1;
                    margin-bottom: 8px;
                }

                .stat-text {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                /* ── CTA Section ─── */
                .cta-section {
                    position: relative;
                    z-index: 2;
                    padding: 80px 0;
                }

                .cta-card {
                    background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(59, 130, 246, 0.08));
                    border: 1px solid rgba(124, 58, 237, 0.15);
                    border-radius: 28px;
                    padding: 80px 60px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .cta-card::before {
                    content: '';
                    position: absolute;
                    top: -100px;
                    right: -100px;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(124, 58, 237, 0.1), transparent);
                    pointer-events: none;
                }

                .cta-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 16px;
                    letter-spacing: -1px;
                }

                /* ── How It Works ─── */
                .steps-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                    margin-top: 40px;
                }

                .step-card {
                    text-align: center;
                    position: relative;
                    padding: 32px 20px;
                }

                .step-number {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #7c3aed, #3b82f6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin: 0 auto 16px;
                }

                .step-title {
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .step-desc {
                    color: rgba(255, 255, 255, 0.45);
                    font-size: 0.85rem;
                    line-height: 1.5;
                }

                /* ── Video Tutorial Section ─── */
                .video-section {
                    position: relative;
                    z-index: 2;
                    padding: 80px 0;
                }

                .video-wrapper {
                    position: relative;
                    max-width: 820px;
                    margin: 0 auto;
                    border-radius: 20px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(124, 58, 237, 0.2);
                    box-shadow:
                        0 0 60px rgba(124, 58, 237, 0.08),
                        0 20px 60px rgba(0, 0, 0, 0.3);
                    transition: all 0.4s ease;
                }

                .video-wrapper:hover {
                    border-color: rgba(124, 58, 237, 0.4);
                    box-shadow:
                        0 0 80px rgba(124, 58, 237, 0.15),
                        0 25px 80px rgba(0, 0, 0, 0.4);
                    transform: translateY(-4px);
                }

                .video-wrapper::before {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    border-radius: 21px;
                    padding: 1px;
                    background: linear-gradient(135deg, rgba(124, 58, 237, 0.4), transparent 40%, transparent 60%, rgba(59, 130, 246, 0.4));
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                    z-index: 1;
                }

                .video-embed {
                    position: relative;
                    padding-bottom: 56.25%; /* 16:9 aspect ratio */
                    height: 0;
                    overflow: hidden;
                }

                .video-embed iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: none;
                }

                .video-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px 28px;
                    background: rgba(124, 58, 237, 0.05);
                    border-top: 1px solid rgba(124, 58, 237, 0.1);
                }

                .video-info-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #f6851b, #e2761b);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.3rem;
                    flex-shrink: 0;
                }

                .video-info-text h4 {
                    font-size: 0.95rem;
                    font-weight: 600;
                    margin-bottom: 2px;
                    color: rgba(255, 255, 255, 0.9);
                }

                .video-info-text p {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.45);
                }

                .video-tips {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    max-width: 820px;
                    margin: 24px auto 0;
                }

                .video-tip {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 18px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 12px;
                    transition: all 0.3s;
                }

                .video-tip:hover {
                    border-color: rgba(124, 58, 237, 0.25);
                    background: rgba(124, 58, 237, 0.05);
                }

                .video-tip-icon {
                    font-size: 1.3rem;
                    flex-shrink: 0;
                }

                .video-tip-text {
                    font-size: 0.82rem;
                    color: rgba(255, 255, 255, 0.6);
                    line-height: 1.4;
                }

                @media (max-width: 768px) {
                    .hero-title-3d { font-size: 3rem; }
                    .hero-title-3d .line-3 { font-size: 2rem; }
                    .section-title { font-size: 2rem; }
                    .floating-ticket { display: none; }
                    .steps-grid { grid-template-columns: repeat(2, 1fr); }
                    .cta-card { padding: 40px 24px; }
                    .cta-title { font-size: 1.8rem; }
                    .video-tips { grid-template-columns: 1fr; }
                    .video-info { padding: 16px 20px; }
                }
            `}</style>

      <ParticleCanvas />

      {/* Hero */}
      <section className="landing-hero">
        <FloatingTicket delay={0} style={{ top: "15%", left: "8%" }} />
        <FloatingTicket delay={1.5} style={{ top: "25%", right: "10%" }} />
        <FloatingTicket delay={3} style={{ bottom: "20%", left: "12%" }} />
        <FloatingTicket delay={2} style={{ bottom: "30%", right: "8%" }} />

        <div className="hero-content">
          <div className="hero-badge">
            ⚡ Built on Ethereum • Powered by NFTs
          </div>

          <h1 className="hero-title-3d">
            <span className="line-1">The Future of</span>
            <span className="line-2">Event Ticketing</span>
            <span className="line-3">is On-Chain</span>
          </h1>

          <p className="hero-desc">
            Mint NFT tickets, validate at the gate with QR codes, and trade
            securely with anti-scalping protection and organizer royalties.
          </p>

          <div className="hero-buttons">
            <Link href="/events" className="btn-glow btn-glow-primary">
              Explore Events →
            </Link>
            <Link href="/create-event" className="btn-glow btn-glow-outline">
              Create Event
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="section-label">Why Choose Us</div>
          <h2 className="section-title">
            Reimagining Events with <span className="text-gradient">Blockchain</span>
          </h2>
          <p className="text-muted mb-8" style={{ maxWidth: 500, margin: "0 auto 48px" }}>
            Every ticket is an NFT. Every transaction is transparent. Every event is trustless.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            <div className="feature-card-3d">
              <div className="feature-icon feature-icon-1">🎫</div>
              <h3 className="feature-title">NFT Tickets</h3>
              <p className="feature-desc">Unique ERC-721 tokens with IPFS metadata. Impossible to counterfeit.</p>
            </div>
            <div className="feature-card-3d">
              <div className="feature-icon feature-icon-2">🛡️</div>
              <h3 className="feature-title">Anti-Scalping</h3>
              <p className="feature-desc">Price caps and automatic royalties on every secondary sale.</p>
            </div>
            <div className="feature-card-3d">
              <div className="feature-icon feature-icon-3">📱</div>
              <h3 className="feature-title">QR Validation</h3>
              <p className="feature-desc">Camera-based scanning with on-chain validation. No double entry.</p>
            </div>
            <div className="feature-card-3d">
              <div className="feature-icon feature-icon-4">📊</div>
              <h3 className="feature-title">Live Analytics</h3>
              <p className="feature-desc">Real-time charts for sales, revenue, and ticket distribution.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="features-section">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Four Simple Steps</h2>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4 className="step-title">Create Event</h4>
              <p className="step-desc">Set name, date, location with Google Maps, ticket price & supply.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h4 className="step-title">Mint Tickets</h4>
              <p className="step-desc">Fans buy tickets as NFTs. Each mint is recorded on-chain.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h4 className="step-title">Scan & Validate</h4>
              <p className="step-desc">Organizers scan QR codes at the gate for instant validation.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h4 className="step-title">Earn & Analyze</h4>
              <p className="step-desc">Withdraw revenue & track analytics in real-time dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MetaMask Tutorial Video */}
      <section className="video-section">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="section-label">Get Started</div>
          <h2 className="section-title">
            Setup Your <span className="text-gradient">MetaMask Wallet</span>
          </h2>
          <p className="text-muted mb-8" style={{ maxWidth: 540, margin: "0 auto 40px" }}>
            New to Web3? Watch this quick tutorial to set up your MetaMask wallet
            and start buying NFT tickets in minutes.
          </p>

          <div className="video-wrapper">
            <div className="video-embed">
              <iframe
                src="https://www.youtube.com/embed/bN5LZQMuS1U"
                title="How to Setup Metamask Wallet | Metamask Wallet Tutorial Malayalam"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="video-info">
              <div className="video-info-icon">🦊</div>
              <div className="video-info-text">
                <h4>How to Setup Metamask Wallet | Tutorial Malayalam</h4>
                <p>Learn to install, configure, and secure your MetaMask wallet step by step</p>
              </div>
            </div>
          </div>

          <div className="video-tips">
            <div className="video-tip">
              <span className="video-tip-icon">📥</span>
              <span className="video-tip-text">Install MetaMask extension from the official Chrome Web Store</span>
            </div>
            <div className="video-tip">
              <span className="video-tip-icon">🔑</span>
              <span className="video-tip-text">Save your 12-word secret recovery phrase securely offline</span>
            </div>
            <div className="video-tip">
              <span className="video-tip-icon">🔗</span>
              <span className="video-tip-text">Connect to Sepolia testnet to start using this dApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section container">
        <div className="grid-3">
          <div className="stat-card-3d">
            <div className="stat-number">{stats.tickets.toLocaleString()}+</div>
            <div className="stat-text">Tickets Minted</div>
          </div>
          <div className="stat-card-3d">
            <div className="stat-number">{stats.events}+</div>
            <div className="stat-text">Events Created</div>
          </div>
          <div className="stat-card-3d">
            <div className="stat-number">100%</div>
            <div className="stat-text">On-Chain & Transparent</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section container">
        <div className="cta-card">
          <h2 className="cta-title">
            Ready to Host Your <span className="text-gradient">Next Event?</span>
          </h2>
          <p className="text-muted mb-8" style={{ maxWidth: 500, margin: "0 auto 32px" }}>
            Create your event, set ticket prices & royalties, and start selling NFT tickets — all in minutes.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <Link href="/create-event" className="btn-glow btn-glow-primary">
              🚀 Create Event Now
            </Link>
            <Link href="/dashboard" className="btn-glow btn-glow-outline">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
