import React, { useState, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useStateContext } from "../Context/index";
import { useEthToInr } from "../hooks/useEthToInr";
import Loader from "../Components/Loader";

const RechartsComponents = dynamic(
    () => import("recharts").then((mod) => {
        const {
            BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
            XAxis, YAxis, CartesianGrid, Tooltip, Legend,
            ResponsiveContainer, LabelList,
        } = mod;

        const Charts = ({ events, eventStats, pendingRevenue }) => {
            const PURPLE = "#7c3aed";
            const CYAN = "#06b6d4";
            const GREEN = "#10b981";
            const AMBER = "#f59e0b";
            const PINK = "#ec4899";
            const COLORS = [PURPLE, CYAN, GREEN, AMBER, PINK, "#8b5cf6", "#14b8a6", "#f97316"];

            const tooltip = {
                backgroundColor: "#0f0f1a",
                border: "1px solid rgba(124,58,237,0.4)",
                borderRadius: 10, padding: "10px 14px",
                color: "#e2e8f0", fontSize: "0.83rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            };

            /* ── Data prep ── */
            const ticketData = events.map((ev) => ({
                name: ev.name.length > 12 ? ev.name.slice(0, 12) + "…" : ev.name,
                Sold: ev.ticketsMinted,
                Available: ev.maxSupply - ev.ticketsMinted,
                Total: ev.maxSupply,
            }));

            const revenueData = events.map((ev) => ({
                name: ev.name.length > 12 ? ev.name.slice(0, 12) + "…" : ev.name,
                "All-Time (ETH)": parseFloat((eventStats[ev.eventId]?.totalRevenue || 0)),
                "Withdrawable (ETH)": parseFloat((pendingRevenue[ev.eventId] || 0)),
            }));

            const totalSold = events.reduce((s, e) => s + e.ticketsMinted, 0);
            const totalAvail = events.reduce((s, e) => s + (e.maxSupply - e.ticketsMinted), 0);

            // Sell-through % per event — for Radial bar
            const radialData = events
                .map((ev, i) => ({
                    name: ev.name.length > 14 ? ev.name.slice(0, 14) + "…" : ev.name,
                    value: ev.maxSupply > 0 ? Math.round((ev.ticketsMinted / ev.maxSupply) * 100) : 0,
                    fill: COLORS[i % COLORS.length],
                }))
                .sort((a, b) => b.value - a.value);

            // Revenue pie — only events with revenue
            const revPie = events
                .map((ev, i) => ({
                    name: ev.name.length > 14 ? ev.name.slice(0, 14) + "…" : ev.name,
                    value: parseFloat(eventStats[ev.eventId]?.totalRevenue || 0),
                    fill: COLORS[i % COLORS.length],
                }))
                .filter((d) => d.value > 0);

            /* ── Custom Pie Label (outside) ── */
            const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
                const RADIAN = Math.PI / 180;
                const r = outerRadius + 22;
                const x = cx + r * Math.cos(-midAngle * RADIAN);
                const y = cy + r * Math.sin(-midAngle * RADIAN);
                if (percent < 0.05) return null;
                return (
                    <text
                        x={x} y={y}
                        fill="#e2e8f0"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        fontSize={11}
                        fontFamily="sans-serif"
                    >
                        {name} ({(percent * 100).toFixed(0)}%)
                    </text>
                );
            };

            /* ── Donut center label ── */
            const DonutCenter = ({ cx, cy, value, label }) => (
                <>
                    <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={700}>{value}</text>
                    <text x={cx} y={cy + 14} textAnchor="middle" fill="#9ca3af" fontSize={11}>{label}</text>
                </>
            );

            return (
                <>
                    {/* ── Row 1: Tickets (bar) + Sell-Through (radial) ── */}
                    <div className="responsive-grid-2col-chart" style={{ marginBottom: 24 }}>

                        {/* Grouped Bar: Sold vs Available */}
                        <div className="card-glass" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 4 }}>🎫 Tickets per Event</h3>
                            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 16 }}>Sold vs remaining capacity per event</p>
                            <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={ticketData} barCategoryGap="30%" barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={tooltip} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
                                    <Legend wrapperStyle={{ fontSize: "0.78rem", paddingTop: 8 }} />
                                    <Bar dataKey="Sold" fill={PURPLE} radius={[6, 6, 0, 0]}>
                                        <LabelList dataKey="Sold" position="top" style={{ fill: "#c4b5fd", fontSize: 11 }} />
                                    </Bar>
                                    <Bar dataKey="Available" fill="rgba(124,58,237,0.2)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Radial Bar: Sell-through % */}
                        <div className="card-glass" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 4 }}>📡 Sell-Through Rate</h3>
                            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 16 }}>% of capacity sold per event</p>
                            {radialData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={270}>
                                    <RadialBarChart
                                        cx="50%" cy="50%"
                                        innerRadius={20} outerRadius={110}
                                        barSize={14}
                                        data={radialData}
                                        startAngle={180} endAngle={-180}
                                    >
                                        <RadialBar
                                            background={{ fill: "rgba(255,255,255,0.04)" }}
                                            dataKey="value"
                                            cornerRadius={6}
                                            label={{ position: "insideStart", fill: "#fff", fontSize: 10 }}
                                        />
                                        <Legend
                                            iconSize={10}
                                            layout="vertical"
                                            verticalAlign="middle"
                                            align="right"
                                            wrapperStyle={{ fontSize: "0.75rem", color: "#9ca3af" }}
                                        />
                                        <Tooltip
                                            contentStyle={tooltip}
                                            formatter={(v) => [`${v}%`, "Sell-through"]}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <p style={{ color: "#6b7280" }}>No event data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Row 2: Revenue bar + Donut (sold vs avail) ── */}
                    <div className="responsive-grid-2col-chart" style={{ marginBottom: 24 }}>

                        {/* Revenue bar */}
                        <div className="card-glass" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 4 }}>💰 Revenue per Event (ETH)</h3>
                            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 16 }}>All-time earned vs still withdrawable</p>
                            <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={revenueData} barCategoryGap="30%" barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltip} formatter={(v) => `${v.toFixed(4)} ETH`} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
                                    <Legend wrapperStyle={{ fontSize: "0.78rem", paddingTop: 8 }} />
                                    <Bar dataKey="All-Time (ETH)" fill={GREEN} radius={[6, 6, 0, 0]}>
                                        <LabelList dataKey="All-Time (ETH)" position="top" formatter={(v) => v > 0 ? v.toFixed(3) : ""} style={{ fill: "#6ee7b7", fontSize: 10 }} />
                                    </Bar>
                                    <Bar dataKey="Withdrawable (ETH)" fill={AMBER} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Donut: Sold vs Available overall */}
                        <div className="card-glass" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 4 }}>🍩 Overall Ticket Status</h3>
                            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 16 }}>Total sold vs available across all events</p>
                            <ResponsiveContainer width="100%" height={270}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: "Sold", value: totalSold, fill: PURPLE },
                                            { name: "Available", value: totalAvail, fill: "rgba(124,58,237,0.18)" },
                                        ]}
                                        cx="50%" cy="50%"
                                        innerRadius={72} outerRadius={105}
                                        paddingAngle={3}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderPieLabel}
                                    >
                                        <Cell fill={PURPLE} />
                                        <Cell fill="rgba(124,58,237,0.2)" />
                                    </Pie>
                                    <DonutCenter cx="50%" cy="50%" value={totalSold} label="Tickets Sold" />
                                    <Tooltip contentStyle={tooltip} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ── Row 3: Revenue distribution pie (only if data) ── */}
                    {revPie.length > 0 && (
                        <div className="card-glass" style={{ padding: 24, marginBottom: 24 }}>
                            <h3 style={{ marginBottom: 4 }}>🥧 Revenue Distribution</h3>
                            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 16 }}>Which events generated the most revenue</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={revPie}
                                        cx="50%" cy="50%"
                                        outerRadius={110}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderPieLabel}
                                    >
                                        {revPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltip} formatter={(v) => `${v.toFixed(4)} ETH`} />
                                    <Legend
                                        wrapperStyle={{ fontSize: "0.78rem", color: "#9ca3af" }}
                                        formatter={(value) => <span style={{ color: "#d1d5db" }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            );
        };
        return Charts;
    }),
    { ssr: false, loading: () => <div className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }}></div></div> }
);

export default function AnalyticsPage() {
    const {
        address, isConnected, userRole, loader,
        GET_ALL_EVENTS, GET_PENDING_REVENUE, GET_EVENT_STATS,
    } = useStateContext();
    const { convertEthToInr, ethToInr } = useEthToInr();

    const [events, setEvents] = useState([]);
    const [eventStats, setEventStats] = useState({});
    const [pendingRevenue, setPendingRevenue] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (address) loadData(); }, [address]);

    const loadData = async () => {
        setLoading(true);
        const allEvents = await GET_ALL_EVENTS();
        const myEvents = allEvents.filter((e) => e.organizer.toLowerCase() === address?.toLowerCase());
        setEvents(myEvents);

        const [revResults, statsResults] = await Promise.all([
            Promise.all(myEvents.map(async (ev) => ({ id: ev.eventId, val: await GET_PENDING_REVENUE(ev.eventId) }))),
            Promise.all(myEvents.map(async (ev) => ({ id: ev.eventId, val: await GET_EVENT_STATS(ev.eventId) }))),
        ]);
        const revenues = {}; revResults.forEach(({ id, val }) => { revenues[id] = val; });
        const stats = {}; statsResults.forEach(({ id, val }) => { if (val) stats[id] = val; });
        setPendingRevenue(revenues);
        setEventStats(stats);
        setLoading(false);
    };

    const totalTicketsSold = events.reduce((s, e) => s + e.ticketsMinted, 0);
    const totalCapacity = events.reduce((s, e) => s + e.maxSupply, 0);
    const totalRevenue = events.reduce((s, e) => s + parseFloat(eventStats[e.eventId]?.totalRevenue || 0), 0);
    const totalPending = events.reduce((s, e) => s + parseFloat(pendingRevenue[e.eventId] || 0), 0);
    const totalValidated = events.reduce((s, e) => s + (eventStats[e.eventId]?.totalValidated || 0), 0);
    const totalResales = events.reduce((s, e) => s + (eventStats[e.eventId]?.totalResales || 0), 0);
    const sellRate = totalCapacity > 0 ? ((totalTicketsSold / totalCapacity) * 100).toFixed(1) : "0.0";
    const avgPrice = events.length > 0 ? events.reduce((s, e) => s + parseFloat(e.ticketPrice), 0) / events.length : 0;

    const StatCard = ({ icon, value, label, sub, subColor }) => (
        <div className="card stat-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{icon}</div>
            <div className="stat-value" style={{ fontSize: "1.5rem" }}>{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div style={{ fontSize: "0.7rem", color: subColor || "#10b981", marginTop: 3 }}>{sub}</div>}
        </div>
    );

    if (!isConnected) return (
        <div className="page container text-center" style={{ padding: 100 }}>
            <h2>Connect Your Wallet</h2>
            <p className="text-muted mt-4">Connect your wallet to view analytics.</p>
        </div>
    );
    if (!userRole.isOrganizer) return (
        <div className="page container text-center" style={{ padding: 100 }}>
            <h2>🔒 Organizer Access Only</h2>
            <p className="text-muted mt-4">Stake ETH to become an organizer and unlock analytics.</p>
        </div>
    );

    return (
        <>
            <Head>
                <title>Analytics — EventTicketNFT</title>
                <meta name="description" content="Event analytics dashboard for organizers." />
            </Head>
            {loader && <Loader />}

            <div className="page container">
                <div className="page-header">
                    <h1 className="page-title">📈 Event Analytics</h1>
                    <p className="page-subtitle">
                        Live on-chain performance data
                        {ethToInr ? <span style={{ color: "#6b7280", fontSize: "0.85rem" }}> · 1 ETH ≈ ₹{ethToInr.toLocaleString("en-IN")}</span> : null}
                    </p>
                </div>

                {/* ── 8 Stat Cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
                    <StatCard icon="🎪" value={events.length} label="Total Events" />
                    <StatCard icon="🎫" value={totalTicketsSold} label="Tickets Sold" />
                    <StatCard icon="📦" value={totalCapacity} label="Total Capacity" />
                    <StatCard icon="📈" value={`${sellRate}%`} label="Sell-Through Rate" />
                    <StatCard
                        icon="💰" value={`${totalRevenue.toFixed(4)}`}
                        label="Revenue (ETH)"
                        sub={convertEthToInr(totalRevenue) || null}
                    />
                    <StatCard
                        icon="💛" value={`${totalPending.toFixed(4)}`}
                        label="Withdrawable (ETH)"
                        sub={convertEthToInr(totalPending) || null}
                        subColor="#f59e0b"
                    />
                    <StatCard icon="✅" value={totalValidated} label="Validated Tickets" subColor="#06b6d4" />
                    <StatCard icon="🔄" value={totalResales} label="Resale Sales" subColor="#ec4899" />
                </div>

                {/* ── Charts ── */}
                {loading ? (
                    <div className="text-center" style={{ padding: 60 }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                        <p style={{ color: "#6b7280" }}>Loading data from blockchain...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div style={{
                        background: "rgba(124,58,237,0.06)",
                        border: "1px dashed rgba(124,58,237,0.25)",
                        borderRadius: 16, padding: 60, textAlign: "center",
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: 12 }}>📊</div>
                        <h3 style={{ marginBottom: 8 }}>No Events Yet</h3>
                        <p style={{ color: "#6b7280" }}>Create events and sell tickets to see charts here.</p>
                    </div>
                ) : (
                    <RechartsComponents events={events} eventStats={eventStats} pendingRevenue={pendingRevenue} />
                )}

                {/* ── Table ── */}
                {events.length > 0 && (
                    <>
                        <h2 style={{ marginBottom: 16, marginTop: 8 }}>📋 Event Breakdown</h2>
                        <div className="card-glass table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Price (ETH)</th>
                                        <th>Sold / Cap</th>
                                        <th>Sell Rate</th>
                                        <th>Validated</th>
                                        <th>Resales</th>
                                        <th>Revenue (ETH)</th>
                                        <th>Withdrawable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((ev) => {
                                        const sell = ev.maxSupply > 0 ? ((ev.ticketsMinted / ev.maxSupply) * 100).toFixed(0) : 0;
                                        const st = eventStats[ev.eventId];
                                        const rev = parseFloat(st?.totalRevenue || 0);
                                        const pend = parseFloat(pendingRevenue[ev.eventId] || 0);
                                        return (
                                            <tr key={ev.eventId}>
                                                <td style={{ fontWeight: 600 }}>{ev.name}</td>
                                                <td>
                                                    <div>{ev.ticketPrice}</div>
                                                    <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{convertEthToInr(ev.ticketPrice)}</div>
                                                </td>
                                                <td>
                                                    <div>{ev.ticketsMinted} / {ev.maxSupply}</div>
                                                    <div className="progress-bar mt-2" style={{ width: 72 }}>
                                                        <div className="progress-fill" style={{ width: `${sell}%` }}></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${sell > 75 ? "badge-success" : sell > 25 ? "badge-warning" : "badge-danger"}`}>
                                                        {sell}%
                                                    </span>
                                                </td>
                                                <td>{st?.totalValidated ?? "—"}</td>
                                                <td>{st?.totalResales ?? "—"}</td>
                                                <td>
                                                    <div style={{ color: "#10b981", fontWeight: 600 }}>{rev.toFixed(4)}</div>
                                                    <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{convertEthToInr(rev)}</div>
                                                </td>
                                                <td>
                                                    <div style={{ color: "#f59e0b", fontWeight: 600 }}>{pend.toFixed(4)}</div>
                                                    <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{convertEthToInr(pend)}</div>
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
