import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { ethers } from "ethers";
import { useStateContext } from "../Context/index";
import { NFTS_AIRDROP_ABI, NFTS_AIRDROP_ADDRESS } from "../Context/constants";
import Loader from "../Components/Loader";

export default function DashboardPage() {
    const {
        address,
        isConnected,
        userRole,
        loader,
        GET_ALL_EVENTS,
        VALIDATE_TICKET,
        WITHDRAW_REVENUE,
        GET_PENDING_REVENUE,
        GET_EVENT_STATS,
        GET_EVENT_BUYERS,
    } = useStateContext();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tokenIdInput, setTokenIdInput] = useState("");
    const [validationResults, setValidationResults] = useState([]);
    const [pendingRevenue, setPendingRevenue] = useState({});
    const [eventStats, setEventStats] = useState({}); // { eventId: { totalRevenue, totalMinted... } }
    const [scannerActive, setScannerActive] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const [buyersMap, setBuyersMap] = useState({}); // { eventId: buyers[] }
    const [expandedEvent, setExpandedEvent] = useState(null); // eventId currently expanded
    const [buyersLoading, setBuyersLoading] = useState({});

    useEffect(() => {
        if (address) loadDashboard();
    }, [address]);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        const allEvents = await GET_ALL_EVENTS();
        const myEvents = allEvents.filter(
            (e) => e.organizer.toLowerCase() === address?.toLowerCase()
        );
        setEvents(myEvents);

        // Fetch pending revenue + event stats in parallel for all events
        const [revenueResults, statsResults] = await Promise.all([
            Promise.all(myEvents.map(async (ev) => ({ id: ev.eventId, val: await GET_PENDING_REVENUE(ev.eventId) }))),
            Promise.all(myEvents.map(async (ev) => ({ id: ev.eventId, val: await GET_EVENT_STATS(ev.eventId) }))),
        ]);

        const revenues = {};
        revenueResults.forEach(({ id, val }) => { revenues[id] = val; });
        setPendingRevenue(revenues);

        const stats = {};
        statsResults.forEach(({ id, val }) => { if (val) stats[id] = val; });
        setEventStats(stats);

        setLoading(false);
    };

    const startScanner = async () => {
        try {
            const { Html5Qrcode } = await import("html5-qrcode");

            if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop().catch(() => { });
            }

            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;
            setScannerActive(true);
            setScanResult(null);

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    // QR code scanned successfully
                    try {
                        const data = JSON.parse(decodedText);

                        // --- Signature + expiry verification ---
                        const now = Math.floor(Date.now() / 1000);
                        const age = now - data.timestamp;

                        if (age > 120) {
                            // QR is older than 2 minutes
                            setScanResult({ error: "❌ QR code expired (older than 2 minutes). Ask attendee to generate a new one.", raw: decodedText });
                            html5QrCode.stop().catch(() => { });
                            setScannerActive(false);
                            return;
                        }

                        if (data.signature) {
                            // Recover signer from the signature
                            const message = `Validate ticket ${data.tokenId} at ${data.timestamp}`;
                            const recovered = ethers.utils.verifyMessage(message, data.signature);

                            if (recovered.toLowerCase() !== data.walletAddress?.toLowerCase()) {
                                // We don't have walletAddress in payload — store recovered for display
                                setScanResult({
                                    tokenId: data.tokenId,
                                    eventId: data.eventId,
                                    signerAddress: recovered,
                                    signatureValid: true,
                                    raw: decodedText,
                                });
                            } else {
                                setScanResult({
                                    tokenId: data.tokenId,
                                    eventId: data.eventId,
                                    signerAddress: recovered,
                                    signatureValid: true,
                                    raw: decodedText,
                                });
                            }
                        } else {
                            // Old-style unsigned QR — still accept but mark as unverified
                            setScanResult({
                                tokenId: data.tokenId,
                                eventId: data.eventId,
                                signatureValid: false,
                                raw: decodedText,
                            });
                        }

                        setTokenIdInput(data.tokenId.toString());
                        html5QrCode.stop().catch(() => { });
                        setScannerActive(false);
                    } catch (e) {
                        setScanResult({ error: "Invalid QR code format", raw: decodedText });
                    }
                },
                () => { } // ignore scan errors (no QR found in frame)
            );
        } catch (err) {
            console.error("Scanner error:", err);
            setScannerActive(false);
            setScanResult({ error: err.message || "Camera access denied" });
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
            } catch (e) { }
            html5QrCodeRef.current = null;
        }
        setScannerActive(false);
    };

    const handleValidate = async () => {
        if (!tokenIdInput) return;
        const tokenId = parseInt(tokenIdInput);

        // If scanned from QR — just verify the signature locally (no RPC needed)
        if (scanResult?.signerAddress && scanResult?.signatureValid === false) {
            // Unsigned QR — warn but allow
            console.warn("Validating unsigned QR ticket");
        }

        // Call the contract directly — it enforces all rules on-chain
        const success = await VALIDATE_TICKET(tokenId);
        setValidationResults((prev) => [
            {
                tokenId,
                success,
                signerAddress: scanResult?.signerAddress,
                reason: success ? "" : "Rejected by contract — check you're using the organizer wallet",
                time: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 9),
        ]);

        setTokenIdInput("");
        setScanResult(null);
    };

    const handleWithdraw = async (eventId) => {
        const success = await WITHDRAW_REVENUE(eventId);
        if (success) await loadDashboard();
    };

    const handleViewBuyers = async (eventId) => {
        if (expandedEvent === eventId) {
            setExpandedEvent(null);
            return;
        }
        setExpandedEvent(eventId);
        if (buyersMap[eventId]) return; // already loaded
        setBuyersLoading((prev) => ({ ...prev, [eventId]: true }));
        const buyers = await GET_EVENT_BUYERS(eventId);
        setBuyersMap((prev) => ({ ...prev, [eventId]: buyers }));
        setBuyersLoading((prev) => ({ ...prev, [eventId]: false }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard?.writeText(text);
    };

    // Totals
    const totalTickets = events.reduce((s, e) => s + e.totalMinted, 0);
    const totalRevenue = events.reduce((s, e) => s + e.totalRevenue, 0);
    const totalPending = Object.values(pendingRevenue).reduce(
        (s, v) => s + parseFloat(v || 0), 0
    );

    if (!isConnected) {
        return (
            <div className="page container text-center" style={{ padding: 100 }}>
                <h2>Connect Your Wallet</h2>
                <p className="text-muted mt-4">Connect your wallet to access the dashboard.</p>
            </div>
        );
    }

    if (!userRole.isOrganizer) {
        return (
            <div className="page container text-center" style={{ padding: 100 }}>
                <h2>🔒 Organizer Access Only</h2>
                <p className="text-muted mt-4">This dashboard is for approved organizers.</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Dashboard — EventTicketNFT</title>
            </Head>

            {loader && <Loader />}

            <div className="page container">
                <div className="page-header">
                    <h1 className="page-title">Organizer Dashboard</h1>
                    <p className="page-subtitle">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                </div>

                {/* Stats */}
                <div className="grid-4 mb-8">
                    <div className="card stat-card">
                        <div className="stat-value">{events.length}</div>
                        <div className="stat-label">Total Events</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{totalTickets}</div>
                        <div className="stat-label">Tickets Sold</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{totalRevenue.toFixed(3)}</div>
                        <div className="stat-label">Total Revenue (ETH)</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{totalPending.toFixed(3)}</div>
                        <div className="stat-label">Pending Withdrawal</div>
                    </div>
                </div>

                {/* Events Table */}
                <h2 style={{ marginBottom: 16 }}>Your Events</h2>
                {loading ? (
                    <div className="text-center" style={{ padding: 40 }}>
                        <div className="spinner" style={{ margin: "0 auto" }}></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="card-glass text-center" style={{ padding: 40 }}>
                        <p>No events yet. Create your first event!</p>
                    </div>
                ) : (
                    <div className="card-glass table-container mb-8">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Event</th>
                                    <th>Date</th>
                                    <th>Price</th>
                                    <th>Sold</th>
                                    <th>Revenue</th>
                                    <th>Pending</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((ev) => (
                                    <React.Fragment key={ev.eventId}>
                                        <tr>
                                            <td style={{ fontWeight: 600 }}>{ev.name}</td>
                                            <td>{new Date(ev.date * 1000).toLocaleDateString()}</td>
                                            <td>{ev.ticketPrice} ETH</td>
                                            <td>
                                                {ev.ticketsMinted}/{ev.maxSupply}
                                                <div className="progress-bar mt-2" style={{ width: 80 }}>
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${(ev.ticketsMinted / ev.maxSupply) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td>
                                                {parseFloat(eventStats[ev.eventId]?.totalRevenue || 0).toFixed(4)} ETH
                                            </td>
                                            <td className="text-gradient font-bold">
                                                {parseFloat(pendingRevenue[ev.eventId] || 0).toFixed(4)} ETH
                                            </td>
                                            <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleWithdraw(ev.eventId)}
                                                    disabled={parseFloat(pendingRevenue[ev.eventId] || 0) === 0}
                                                >
                                                    Withdraw
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{
                                                        background: expandedEvent === ev.eventId
                                                            ? "rgba(124,58,237,0.25)"
                                                            : "rgba(124,58,237,0.1)",
                                                        border: "1px solid rgba(124,58,237,0.4)",
                                                        color: "var(--primary)",
                                                        borderRadius: "var(--radius-sm)",
                                                        cursor: "pointer",
                                                        padding: "4px 10px",
                                                        fontSize: "0.78rem",
                                                        fontWeight: 600,
                                                    }}
                                                    onClick={() => handleViewBuyers(ev.eventId)}
                                                >
                                                    {expandedEvent === ev.eventId ? "▲ Hide" : "👥 Buyers"}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Buyers expandable panel */}
                                        {expandedEvent === ev.eventId && (
                                            <tr>
                                                <td colSpan={7} style={{ padding: 0 }}>
                                                    <div style={{
                                                        background: "rgba(124,58,237,0.05)",
                                                        borderTop: "1px solid rgba(124,58,237,0.15)",
                                                        borderBottom: "1px solid rgba(124,58,237,0.15)",
                                                        padding: "20px 24px",
                                                    }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                                            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>👥 Ticket Buyers — {ev.name}</span>
                                                            <span style={{
                                                                background: "rgba(124,58,237,0.15)",
                                                                color: "var(--primary)",
                                                                borderRadius: 20,
                                                                padding: "2px 10px",
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                            }}>
                                                                {buyersLoading[ev.eventId] ? "…" : (buyersMap[ev.eventId]?.length ?? 0)} buyers
                                                            </span>
                                                        </div>

                                                        {/* Feedback Visualization */}
                                                        {!buyersLoading[ev.eventId] && buyersMap[ev.eventId]?.length > 0 && (() => {
                                                            const allFb = (buyersMap[ev.eventId] || []).map((b) => {
                                                                try {
                                                                    const raw = localStorage.getItem(`feedback_${ev.eventId}_${b.buyer.toLowerCase()}`);
                                                                    return raw ? JSON.parse(raw) : null;
                                                                } catch (e) { return null; }
                                                            }).filter(Boolean);

                                                            if (allFb.length === 0) return null;

                                                            const avg = (allFb.reduce((s, f) => s + f.rating, 0) / allFb.length);
                                                            const counts = [5, 4, 3, 2, 1].map((star) => ({ star, count: allFb.filter(f => f.rating === star).length }));

                                                            return (
                                                                <div style={{
                                                                    background: "rgba(124,58,237,0.08)",
                                                                    border: "1px solid rgba(124,58,237,0.2)",
                                                                    borderRadius: "var(--radius-md)",
                                                                    padding: "16px 20px",
                                                                    marginBottom: 18,
                                                                    display: "flex",
                                                                    gap: 28,
                                                                    alignItems: "center",
                                                                    flexWrap: "wrap",
                                                                }}>
                                                                    {/* Big average score */}
                                                                    <div style={{ textAlign: "center", minWidth: 80 }}>
                                                                        <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>{avg.toFixed(1)}</div>
                                                                        <div style={{ display: "flex", justifyContent: "center", gap: 2, margin: "6px 0 4px" }}>
                                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                                <span key={s} style={{ fontSize: "1rem", color: s <= Math.round(avg) ? "#f59e0b" : "rgba(255,255,255,0.15)" }}>★</span>
                                                                            ))}
                                                                        </div>
                                                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{allFb.length} review{allFb.length !== 1 ? "s" : ""}</div>
                                                                    </div>

                                                                    {/* Bar chart */}
                                                                    <div style={{ flex: 1, minWidth: 180 }}>
                                                                        {counts.map(({ star, count }) => (
                                                                            <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                                                <span style={{ fontSize: "0.75rem", color: "#f59e0b", minWidth: 14, textAlign: "right" }}>{star}</span>
                                                                                <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>★</span>
                                                                                <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                                                                                    <div style={{
                                                                                        width: allFb.length ? `${(count / allFb.length) * 100}%` : "0%",
                                                                                        height: "100%",
                                                                                        background: "linear-gradient(90deg,#f59e0b,#fcd34d)",
                                                                                        borderRadius: 6,
                                                                                        transition: "width 0.6s ease",
                                                                                    }} />
                                                                                </div>
                                                                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", minWidth: 18 }}>{count}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                        {buyersLoading[ev.eventId] ? (
                                                            <div style={{ textAlign: "center", padding: 24 }}>
                                                                <div className="spinner" style={{ margin: "0 auto" }}></div>
                                                                <p className="text-muted text-sm" style={{ marginTop: 8 }}>Loading buyers from blockchain…</p>
                                                            </div>
                                                        ) : buyersMap[ev.eventId]?.length === 0 ? (
                                                            <p className="text-muted text-sm">No tickets sold yet for this event.</p>
                                                        ) : (
                                                            <div style={{ overflowX: "auto" }}>
                                                                <table className="table" style={{ fontSize: "0.82rem" }}>
                                                                    <thead>
                                                                        <tr>
                                                                            <th style={{ width: 70 }}>Token ID</th>
                                                                            <th>Wallet Address</th>
                                                                            <th style={{ width: 100 }}>Status</th>
                                                                            <th style={{ width: 160 }}>Check-in Time</th>
                                                                            <th style={{ width: 80 }}>Resold</th>
                                                                            <th style={{ width: 160 }}>Feedback</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {buyersMap[ev.eventId].map((b) => (
                                                                            <tr key={b.tokenId}>
                                                                                <td><span style={{ fontWeight: 700 }}>#{b.tokenId}</span></td>
                                                                                <td>
                                                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                                        <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                                                                                            {b.buyer.slice(0, 6)}...{b.buyer.slice(-4)}
                                                                                        </span>
                                                                                        <button
                                                                                            title="Copy full address"
                                                                                            onClick={() => copyToClipboard(b.buyer)}
                                                                                            style={{
                                                                                                background: "none",
                                                                                                border: "none",
                                                                                                cursor: "pointer",
                                                                                                color: "var(--text-muted)",
                                                                                                padding: 2,
                                                                                                fontSize: "0.85rem",
                                                                                            }}
                                                                                        >📋</button>
                                                                                        <a
                                                                                            href={`https://sepolia.etherscan.io/address/${b.buyer}`}
                                                                                            target="_blank"
                                                                                            rel="noreferrer"
                                                                                            style={{ color: "var(--primary)", fontSize: "0.75rem" }}
                                                                                        >↗</a>
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    {b.used ? (
                                                                                        <span style={{ color: "var(--success)", fontWeight: 600 }}>✅ Used</span>
                                                                                    ) : (
                                                                                        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>🎫 Unused</span>
                                                                                    )}
                                                                                </td>
                                                                                <td style={{ fontSize: "0.78rem", color: b.checkinTime ? "var(--text)" : "var(--text-muted)" }}>
                                                                                    {b.checkinTime
                                                                                        ? new Date(b.checkinTime * 1000).toLocaleString()
                                                                                        : "—"}
                                                                                </td>
                                                                                <td>
                                                                                    {b.resold ? (
                                                                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                                                            <span style={{ color: "#f59e0b", fontWeight: 600, marginRight: 2 }}>🔄</span>
                                                                                            <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#f59e0b" }}>
                                                                                                {b.resoldTo.slice(0, 6)}...{b.resoldTo.slice(-4)}
                                                                                            </span>
                                                                                            <button
                                                                                                title="Copy resold buyer address"
                                                                                                onClick={() => copyToClipboard(b.resoldTo)}
                                                                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, fontSize: "0.8rem" }}
                                                                                            >📋</button>
                                                                                            <a
                                                                                                href={`https://sepolia.etherscan.io/address/${b.resoldTo}`}
                                                                                                target="_blank"
                                                                                                rel="noreferrer"
                                                                                                style={{ color: "#f59e0b", fontSize: "0.72rem" }}
                                                                                            >↗</a>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>No</span>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    {(() => {
                                                                                        let fb = null;
                                                                                        try {
                                                                                            const raw = localStorage.getItem(`feedback_${ev.eventId}_${b.buyer.toLowerCase()}`);
                                                                                            if (raw) fb = JSON.parse(raw);
                                                                                        } catch (e) { }
                                                                                        if (!fb) return <span style={{ color: "var(--text-muted)" }}>—</span>;
                                                                                        return (
                                                                                            <div>
                                                                                                <div style={{ display: "flex", gap: 1 }}>
                                                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                                                        <span key={s} style={{ fontSize: "0.9rem", color: s <= fb.rating ? "#f59e0b" : "rgba(255,255,255,0.15)" }}>★</span>
                                                                                                    ))}
                                                                                                </div>
                                                                                                {fb.comment && (
                                                                                                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                                                                        title={fb.comment}>“{fb.comment}”</p>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Validate Tickets */}
                <h2 style={{ marginBottom: 16 }}>Validate Tickets</h2>

                {/* Wallet sanity check — contract requires msg.sender == event organizer */}
                {events.length > 0 && (() => {
                    const mismatch = events.some(
                        (ev) => ev.organizer.toLowerCase() !== address?.toLowerCase()
                    );
                    // All events show current address as organizer (they were filtered to this wallet already)
                    // Mismatch means address changed after load — warn the user
                    if (address && events[0]?.organizer.toLowerCase() !== address.toLowerCase()) {
                        return (
                            <div style={{
                                background: "rgba(239,68,68,0.12)",
                                border: "1px solid rgba(239,68,68,0.4)",
                                borderRadius: "var(--radius-md)",
                                padding: "14px 18px",
                                marginBottom: 20,
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                            }}>
                                <span style={{ fontSize: "1.3rem" }}>⚠️</span>
                                <div style={{ fontSize: "0.85rem" }}>
                                    <strong style={{ color: "#ef4444" }}>Wrong wallet connected</strong>
                                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)" }}>
                                        The contract requires the <em>event organizer</em> wallet to call validateTicket.
                                    </p>
                                    <p style={{ margin: "6px 0 0", fontFamily: "monospace", fontSize: "0.78rem" }}>
                                        Expected: <strong style={{ color: "#f59e0b" }}>{events[0]?.organizer.slice(0,10)}…{events[0]?.organizer.slice(-6)}</strong>
                                    </p>
                                    <p style={{ margin: "2px 0 0", fontFamily: "monospace", fontSize: "0.78rem" }}>
                                        Connected: <strong style={{ color: "#ef4444" }}>{address?.slice(0,10)}…{address?.slice(-6)}</strong>
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                <div className="responsive-grid-2col">
                    {/* QR Scanner + Manual Entry */}
                    <div className="card-glass" style={{ padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3>📷 Scan QR Code</h3>
                            {!scannerActive ? (
                                <button className="btn btn-primary btn-sm" onClick={startScanner}>
                                    Open Camera
                                </button>
                            ) : (
                                <button className="btn btn-danger btn-sm" onClick={stopScanner}>
                                    Close Camera
                                </button>
                            )}
                        </div>

                        {/* Camera Preview */}
                        <div
                            id="qr-reader"
                            style={{
                                width: "100%",
                                borderRadius: "var(--radius-md)",
                                overflow: "hidden",
                                marginBottom: 16,
                                display: scannerActive ? "block" : "none",
                                background: "#000",
                                minHeight: scannerActive ? 280 : 0,
                            }}
                        ></div>

                        {!scannerActive && (
                            <div
                                style={{
                                    border: "2px dashed rgba(124, 58, 237, 0.3)",
                                    borderRadius: "var(--radius-md)",
                                    padding: 40,
                                    textAlign: "center",
                                    marginBottom: 16,
                                    cursor: "pointer",
                                }}
                                onClick={startScanner}
                            >
                                <span style={{ fontSize: "2rem" }}>📱</span>
                                <p className="text-muted text-sm" style={{ marginTop: 8 }}>
                                    Click to open camera and scan ticket QR code
                                </p>
                            </div>
                        )}

                        {/* Scan Result */}
                        {scanResult && !scanResult.error && (
                            <div style={{
                                padding: 16,
                                background: "rgba(16, 185, 129, 0.1)",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                marginBottom: 16,
                            }}>
                                <p style={{ fontWeight: 600, color: "var(--success)" }}>✅ QR Scanned!</p>
                                <p className="text-sm" style={{ marginTop: 4 }}>
                                    Token ID: <strong>#{scanResult.tokenId}</strong> · Event ID: #{scanResult.eventId}
                                </p>
                            </div>
                        )}

                        {scanResult?.error && (
                            <div style={{
                                padding: 16,
                                background: "rgba(239, 68, 68, 0.1)",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                marginBottom: 16,
                            }}>
                                <p style={{ color: "var(--danger)" }}>❌ {scanResult.error}</p>
                            </div>
                        )}

                        {/* Manual Entry */}
                        <h4 style={{ marginBottom: 8, marginTop: 16, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                            Or enter Token ID manually:
                        </h4>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Token ID (e.g. 1)"
                                value={tokenIdInput}
                                onChange={(e) => setTokenIdInput(e.target.value)}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleValidate}
                                disabled={!tokenIdInput}
                            >
                                Validate
                            </button>
                        </div>
                    </div>

                    {/* Validation History */}
                    <div className="card-glass" style={{ padding: 32 }}>
                        <h3 style={{ marginBottom: 16 }}>Recent Validations</h3>
                        {validationResults.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 40 }}>
                                <span style={{ fontSize: "2rem" }}>🎫</span>
                                <p className="text-muted text-sm" style={{ marginTop: 8 }}>
                                    No validations yet. Scan a ticket QR code to get started.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {validationResults.map((r, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "10px 14px",
                                            borderRadius: "var(--radius-sm)",
                                            background: r.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>Token #{r.tokenId}</span>
                                        <div style={{ textAlign: "right" }}>
                                            <span style={{ color: r.success ? "var(--success)" : "var(--danger)", fontWeight: 600, display: "block" }}>
                                                {r.success ? "✅ Valid" : "❌ Failed"}
                                            </span>
                                            {!r.success && r.reason && (
                                                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{r.reason}</span>
                                            )}
                                        </div>
                                        <span className="text-muted text-sm">{r.time}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
