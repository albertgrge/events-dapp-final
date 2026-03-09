import React, { useState, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useStateContext } from "../Context/index";
import Loader from "../Components/Loader";

// Dynamic import for Recharts (SSR not supported)
const RechartsComponents = dynamic(
    () => import("recharts").then((mod) => {
        const { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod;

        // Return a component that renders charts based on props
        const Charts = ({ events, pendingRevenue }) => {
            // Colors
            const COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6"];

            // Bar Chart Data — Tickets per event
            const ticketData = events.map((ev) => ({
                name: ev.name.length > 12 ? ev.name.slice(0, 12) + "…" : ev.name,
                sold: ev.ticketsMinted,
                total: ev.maxSupply,
                available: ev.maxSupply - ev.ticketsMinted,
            }));

            // Pie Chart Data — Revenue distribution
            const revenueData = events
                .filter((ev) => ev.totalRevenue > 0)
                .map((ev) => ({
                    name: ev.name.length > 15 ? ev.name.slice(0, 15) + "…" : ev.name,
                    value: parseFloat(ev.totalRevenue.toFixed(4)),
                }));

            // Pie Chart Data — Ticket status (sold vs available)
            const totalSold = events.reduce((s, e) => s + e.ticketsMinted, 0);
            const totalAvailable = events.reduce((s, e) => s + (e.maxSupply - e.ticketsMinted), 0);
            const ticketStatusData = [
                { name: "Sold", value: totalSold },
                { name: "Available", value: totalAvailable },
            ];

            // Revenue per event bar chart
            const revenueBarData = events.map((ev) => ({
                name: ev.name.length > 12 ? ev.name.slice(0, 12) + "…" : ev.name,
                revenue: parseFloat(ev.totalRevenue.toFixed(4)),
                pending: parseFloat(pendingRevenue[ev.eventId] || 0),
            }));

            // Price comparison
            const priceData = events.map((ev) => ({
                name: ev.name.length > 12 ? ev.name.slice(0, 12) + "…" : ev.name,
                price: parseFloat(ev.ticketPrice),
            }));

            const customTooltipStyle = {
                backgroundColor: "rgba(15, 15, 20, 0.95)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#fff",
                fontSize: "0.85rem",
            };

            return (
                <>
                    {/* Row 1: Tickets per Event + Ticket Status */}
                    <div className="responsive-grid-2col-chart" style={{ marginBottom: 24 }}>
                        {/* Bar: Tickets per Event */}
                        <div className="card-glass" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 16 }}>🎫 Tickets per Event</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={ticketData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                                    <Bar dataKey="sold" name="Sold" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="available" name="Available" fill="rgba(124,58,237,0.2)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie: Ticket Status */}
                        <div className="card-glass" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 16 }}>📊 Ticket Status</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={ticketStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        <Cell fill="#7c3aed" />
                                        <Cell fill="rgba(124,58,237,0.25)" />
                                    </Pie>
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Row 2: Revenue per Event + Revenue Distribution */}
                    <div className="responsive-grid-2col-chart" style={{ marginBottom: 24 }}>
                        {/* Bar: Revenue per Event */}
                        <div className="card-glass" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 16 }}>💰 Revenue per Event (ETH)</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={revenueBarData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                                    <Bar dataKey="revenue" name="Total Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pending" name="Pending Withdrawal" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie: Revenue Distribution */}
                        <div className="card-glass" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 16 }}>🥧 Revenue Share</h3>
                            {revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={revenueData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {revenueData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={customTooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
                                    <p className="text-muted">No revenue data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Ticket Price Comparison */}
                    <div className="card-glass" style={{ padding: 24, marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>💎 Ticket Price Comparison (ETH)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={priceData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Area type="monotone" dataKey="price" stroke="#7c3aed" strokeWidth={2} fill="url(#colorPrice)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            );
        };

        return Charts;
    }),
    { ssr: false, loading: () => <div className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }}></div></div> }
);

export default function AnalyticsPage() {
    const {
        address,
        isConnected,
        userRole,
        loader,
        GET_ALL_EVENTS,
        GET_PENDING_REVENUE,
    } = useStateContext();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingRevenue, setPendingRevenue] = useState({});

    useEffect(() => {
        if (address) loadData();
    }, [address]);

    const loadData = async () => {
        setLoading(true);
        const allEvents = await GET_ALL_EVENTS();
        // Show organizer's own events, or all events for admin
        const filtered = allEvents.filter((e) => e.organizer.toLowerCase() === address?.toLowerCase());
        setEvents(filtered);

        const revenues = {};
        for (const ev of filtered) {
            revenues[ev.eventId] = await GET_PENDING_REVENUE(ev.eventId);
        }
        setPendingRevenue(revenues);
        setLoading(false);
    };

    // Summary stats
    const totalEvents = events.length;
    const totalTicketsSold = events.reduce((s, e) => s + e.ticketsMinted, 0);
    const totalCapacity = events.reduce((s, e) => s + e.maxSupply, 0);
    const totalRevenue = events.reduce((s, e) => s + e.totalRevenue, 0);
    const avgPrice = totalEvents > 0
        ? events.reduce((s, e) => s + parseFloat(e.ticketPrice), 0) / totalEvents
        : 0;
    const sellThroughRate = totalCapacity > 0 ? ((totalTicketsSold / totalCapacity) * 100).toFixed(1) : 0;

    if (!isConnected) {
        return (
            <div className="page container text-center" style={{ padding: 100 }}>
                <h2>Connect Your Wallet</h2>
                <p className="text-muted mt-4">Connect your wallet to view analytics.</p>
            </div>
        );
    }

    if (!userRole.isOrganizer) {
        return (
            <div className="page container text-center" style={{ padding: 100 }}>
                <h2>🔒 Organizer Access Only</h2>
                <p className="text-muted mt-4">Analytics are available for organizers and admins.</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Analytics — EventTicketNFT</title>
            </Head>

            {loader && <Loader />}

            <div className="page container">
                <div className="page-header">
                    <h1 className="page-title">📈 Event Analytics</h1>
                    <p className="page-subtitle">
                        Your event performance
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="responsive-grid-5col" style={{ marginBottom: 32 }}>
                    <div className="card stat-card">
                        <div className="stat-value">{totalEvents}</div>
                        <div className="stat-label">Events</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{totalTicketsSold}</div>
                        <div className="stat-label">Tickets Sold</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{totalRevenue.toFixed(3)}</div>
                        <div className="stat-label">Revenue (ETH)</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{avgPrice.toFixed(4)}</div>
                        <div className="stat-label">Avg Price (ETH)</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{sellThroughRate}%</div>
                        <div className="stat-label">Sell-Through Rate</div>
                    </div>
                </div>

                {/* Charts */}
                {loading ? (
                    <div className="text-center" style={{ padding: 60 }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                        <p className="text-muted">Loading analytics data...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="card-glass text-center" style={{ padding: 60 }}>
                        <span style={{ fontSize: "3rem" }}>📊</span>
                        <h3 style={{ marginTop: 16 }}>No Events Yet</h3>
                        <p className="text-muted mt-4">Create events and sell tickets to see analytics here.</p>
                    </div>
                ) : (
                    <RechartsComponents events={events} pendingRevenue={pendingRevenue} />
                )}

                {/* Events Detail Table */}
                {events.length > 0 && (
                    <>
                        <h2 style={{ marginBottom: 16 }}>Event Details</h2>
                        <div className="card-glass table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Price (ETH)</th>
                                        <th>Sold / Total</th>
                                        <th>Sell Rate</th>
                                        <th>Revenue (ETH)</th>
                                        <th>Pending (ETH)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((ev) => {
                                        const sellRate = ev.maxSupply > 0
                                            ? ((ev.ticketsMinted / ev.maxSupply) * 100).toFixed(0)
                                            : 0;
                                        return (
                                            <tr key={ev.eventId}>
                                                <td style={{ fontWeight: 600 }}>{ev.name}</td>
                                                <td>{ev.ticketPrice}</td>
                                                <td>
                                                    {ev.ticketsMinted} / {ev.maxSupply}
                                                    <div className="progress-bar mt-2" style={{ width: 80 }}>
                                                        <div className="progress-fill" style={{ width: `${sellRate}%` }}></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${sellRate > 75 ? 'badge-success' : sellRate > 25 ? 'badge-warning' : 'badge-danger'}`}>
                                                        {sellRate}%
                                                    </span>
                                                </td>
                                                <td>{ev.totalRevenue.toFixed(4)}</td>
                                                <td className="text-gradient font-bold">
                                                    {parseFloat(pendingRevenue[ev.eventId] || 0).toFixed(4)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
