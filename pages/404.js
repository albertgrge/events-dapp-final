import React, { useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
    const canvasRef = useRef(null);

    // Floating particles background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationId;
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Create floating particles
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                hue: Math.random() > 0.5 ? 270 : 250,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
                ctx.fill();
            });

            // Draw connecting lines between nearby particles
            particles.forEach((a, i) => {
                particles.slice(i + 1).forEach((b) => {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `hsla(270, 60%, 60%, ${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <>
            <Head>
                <title>404 — Page Not Found | EventTicketNFT</title>
                <meta name="description" content="The page you're looking for doesn't exist." />
            </Head>

            <style jsx global>{`
                .page-404-wrapper {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: #0a0a1a;
                    padding: 40px 20px;
                }

                .page-404-wrapper canvas {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                }

                /* Gradient orbs in background */
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                    pointer-events: none;
                }
                .orb-1 {
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(124, 58, 237, 0.25), transparent 70%);
                    top: -100px;
                    right: -100px;
                    animation: orbFloat1 8s ease-in-out infinite;
                }
                .orb-2 {
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent 70%);
                    bottom: -80px;
                    left: -80px;
                    animation: orbFloat2 10s ease-in-out infinite;
                }
                .orb-3 {
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent 70%);
                    top: 40%;
                    left: 50%;
                    transform: translateX(-50%);
                    animation: orbFloat3 6s ease-in-out infinite;
                }

                @keyframes orbFloat1 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-40px, 30px); }
                }
                @keyframes orbFloat2 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -40px); }
                }
                @keyframes orbFloat3 {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-30px); }
                }

                .content-404 {
                    position: relative;
                    z-index: 1;
                    text-align: center;
                    max-width: 700px;
                }

                /* Animated Astronaut Avatar */
                .astronaut-container {
                    position: relative;
                    width: 220px;
                    height: 220px;
                    margin: 0 auto 20px;
                    animation: floatAstronaut 4s ease-in-out infinite;
                }

                @keyframes floatAstronaut {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    25% { transform: translateY(-15px) rotate(1deg); }
                    50% { transform: translateY(-8px) rotate(3deg); }
                    75% { transform: translateY(-20px) rotate(-1deg); }
                }

                /* Astronaut SVG body */
                .astronaut-body {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .astronaut-svg {
                    width: 180px;
                    height: 180px;
                    filter: drop-shadow(0 0 30px rgba(124, 58, 237, 0.4));
                }

                /* Ticket floating near astronaut */
                .floating-ticket {
                    position: absolute;
                    top: 20px;
                    right: -10px;
                    width: 55px;
                    height: 30px;
                    background: linear-gradient(135deg, rgba(124, 58, 237, 0.6), rgba(168, 85, 247, 0.4));
                    border-radius: 4px;
                    border: 1px solid rgba(168, 85, 247, 0.5);
                    animation: ticketFloat 3s ease-in-out infinite;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    box-shadow: 0 0 15px rgba(124, 58, 237, 0.3);
                }
                .floating-ticket::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: -4px;
                    width: 8px;
                    height: 8px;
                    background: #0a0a1a;
                    border-radius: 50%;
                    transform: translateY(-50%);
                }

                @keyframes ticketFloat {
                    0%, 100% { transform: translateY(0) rotate(15deg); opacity: 0.9; }
                    50% { transform: translateY(-10px) rotate(5deg); opacity: 1; }
                }

                /* Small floating blockchain icons */
                .float-icon {
                    position: absolute;
                    font-size: 1.2rem;
                    opacity: 0.15;
                    animation: iconDrift 12s linear infinite;
                    pointer-events: none;
                    z-index: 0;
                }
                .float-icon:nth-child(1) { top: 10%; left: 8%; animation-delay: 0s; animation-duration: 14s; }
                .float-icon:nth-child(2) { top: 20%; right: 12%; animation-delay: -3s; animation-duration: 18s; }
                .float-icon:nth-child(3) { bottom: 25%; left: 15%; animation-delay: -6s; animation-duration: 16s; }
                .float-icon:nth-child(4) { bottom: 15%; right: 8%; animation-delay: -9s; animation-duration: 20s; }
                .float-icon:nth-child(5) { top: 50%; left: 5%; animation-delay: -2s; animation-duration: 15s; }
                .float-icon:nth-child(6) { top: 35%; right: 5%; animation-delay: -7s; animation-duration: 17s; }

                @keyframes iconDrift {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
                    25% { opacity: 0.2; }
                    50% { transform: translateY(-40px) rotate(180deg); opacity: 0.15; }
                    75% { opacity: 0.2; }
                    100% { transform: translateY(0) rotate(360deg); opacity: 0.1; }
                }

                /* Glowing 404 text */
                .text-404 {
                    font-size: clamp(6rem, 15vw, 10rem);
                    font-weight: 800;
                    line-height: 1;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #7c3aed, #a855f7, #c084fc, #7c3aed);
                    background-size: 300% 300%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gradientShift 4s ease infinite;
                    filter: drop-shadow(0 0 40px rgba(124, 58, 237, 0.5));
                    letter-spacing: -4px;
                    position: relative;
                }

                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .text-404-glow {
                    position: absolute;
                    inset: 0;
                    font-size: inherit;
                    font-weight: inherit;
                    letter-spacing: inherit;
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: blur(30px);
                    opacity: 0.4;
                    z-index: -1;
                    animation: pulseGlow 3s ease-in-out infinite;
                }

                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }

                .headline-404 {
                    font-size: clamp(1.3rem, 3vw, 1.8rem);
                    font-weight: 700;
                    color: #e2e8f0;
                    margin-bottom: 12px;
                    line-height: 1.3;
                }

                .subtitle-404 {
                    font-size: clamp(0.9rem, 1.5vw, 1.05rem);
                    color: #64748b;
                    line-height: 1.7;
                    max-width: 500px;
                    margin: 0 auto 36px;
                }

                /* Buttons */
                .buttons-404 {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-bottom: 36px;
                }

                .btn-home {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #7c3aed, #6d28d9);
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.95rem;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(124, 58, 237, 0.15);
                }
                .btn-home:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(124, 58, 237, 0.5), 0 0 60px rgba(124, 58, 237, 0.2);
                }

                .btn-events {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 32px;
                    background: transparent;
                    color: #a78bfa;
                    font-weight: 600;
                    font-size: 0.95rem;
                    border: 1.5px solid rgba(124, 58, 237, 0.4);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                }
                .btn-events:hover {
                    background: rgba(124, 58, 237, 0.1);
                    border-color: rgba(124, 58, 237, 0.7);
                    transform: translateY(-2px);
                }

                /* Search bar */
                .search-404 {
                    max-width: 440px;
                    margin: 0 auto;
                    position: relative;
                }
                .search-404 input {
                    width: 100%;
                    padding: 14px 20px 14px 48px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(124, 58, 237, 0.2);
                    border-radius: 12px;
                    color: #e2e8f0;
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.3s;
                    backdrop-filter: blur(10px);
                }
                .search-404 input::placeholder {
                    color: #475569;
                }
                .search-404 input:focus {
                    border-color: rgba(124, 58, 237, 0.5);
                    box-shadow: 0 0 20px rgba(124, 58, 237, 0.15);
                    background: rgba(255, 255, 255, 0.06);
                }
                .search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #475569;
                    font-size: 1.1rem;
                    pointer-events: none;
                }

                /* Footer text */
                .footer-404 {
                    margin-top: 48px;
                    font-size: 0.75rem;
                    color: #334155;
                    letter-spacing: 0.5px;
                }

                /* Stars twinkling */
                .star {
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: #fff;
                    border-radius: 50%;
                    animation: twinkle 3s ease-in-out infinite;
                    z-index: 0;
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.5); }
                }
            `}</style>

            <div className="page-404-wrapper">
                {/* Particle canvas */}
                <canvas ref={canvasRef} />

                {/* Background orbs */}
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>

                {/* Floating blockchain icons */}
                <span className="float-icon">⛓️</span>
                <span className="float-icon">🔗</span>
                <span className="float-icon">⬡</span>
                <span className="float-icon">🎫</span>
                <span className="float-icon">📦</span>
                <span className="float-icon">💎</span>

                {/* Twinkling stars */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="star"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                ))}

                <div className="content-404">
                    {/* Animated Astronaut */}
                    <div className="astronaut-container">
                        <div className="astronaut-body">
                            <svg className="astronaut-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Helmet */}
                                <ellipse cx="100" cy="80" rx="52" ry="55" fill="#1e1e3a" stroke="#7c3aed" strokeWidth="2.5" />
                                <ellipse cx="100" cy="80" rx="42" ry="45" fill="#0f0f2a" />
                                {/* Visor reflection */}
                                <ellipse cx="90" cy="72" rx="25" ry="28" fill="url(#visorGrad)" opacity="0.6" />
                                {/* Eyes */}
                                <circle cx="85" cy="78" r="6" fill="#a78bfa">
                                    <animate attributeName="r" values="6;5;6" dur="3s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="115" cy="78" r="6" fill="#a78bfa">
                                    <animate attributeName="r" values="6;5;6" dur="3s" repeatCount="indefinite" />
                                </circle>
                                {/* Eye shine */}
                                <circle cx="88" cy="75" r="2" fill="#e9d5ff" />
                                <circle cx="118" cy="75" r="2" fill="#e9d5ff" />
                                {/* Confused eyebrows */}
                                <line x1="76" y1="65" x2="90" y2="68" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="110" y1="68" x2="124" y2="65" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" />
                                {/* Mouth (confused) */}
                                <path d="M90 95 Q100 90 110 95" stroke="#c4b5fd" strokeWidth="2" fill="none" strokeLinecap="round" />
                                {/* Body */}
                                <rect x="70" y="130" rx="15" ry="15" width="60" height="50" fill="#1e1e3a" stroke="#7c3aed" strokeWidth="2" />
                                {/* Backpack */}
                                <rect x="62" y="135" rx="5" ry="5" width="12" height="30" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1.5" />
                                {/* Arms */}
                                <path d="M70 145 Q50 150 45 165" stroke="#7c3aed" strokeWidth="3" fill="none" strokeLinecap="round">
                                    <animate attributeName="d" values="M70 145 Q50 150 45 165;M70 145 Q48 148 42 160;M70 145 Q50 150 45 165" dur="4s" repeatCount="indefinite" />
                                </path>
                                <path d="M130 145 Q150 140 155 155" stroke="#7c3aed" strokeWidth="3" fill="none" strokeLinecap="round">
                                    <animate attributeName="d" values="M130 145 Q150 140 155 155;M130 145 Q152 138 158 150;M130 145 Q150 140 155 155" dur="3.5s" repeatCount="indefinite" />
                                </path>
                                {/* Gloves */}
                                <circle cx="43" cy="167" r="6" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1.5" />
                                <circle cx="157" cy="157" r="6" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1.5" />
                                {/* Legs */}
                                <rect x="78" y="175" rx="4" ry="4" width="14" height="20" fill="#1e1e3a" stroke="#7c3aed" strokeWidth="1.5" />
                                <rect x="108" y="175" rx="4" ry="4" width="14" height="20" fill="#1e1e3a" stroke="#7c3aed" strokeWidth="1.5" />
                                {/* Helmet antenna */}
                                <line x1="100" y1="25" x2="100" y2="12" stroke="#7c3aed" strokeWidth="2" />
                                <circle cx="100" cy="10" r="4" fill="#a855f7">
                                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                                </circle>
                                {/* Helmet glow ring */}
                                <ellipse cx="100" cy="80" rx="52" ry="55" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.3">
                                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                                </ellipse>
                                <defs>
                                    <radialGradient id="visorGrad" cx="0.4" cy="0.35">
                                        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                                    </radialGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="floating-ticket">🎫</div>
                    </div>

                    {/* 404 Number */}
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <div className="text-404">404</div>
                        <div className="text-404 text-404-glow" aria-hidden="true">404</div>
                    </div>

                    {/* Message */}
                    <h1 className="headline-404">Oops! This page got lost in the blockchain</h1>
                    <p className="subtitle-404">
                        The block you&apos;re looking for was either never mined or has been moved to a different chain. Don&apos;t worry, your assets are safe.
                    </p>

                    {/* Action Buttons */}
                    <div className="buttons-404">
                        <Link href="/" className="btn-home">
                            🏠 Back to Home
                        </Link>
                        <Link href="/events" className="btn-events">
                            🎫 Browse Events
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="search-404">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search for events..." />
                    </div>

                    <p className="footer-404">© 2026 EventTicketNFT. All rights reserved on the ledger.</p>
                </div>
            </div>
        </>
    );
}
