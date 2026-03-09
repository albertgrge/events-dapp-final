import React, { useState, useEffect, useRef } from "react";
import { useStateContext } from "../Context/index";
import { useEthersProvider } from "../provider/hooks";
import { ethers } from "ethers";
import { useDisconnect } from "wagmi";

export default function ProfileCard({ onClose }) {
    const { address, isConnected, userRole } = useStateContext();
    const provider = useEthersProvider();
    const { disconnect } = useDisconnect();
    const [balance, setBalance] = useState(null);
    const [copied, setCopied] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);

    useEffect(() => {
        if (address && provider) {
            provider.getBalance(address)
                .then((bal) => setBalance(parseFloat(ethers.utils.formatEther(bal)).toFixed(4)))
                .catch(() => setBalance("0.0000"));
        }
    }, [address, provider]);

    const copyAddress = (e) => {
        e.stopPropagation();
        if (!address) return;
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = (e) => {
        e.stopPropagation();
        onClose();
    };

    const handleDisconnect = (e) => {
        e.stopPropagation();
        disconnect();
        onClose();
    };

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientY - rect.top) / rect.height - 0.5) * 18;
        const y = ((e.clientX - rect.left) / rect.width - 0.5) * -18;
        setTilt({ x, y });
    };
    const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

    const shortAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Not connected";

    const roleLabel = userRole?.isOrganizer ? "🏆 Organizer" : "🎟 Attendee";
    const roleGrad = userRole?.isOrganizer
        ? "linear-gradient(135deg,#f59e0b,#d97706)"
        : "linear-gradient(135deg,#7c3aed,#4f46e5)";

    if (!isConnected) return null;

    return (
        /* Full-screen backdrop — click it to close */
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 16,
            }}
        >
            {/* Card — stop clicks from closing the modal */}
            <div
                ref={cardRef}
                onClick={(e) => e.stopPropagation()}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    width: 360,
                    borderRadius: 24,
                    padding: 2,
                    background: "linear-gradient(135deg,#7c3aed,#4f46e5,#06b6d4)",
                    boxShadow: "0 32px 80px rgba(124,58,237,0.45)",
                    transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: "transform 0.15s ease",
                    willChange: "transform",
                }}
            >
                <div style={{
                    borderRadius: 22,
                    background: "linear-gradient(145deg,#0f0f23,#1a1a3e,#0f0f23)",
                    padding: 28,
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* Glow blobs */}
                    <div style={{
                        position: "absolute", top: -60, right: -60,
                        width: 200, height: 200, borderRadius: "50%",
                        background: "radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)",
                        pointerEvents: "none",
                    }} />
                    <div style={{
                        position: "absolute", bottom: -40, left: -40,
                        width: 160, height: 160, borderRadius: "50%",
                        background: "radial-gradient(circle,rgba(6,182,212,0.18) 0%,transparent 70%)",
                        pointerEvents: "none",
                    }} />

                    {/* ×  close button */}
                    <button
                        onClick={handleClose}
                        style={{
                            position: "absolute", top: 16, right: 16,
                            zIndex: 10,
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: "#fff", borderRadius: 8,
                            width: 32, height: 32, cursor: "pointer",
                            fontSize: "1.1rem", lineHeight: 1,
                        }}
                    >×</button>

                    {/* Avatar */}
                    <div style={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: roleGrad,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2rem", marginBottom: 16,
                        boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
                        border: "3px solid rgba(255,255,255,0.15)",
                    }}>
                        {userRole?.isOrganizer ? "🏆" : "👤"}
                    </div>

                    {/* Role badge */}
                    <div style={{
                        display: "inline-block", padding: "4px 14px",
                        borderRadius: 20, background: roleGrad,
                        fontSize: "0.72rem", fontWeight: 700, color: "#fff",
                        marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                        {roleLabel}
                    </div>

                    {/* Address */}
                    <div style={{
                        background: "rgba(255,255,255,0.05)", borderRadius: 12,
                        padding: "12px 16px", marginBottom: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Wallet Address
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ fontFamily: "monospace", fontSize: "0.88rem", color: "#e2e8f0" }}>
                                {shortAddress}
                            </span>
                            <button
                                onClick={copyAddress}
                                style={{
                                    flexShrink: 0,
                                    background: copied ? "rgba(16,185,129,0.2)" : "rgba(124,58,237,0.2)",
                                    border: `1px solid ${copied ? "rgba(16,185,129,0.5)" : "rgba(124,58,237,0.5)"}`,
                                    color: copied ? "#10b981" : "#a78bfa",
                                    borderRadius: 8, padding: "5px 12px",
                                    fontSize: "0.75rem", cursor: "pointer",
                                    fontWeight: 600, whiteSpace: "nowrap",
                                    transition: "all 0.2s",
                                }}
                            >
                                {copied ? "✓ Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* ETH Balance */}
                    <div style={{
                        background: "rgba(255,255,255,0.05)", borderRadius: 12,
                        padding: "12px 16px", marginBottom: 20,
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            ETH Balance
                        </p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                            <span style={{
                                fontSize: "1.7rem", fontWeight: 700,
                                background: "linear-gradient(135deg,#a78bfa,#06b6d4)",
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            }}>
                                {balance ?? "…"}
                            </span>
                            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>ETH</span>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.68rem", marginTop: 2 }}>Sepolia Testnet</p>
                    </div>

                    {/* Disconnect */}
                    <button
                        onClick={handleDisconnect}
                        style={{
                            width: "100%", padding: "13px",
                            borderRadius: 12,
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.35)",
                            color: "#f87171", fontSize: "0.9rem",
                            fontWeight: 600, cursor: "pointer",
                            letterSpacing: "0.02em",
                        }}
                    >
                        🔌 Disconnect Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
