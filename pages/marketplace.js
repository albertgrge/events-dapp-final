import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ethers } from "ethers";
import { useStateContext } from "../Context/index";
import { NFTS_AIRDROP_ABI, NFTS_AIRDROP_ADDRESS } from "../Context/constants";
import { useEthersProvider } from "../provider/hooks";
import Loader from "../Components/Loader";

export default function MarketplacePage() {
    const {
        address,
        isConnected,
        loader,
        BUY_RESALE,
        GET_ALL_EVENTS,
    } = useStateContext();

    const provider = useEthersProvider();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        if (provider) loadListings();
    }, [provider]);

    const loadListings = async () => {
        setLoading(true);
        try {
            const contract = new ethers.Contract(NFTS_AIRDROP_ADDRESS, NFTS_AIRDROP_ABI, provider);
            const [totalMinted, allEvents] = await Promise.all([
                contract.totalTicketsMinted(),
                GET_ALL_EVENTS(),
            ]);
            const total = totalMinted.toNumber();

            const eventMap = {};
            allEvents.forEach((e) => { eventMap[e.eventId] = e; });

            if (total === 0) { setListings([]); setLoading(false); return; }

            // Fetch all listings in parallel
            const tokenIds = Array.from({ length: total }, (_, i) => i + 1);
            const results = await Promise.all(
                tokenIds.map(async (tokenId) => {
                    try {
                        const listing = await contract.getResaleListing(tokenId);
                        if (!listing.active) return null;
                        const eventId = await contract.tokenToEvent(tokenId);
                        const ev = eventMap[eventId.toNumber()] || {};
                        return {
                            tokenId,
                            price: parseFloat(ethers.utils.formatEther(listing.price)),
                            priceWei: listing.price,
                            seller: listing.seller,
                            eventId: eventId.toNumber(),
                            eventName: ev.name || `Event #${eventId.toNumber()}`,
                            originalPrice: ev.ticketPrice || 0,
                            royaltyBps: ev.royaltyBps || 0,
                            eventImage: ev.image || null,
                        };
                    } catch { return null; }
                })
            );

            setListings(results.filter(Boolean));
        } catch (error) {
            console.error("Error loading listings:", error);
        }
        setLoading(false);
    };

    const handleBuy = async (tokenId) => {
        if (!isConnected) return alert("Please connect your wallet");
        const success = await BUY_RESALE(tokenId);
        if (success) await loadListings();
    };

    // Sorting
    const sortedListings = [...listings].sort((a, b) => {
        if (sortBy === "lowest") return a.price - b.price;
        if (sortBy === "highest") return b.price - a.price;
        return b.tokenId - a.tokenId; // newest
    });

    return (
        <>
            <Head>
                <title>Marketplace — EventTicketNFT</title>
                <meta name="description" content="Buy and sell event tickets securely on-chain." />
            </Head>

            {loader && <Loader />}

            <div className="page container">
                <div className="page-header">
                    <h1 className="page-title">Ticket Marketplace</h1>
                    <p className="page-subtitle">Buy and sell event tickets securely on-chain</p>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: 16, marginBottom: 32, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="text-muted text-sm">Sort by:</span>
                    <div className="tabs" style={{ marginBottom: 0 }}>
                        {[
                            { key: "newest", label: "Newest" },
                            { key: "lowest", label: "Lowest Price" },
                            { key: "highest", label: "Highest Price" },
                        ].map((s) => (
                            <button
                                key={s.key}
                                className={`tab ${sortBy === s.key ? "active" : ""}`}
                                onClick={() => setSortBy(s.key)}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <span className="text-muted text-sm" style={{ marginLeft: "auto" }}>
                        {listings.length} listing{listings.length !== 1 ? "s" : ""} available
                    </span>
                </div>

                {/* Info Banner */}
                <div
                    className="card-glass mb-8"
                    style={{
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        borderColor: "rgba(124, 58, 237, 0.3)",
                    }}
                >
                    <span>🛡️</span>
                    <span className="text-sm">
                        All resales enforce organizer-set price caps and royalties. No scalping.
                    </span>
                </div>

                {/* Listings Grid */}
                {loading ? (
                    <div className="text-center" style={{ padding: 60 }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                        <p className="text-muted">Loading marketplace...</p>
                    </div>
                ) : sortedListings.length === 0 ? (
                    <div className="card-glass text-center" style={{ padding: 60 }}>
                        <p style={{ fontSize: "1.2rem", marginBottom: 8 }}>No tickets listed for resale</p>
                        <p className="text-muted">
                            Check back later or{" "}
                            <Link href="/events" style={{ color: "var(--accent-purple)" }}>browse primary sales →</Link>
                        </p>
                    </div>
                ) : (
                    <div className="grid-3">
                        {sortedListings.map((listing) => (
                            <div key={listing.tokenId} className="card">
                                <div
                                    style={{
                                        height: 140,
                                        borderRadius: "var(--radius-md)",
                                        background: listing.eventImage
                                            ? `url(${listing.eventImage}) center/cover`
                                            : "var(--accent-gradient)",
                                        marginBottom: 16,
                                    }}
                                ></div>

                                <h3 style={{ marginBottom: 4, fontSize: "1.1rem" }}>{listing.eventName}</h3>
                                <p className="text-muted text-sm mb-4">Token #{listing.tokenId}</p>

                                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
                                    {listing.originalPrice > 0 && (
                                        <span className="text-muted text-sm" style={{ textDecoration: "line-through" }}>
                                            {listing.originalPrice} ETH
                                        </span>
                                    )}
                                    <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--success)" }}>
                                        {listing.price} ETH
                                    </span>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                    <span className="text-muted text-sm">
                                        Seller: {listing.seller?.slice(0, 6)}...{listing.seller?.slice(-4)}
                                    </span>
                                    <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>
                                        {listing.royaltyBps / 100}% royalty
                                    </span>
                                </div>

                                <button
                                    className="btn btn-primary btn-block btn-sm"
                                    onClick={() => handleBuy(listing.tokenId)}
                                    disabled={listing.seller?.toLowerCase() === address?.toLowerCase()}
                                >
                                    {listing.seller?.toLowerCase() === address?.toLowerCase()
                                        ? "Your Listing"
                                        : "Buy Now"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* List Your Ticket CTA */}
                <div className="card-glass mt-8" style={{ padding: "40px", textAlign: "center" }}>
                    <h2 style={{ marginBottom: 8 }}>Own a ticket you can't use?</h2>
                    <p className="text-muted mb-6">
                        List it for resale and earn back your ETH. Organizer royalties apply automatically.
                    </p>
                    <Link href="/my-tickets" className="btn btn-primary">
                        List a Ticket
                    </Link>
                </div>
            </div>
        </>
    );
}
