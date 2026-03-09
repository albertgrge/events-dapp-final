import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ethers } from "ethers";
import { useStateContext } from "../../Context/index";
import Loader from "../../Components/Loader";
import { useEthToInr } from "../../hooks/useEthToInr";

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
    const [loading, setLoading] = useState(true);
    const [minting, setMinting] = useState(false);

    useEffect(() => {
        if (id) loadEvent();
    }, [id]);

    const loadEvent = async () => {
        setLoading(true);
        const allEvents = await GET_ALL_EVENTS();
        const found = allEvents.find((e) => e.eventId === parseInt(id));
        setEvent(found);
        setLoading(false);
    };

    const handleMint = async () => {
        if (!isConnected) return alert("Please connect your wallet");
        if (!event) return;

        try {
            setMinting(true);

            // Create metadata for this ticket
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

            const tokenURI = await uploadJSONToIPFS(metadata);
            await MINT_TICKET(event.eventId, tokenURI);
            await loadEvent();
        } catch (e) {
            console.error(e);
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
                        <h1 style={{ fontSize: "2.2rem", marginBottom: 12 }}>{event.name}</h1>
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

                            {/* How to get ETH info */}
                            <div style={{
                                marginTop: 12,
                                padding: "12px 16px",
                                background: "rgba(124,58,237,0.08)",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid rgba(124,58,237,0.2)",
                            }}>
                                <p style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 6 }}>💡 Don't have test ETH?</p>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                                    Get free Sepolia test ETH from a faucet:
                                    {" "}
                                    <a href="https://sepoliafaucet.com" target="_blank" rel="noreferrer"
                                        style={{ color: "var(--accent-purple)" }}>sepoliafaucet.com</a>
                                </p>
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
