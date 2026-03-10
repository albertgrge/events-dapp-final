import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ethers } from "ethers";
import { useStateContext } from "../../Context/index";
import Loader from "../../Components/Loader";
import { useEthToInr } from "../../hooks/useEthToInr";
import TransakWidget from "../../Components/TransakWidget";

export default function EventDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const {
        GET_ALL_EVENTS,
        MINT_TICKET,
        BUY_RESALE,
        GET_PENDING_REVENUE,
        uploadToIPFS,
        uploadJSONToIPFS,
        address,
        isConnected,
        loader,
    } = useStateContext();
    const { convertEthToInr, ethToInr } = useEthToInr();

    const [event, setEvent] = useState(null);
    const [organizer, setOrganizer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [minting, setMinting] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        if (id) loadEvent();
    }, [id]);

    const loadEvent = async () => {
        setLoading(true);
        const allEvents = await GET_ALL_EVENTS();
        const found = allEvents.find((e) => e.eventId === parseInt(id));
        setEvent(found || null);

        // Fetch organizer name + contact from chain
        if (found?.organizer) {
            try {
                const { ethers: eth } = await import("ethers");
                const { NFTS_AIRDROP_ABI, NFTS_AIRDROP_ADDRESS } = await import("../../Context/constants");
                const { clientToProvider } = await import("../../provider/hooks");
                const rpc = new eth.providers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
                const contract = new eth.Contract(NFTS_AIRDROP_ADDRESS, NFTS_AIRDROP_ABI, rpc);
                const org = await contract.organizers(found.organizer);
                setOrganizer({ name: org.name, contact: org.contact, active: org.active });
            } catch {
                setOrganizer(null);
            }
        }
        setLoading(false);
    };

    const handleMint = async () => {
        if (!isConnected) {
            alert("Please connect your wallet first.");
            return;
        }
        if (!event) return;

        try {
            setMinting(true);

            // Try to build a tokenURI from IPFS; fall back to existing event metadataUrl
            // so minting still works even if Pinata is not configured.
            let tokenURI = event.metadataUrl || "";
            try {
                const metadata = {
                    name: `${event.name} — Ticket`,
                    description: `NFT Ticket for ${event.name}`,
                    image: event.image || "",
                    attributes: [
                        { trait_type: "Event", value: event.name },
                        { trait_type: "Date", value: new Date(event.date * 1000).toISOString() },
                        { trait_type: "Price", value: `${event.ticketPrice} ETH` },
                    ],
                };
                const uploaded = await uploadJSONToIPFS(metadata);
                if (uploaded) tokenURI = uploaded;
            } catch (ipfsErr) {
                console.warn("IPFS upload skipped, using event metadataUrl:", ipfsErr?.message);
                // tokenURI remains the event's existing metadataUrl
            }

            await MINT_TICKET(event.eventId, tokenURI);
            await loadEvent();
        } catch (e) {
            console.error("Mint error:", e);
            // MINT_TICKET already shows a toast via notifyError,
            // so we only need to surface unexpected errors here
        } finally {
            setMinting(false);
        }
    };

    if (loading) {
        return (
            <div className="page container text-center" style={{ padding: 100 }}>
                <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                <p className="text-muted">Loading event...</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="page container text-center" style={{ padding: 100 }}>
                <h2>Event not found</h2>
                <p className="text-muted mt-4">This event may not exist.</p>
            </div>
        );
    }

    const soldOut = event.ticketsMinted >= event.maxSupply;
    const maxResalePrice = event.maxResaleMultiplier > 0
        ? (event.ticketPrice * event.maxResaleMultiplier).toFixed(4)
        : "No limit";

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = `🎟 Check out "${event.name}" on EventTicketNFT! Get your NFT ticket here:`;

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };
    const shareTwitter = () => window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        "_blank"
    );
    const shareWhatsApp = () => window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
        "_blank"
    );

    return (
        <>
            <Head>
                <title>{event.name} — EventTicketNFT</title>
                <meta name="description" content={event.description} />
            </Head>

            {(loader || minting) && <Loader />}

            <div className="page container">
                <div className="responsive-grid-2col-detail">
                    {/* Left - Event Info */}
                    <div>
                        <div
                            style={{
                                height: 360,
                                borderRadius: "var(--radius-lg)",
                                background: event.image
                                    ? `url(${event.image}) center/cover`
                                    : "var(--accent-gradient)",
                                marginBottom: 32,
                            }}
                        ></div>
                        <h1 style={{ fontSize: "2.2rem", marginBottom: 8 }}>{event.name}</h1>

                        {/* Share buttons */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                            <button onClick={copyLink} style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: linkCopied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)",
                                color: linkCopied ? "#10b981" : "var(--text-muted)", transition: "all 0.2s",
                            }}>
                                {linkCopied ? "✓ Link Copied!" : "🔗 Copy Link"}
                            </button>
                            <button onClick={shareTwitter} style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                                border: "1px solid rgba(29,161,242,0.3)", background: "rgba(29,161,242,0.1)", color: "#1da1f2",
                            }}>
                                𝕏 Share on Twitter
                            </button>
                            <button onClick={shareWhatsApp} style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                                border: "1px solid rgba(37,211,102,0.3)", background: "rgba(37,211,102,0.1)", color: "#25d366",
                            }}>
                                💬 Share on WhatsApp
                            </button>
                        </div>

                        <p className="text-muted mb-6" style={{ lineHeight: 1.8 }}>
                            {event.description || "No description provided."}
                        </p>
                        <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
                            <div>
                                <span className="text-sm text-muted">Date</span>
                                <p style={{ fontWeight: 600 }}>
                                    {new Date(event.date * 1000).toLocaleDateString("en-US", {
                                        weekday: "long", year: "numeric", month: "long", day: "numeric"
                                    })}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm text-muted">Location</span>
                                <p style={{ fontWeight: 600 }}>{event.location}</p>
                            </div>
                        </div>

                        {/* Organizer Info Card */}
                        {organizer && (
                            <div style={{
                                background: "rgba(124,58,237,0.08)",
                                border: "1px solid rgba(124,58,237,0.2)",
                                borderRadius: "var(--radius-md)",
                                padding: "16px 20px",
                                marginTop: 24,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: "50%",
                                    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "1.3rem", flexShrink: 0,
                                }}>🏆</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Organizer</p>
                                    <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 2 }}>{organizer.name || "—"}</p>
                                    {organizer.contact && (
                                        <a
                                            href={`mailto:${organizer.contact}`}
                                            style={{ fontSize: "0.82rem", color: "var(--accent-purple)", wordBreak: "break-all" }}
                                        >
                                            ✉ {organizer.contact}
                                        </a>
                                    )}
                                </div>
                                {organizer.active && (
                                    <span style={{
                                        flexShrink: 0,
                                        background: "rgba(16,185,129,0.15)",
                                        color: "#10b981",
                                        border: "1px solid rgba(16,185,129,0.3)",
                                        borderRadius: 20, padding: "3px 10px",
                                        fontSize: "0.72rem", fontWeight: 700,
                                    }}>✓ Verified</span>
                                )}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid-4" style={{ marginTop: 32 }}>
                            <div className="card stat-card">
                                <div className="stat-value" style={{ fontSize: "1.5rem" }}>{event.totalMinted}</div>
                                <div className="stat-label">Minted</div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-value" style={{ fontSize: "1.5rem" }}>{event.totalValidated}</div>
                                <div className="stat-label">Validated</div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-value" style={{ fontSize: "1.5rem" }}>{event.totalRevenue.toFixed(3)}</div>
                                <div className="stat-label">Revenue (ETH)</div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-value" style={{ fontSize: "1.5rem" }}>{event.totalResales}</div>
                                <div className="stat-label">Resales</div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Purchase Card */}
                    <div>
                        <div className="card-glass" style={{ padding: 32, position: "sticky", top: 100 }}>
                            <div style={{ marginBottom: 24 }}>
                                <span className="text-sm text-muted">Ticket Price</span>
                                <div className="text-gradient" style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                                    {event.ticketPrice} ETH
                                </div>
                                {convertEthToInr(event.ticketPrice) && (
                                    <div className="text-muted" style={{ fontSize: "1rem", marginTop: 4 }}>
                                        ≈ {convertEthToInr(event.ticketPrice)}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span className="text-muted">Tickets Available</span>
                                    <span style={{ fontWeight: 600 }}>{event.ticketsLeft} / {event.maxSupply}</span>
                                </div>
                                <div className="progress-bar" style={{ height: 8 }}>
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(event.ticketsMinted / event.maxSupply) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span className="text-muted text-sm">Organizer</span>
                                    <span className="text-sm">{event.organizer?.slice(0, 6)}...{event.organizer?.slice(-4)} ✅</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span className="text-muted text-sm">Resale Royalty</span>
                                    <span className="text-sm">{event.royaltyBps / 100}%</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span className="text-muted text-sm">Max Resale Price</span>
                                    <span className="text-sm">{maxResalePrice} {event.maxResaleMultiplier > 0 ? "ETH" : ""}</span>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg btn-block"
                                onClick={handleMint}
                                disabled={soldOut || !isConnected || minting}
                            >
                                {soldOut ? "Sold Out" : minting ? "Minting..." : "🎫 Mint NFT Ticket"}
                            </button>

                            {/* Fiat on-ramp via Transak */}
                            <div style={{ marginTop: 12 }}>
                                <TransakWidget
                                    walletAddress={address}
                                    fiatAmount={event.ticketPrice ? Math.ceil(parseFloat(event.ticketPrice) * (ethToInr || 250000)) : ""}
                                    buttonLabel="💳 Don't have ETH? Buy with ₹ (UPI/Card)"
                                    buttonClass="btn btn-outline btn-lg btn-block"
                                />
                            </div>
                            <p className="text-muted text-sm text-center mt-4">
                                Your ticket will be minted as an ERC-721 NFT
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
