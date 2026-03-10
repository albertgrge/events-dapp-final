import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { useStateContext } from "../Context/index";
import { useEthToInr } from "../hooks/useEthToInr";

export default function EventsPage() {
    const { GET_ALL_EVENTS } = useStateContext();
    const { convertEthToInr } = useEthToInr();
    const [events, setEvents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        setLoading(true);
        const allEvents = await GET_ALL_EVENTS();
        setEvents(allEvents);
        setLoading(false);
    };

    useEffect(() => {
        let result = [...events];

        // Search by name or location
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((e) =>
                e.name.toLowerCase().includes(q) ||
                (e.location || "").toLowerCase().includes(q)
            );
        }

        // Status filter
        const now = Date.now() / 1000;
        if (statusFilter === "upcoming") result = result.filter((e) => e.date > now);
        else if (statusFilter === "past") result = result.filter((e) => e.date <= now);
        else if (statusFilter === "available") result = result.filter((e) => e.ticketsLeft > 0);
        else if (statusFilter === "soldout") result = result.filter((e) => e.ticketsLeft === 0);

        // Sort
        if (sortBy === "newest") result.sort((a, b) => b.eventId - a.eventId);
        else if (sortBy === "oldest") result.sort((a, b) => a.eventId - b.eventId);
        else if (sortBy === "price-low") result.sort((a, b) => a.ticketPrice - b.ticketPrice);
        else if (sortBy === "price-high") result.sort((a, b) => b.ticketPrice - a.ticketPrice);
        else if (sortBy === "date") result.sort((a, b) => a.date - b.date);

        setFiltered(result);
    }, [search, statusFilter, sortBy, events]);

    return (
        <>
            <Head>
                <title>Discover Events — EventTicketNFT</title>
                <meta name="description" content="Browse and discover NFT-ticketed events." />
            </Head>

            <div className="page container">
                <div className="page-header">
                    <h1 className="page-title">Discover Events</h1>
                    <p className="page-subtitle">Browse events and mint your NFT ticket</p>
                </div>

                {/* ── Search + Filters ── */}
                <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
                        <span style={{
                            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                            fontSize: "1rem", pointerEvents: "none", opacity: 0.5,
                        }}>🔍</span>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 36, width: "100%" }}
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        className="form-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            flex: "0 0 auto", minWidth: 140,
                            background: "#1a1a2e", color: "#e2e8f0",
                            border: "1px solid rgba(255,255,255,0.15)",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">All Events</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                        <option value="available">Available</option>
                        <option value="soldout">Sold Out</option>
                    </select>

                    {/* Sort */}
                    <select
                        className="form-input"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            flex: "0 0 auto", minWidth: 160,
                            background: "#1a1a2e", color: "#e2e8f0",
                            border: "1px solid rgba(255,255,255,0.15)",
                            cursor: "pointer",
                        }}
                    >
                        <option value="newest">Sort: Newest First</option>
                        <option value="oldest">Sort: Oldest First</option>
                        <option value="price-low">Sort: Price Low → High</option>
                        <option value="price-high">Sort: Price High → Low</option>
                        <option value="date">Sort: By Event Date</option>
                    </select>

                    {/* Result count */}
                    {!loading && (
                        <span className="text-muted text-sm" style={{ whiteSpace: "nowrap" }}>
                            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {/* ── Events Grid ── */}
                {loading ? (
                    <div className="text-center text-muted" style={{ padding: 60 }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                        Loading events...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card-glass text-center" style={{ padding: 60 }}>
                        <p style={{ fontSize: "1.2rem", marginBottom: 8 }}>No events found</p>
                        <p className="text-muted">
                            {search ? `No results for "${search}"` : "Be the first to create one!"}
                        </p>
                        {search && (
                            <button className="btn btn-outline mt-4" style={{ marginTop: 16 }} onClick={() => setSearch("")}>
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid-3">
                        {filtered.map((event) => {
                            const isPast = event.date <= Date.now() / 1000;
                            const isSoldOut = event.ticketsLeft === 0;
                            return (
                                <Link href={`/event/${event.eventId}`} key={event.eventId} style={{ textDecoration: "none" }}>
                                    <div className="card event-card" style={{ opacity: isPast ? 0.7 : 1 }}>
                                        <div
                                            className="event-card-image"
                                            style={{
                                                background: event.image
                                                    ? `url(${event.image}) center/cover`
                                                    : "var(--accent-gradient)",
                                                position: "relative",
                                            }}
                                        >
                                            {isSoldOut && (
                                                <span style={{
                                                    position: "absolute", top: 10, right: 10,
                                                    background: "rgba(239,68,68,0.9)", color: "#fff",
                                                    padding: "3px 10px", borderRadius: 20,
                                                    fontSize: "0.7rem", fontWeight: 700,
                                                }}>SOLD OUT</span>
                                            )}
                                            {isPast && !isSoldOut && (
                                                <span style={{
                                                    position: "absolute", top: 10, right: 10,
                                                    background: "rgba(0,0,0,0.6)", color: "#fff",
                                                    padding: "3px 10px", borderRadius: 20,
                                                    fontSize: "0.7rem", fontWeight: 700,
                                                }}>ENDED</span>
                                            )}
                                        </div>
                                        <div className="event-card-body">
                                            <h3 className="event-card-title">{event.name}</h3>
                                            <div className="event-card-meta">
                                                <span>📅 {new Date(event.date * 1000).toLocaleDateString()}</span>
                                                <span>📍 {event.location}</span>
                                            </div>
                                            <div className="event-card-price">
                                                {event.ticketPrice} ETH
                                                {convertEthToInr(event.ticketPrice) && (
                                                    <span className="text-muted" style={{ fontSize: "0.8rem", marginLeft: 6 }}>
                                                        ({convertEthToInr(event.ticketPrice)})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mb-2">
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <span className="text-sm text-muted">Tickets sold</span>
                                                    <span className="text-sm">{event.ticketsMinted}/{event.maxSupply}</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${(event.ticketsMinted / event.maxSupply) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="event-card-footer">
                                                <span className="badge badge-purple">
                                                    {event.royaltyBps / 100}% royalty
                                                </span>
                                                <span className="btn btn-primary btn-sm">
                                                    {isSoldOut ? "View" : "Buy Ticket"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
