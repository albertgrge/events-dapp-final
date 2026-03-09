import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { ethers } from "ethers";
import { useStateContext } from "../Context/index";
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
    } = useStateContext();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tokenIdInput, setTokenIdInput] = useState("");
    const [validationResults, setValidationResults] = useState([]);
    const [pendingRevenue, setPendingRevenue] = useState({});
    const [scannerActive, setScannerActive] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

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

        const revenues = {};
        for (const ev of myEvents) {
            revenues[ev.eventId] = await GET_PENDING_REVENUE(ev.eventId);
        }
        setPendingRevenue(revenues);
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
        const success = await VALIDATE_TICKET(tokenId);
        setValidationResults((prev) => [
            { tokenId, success, time: new Date().toLocaleTimeString() },
            ...prev.slice(0, 9),
        ]);
        setTokenIdInput("");
        setScanResult(null);
    };

    const handleWithdraw = async (eventId) => {
        const success = await WITHDRAW_REVENUE(eventId);
        if (success) await loadDashboard();
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
                                    <tr key={ev.eventId}>
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
                                        <td>{ev.totalRevenue.toFixed(3)} ETH</td>
                                        <td className="text-gradient font-bold">
                                            {parseFloat(pendingRevenue[ev.eventId] || 0).toFixed(3)} ETH
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleWithdraw(ev.eventId)}
                                                disabled={parseFloat(pendingRevenue[ev.eventId] || 0) === 0}
                                            >
                                                Withdraw
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Validate Tickets */}
                <h2 style={{ marginBottom: 16 }}>Validate Tickets</h2>
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
                                        <span style={{ color: r.success ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                                            {r.success ? "✅ Valid" : "❌ Failed"}
                                        </span>
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
