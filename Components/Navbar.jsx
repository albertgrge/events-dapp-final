import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useStateContext } from "../Context/index";
import { useEthToInr } from "../hooks/useEthToInr";
import ProfileCard from "./ProfileCard";

const Navbar = () => {
    const router = useRouter();
    const { userRole, address, organizerStake, STAKE_TO_BECOME_ORGANIZER, UNSTAKE, isConnected } = useStateContext();
    const { convertEthToInr } = useEthToInr();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showStakeModal, setShowStakeModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [stakeName, setStakeName] = useState("");
    const [stakeContact, setStakeContact] = useState("");
    const [stakeAmount, setStakeAmount] = useState("0.01");

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/events", label: "Events" },
        { href: "/my-tickets", label: "My Tickets" },
        { href: "/marketplace", label: "Marketplace" },
        ...(userRole.isOrganizer
            ? [
                { href: "/create-event", label: "Create Event" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/analytics", label: "Analytics" },
            ]
            : []),
    ];

    const handleStake = async (e) => {
        e.preventDefault();
        if (!stakeName.trim()) return;
        const success = await STAKE_TO_BECOME_ORGANIZER(stakeName, stakeContact, stakeAmount);
        if (success) {
            setShowStakeModal(false);
            setStakeName("");
            setStakeContact("");
        }
    };

    const handleUnstake = async () => {
        if (window.confirm("Are you sure you want to unstake? You will lose organizer status.")) {
            await UNSTAKE();
        }
    };

    return (
        <>
            <nav className="navbar">
                <Link href="/">
                    <span className="navbar-logo">EventTicketNFT</span>
                </Link>

                {/* Desktop nav links */}
                <ul className="navbar-links">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={router.pathname === link.href ? "active" : ""}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="navbar-actions">
                    {userRole.isOrganizer && (
                        <span className="badge badge-purple" style={{ marginRight: 8 }}>
                            Organizer
                        </span>
                    )}
                    {isConnected && userRole.isUser && (
                        <button
                            className="btn btn-sm"
                            onClick={() => setShowStakeModal(true)}
                            style={{
                                marginRight: 8,
                                background: "var(--accent-gradient)",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                fontSize: "0.8rem",
                                borderRadius: "var(--radius-sm)",
                                cursor: "pointer",
                            }}
                        >
                            🚀 Become Organizer
                        </button>
                    )}
                    <ConnectButton
                        chainStatus="icon"
                        showBalance={false}
                        accountStatus="address"
                    />
                    {isConnected && (
                        <button
                            onClick={() => setShowProfile(true)}
                            title="View Profile"
                            style={{
                                marginLeft: 8,
                                width: 38, height: 38,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                                border: "2px solid rgba(124,58,237,0.5)",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 0 12px rgba(124,58,237,0.4)",
                                transition: "box-shadow 0.2s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,0.7)"}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 12px rgba(124,58,237,0.4)"}
                        >
                            {userRole?.isOrganizer ? "🏆" : "👤"}
                        </button>
                    )}
                    {/* Hamburger button — mobile only */}
                    <button
                        className="navbar-hamburger"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={`hamburger-line ${menuOpen ? "open" : ""}`}></span>
                        <span className={`hamburger-line ${menuOpen ? "open" : ""}`}></span>
                        <span className={`hamburger-line ${menuOpen ? "open" : ""}`}></span>
                    </button>
                </div>

                {/* Mobile slide-out menu */}
                {menuOpen && (
                    <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
                        <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                            <div className="mobile-menu-header">
                                <span className="navbar-logo">EventTicketNFT</span>
                                <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>✕</button>
                            </div>
                            <ul className="mobile-menu-links">
                                {navLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={router.pathname === link.href ? "active" : ""}
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="mobile-menu-badges">
                                {userRole.isOrganizer && <span className="badge badge-purple">Organizer</span>}
                                {isConnected && userRole.isUser && (
                                    <button
                                        className="btn btn-sm"
                                        onClick={() => { setMenuOpen(false); setShowStakeModal(true); }}
                                        style={{
                                            background: "var(--accent-gradient)",
                                            color: "#fff",
                                            border: "none",
                                            padding: "8px 16px",
                                            fontSize: "0.85rem",
                                            borderRadius: "var(--radius-sm)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        🚀 Become Organizer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Stake Modal */}
            {showStakeModal && (
                <div className="mobile-menu-overlay" onClick={() => setShowStakeModal(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card-glass" onClick={(e) => e.stopPropagation()} style={{ padding: 32, maxWidth: 440, width: "90%", animation: "fadeIn 0.2s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <h2 style={{ margin: 0 }}>🚀 Become an Organizer</h2>
                            <button onClick={() => setShowStakeModal(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.3rem", cursor: "pointer" }}>✕</button>
                        </div>
                        <p className="text-muted" style={{ marginBottom: 24 }}>
                            Stake ETH to become an event organizer. You can unstake at any time to get your ETH back.
                        </p>
                        <form onSubmit={handleStake}>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Your Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. John Doe"
                                    value={stakeName}
                                    onChange={(e) => setStakeName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Contact (email, Twitter, etc.)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. @johndoe"
                                    value={stakeContact}
                                    onChange={(e) => setStakeContact(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label className="form-label">Stake Amount (ETH) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="0.01"
                                    step="0.01"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                    required
                                />
                                <span className="text-sm text-muted" style={{ marginTop: 4, display: "block" }}>
                                    Minimum: 0.01 ETH {convertEthToInr(0.01) && `(${convertEthToInr(0.01)})`}
                                </span>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg btn-block">
                                ⚡ Stake {stakeAmount} ETH {convertEthToInr(stakeAmount) && `(${convertEthToInr(stakeAmount)})`} & Become Organizer
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {showProfile && (
                <ProfileCard onClose={() => setShowProfile(false)} />
            )}
        </>
    );
};

export default Navbar;
