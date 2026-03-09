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
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        const allEvents = await GET_ALL_EVENTS();
        setEvents(allEvents);
        setFiltered(allEvents);
        setLoading(false);
    };

    useEffect(() => {
        let result = events;

        if (search) {
            result = result.filter((e) =>
                e.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (filter === "upcoming") {
            result = result.filter((e) => e.date > Date.now() / 1000);
        } else if (filter === "available") {
            result = result.filter((e) => e.ticketsLeft > 0);
        }

        setFiltered(result);
    }, [search, filter, events]);

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

                {/* Search & Filters */}
                <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ maxWidth: 400 }}
                    />
                    <div className="tabs" style={{ marginBottom: 0 }}>
                        {["all", "upcoming", "available"].map((f) => (
                            <button
                                key={f}
                                className={`tab ${filter === f ? "active" : ""}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="text-center text-muted" style={{ padding: 60 }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                        Loading events...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card-glass text-center" style={{ padding: 60 }}>
                        <p style={{ fontSize: "1.2rem", marginBottom: 8 }}>No events found</p>
                        <p className="text-muted">Be the first to create one!</p>
                        <Link href="/create-event" className="btn btn-primary mt-4" style={{ display: "inline-flex", marginTop: 16 }}>
                            Create Event
                        </Link>
                    </div>
                ) : (
                    <div className="grid-3">
                        {filtered.map((event) => (
                            <Link href={`/event/${event.eventId}`} key={event.eventId} style={{ textDecoration: "none" }}>
                                <div className="card event-card">
                                    <div
                                        className="event-card-image"
                                        style={{
                                            background: event.image
                                                ? `url(${event.image}) center/cover`
                                                : "var(--accent-gradient)",
                                        }}
                                    ></div>
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
                                            <span className="btn btn-primary btn-sm">Buy Ticket</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
