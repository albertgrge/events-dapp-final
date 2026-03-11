import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";
import { useWalletClient } from "wagmi";
import { useStateContext } from "../Context/index";
import { NFTS_AIRDROP_ABI, NFTS_AIRDROP_ADDRESS } from "../Context/constants";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";
import Loader from "../Components/Loader";
import AttendanceCertificate from "../Components/AttendanceCertificate";

/**
 * Generates a visually complex ticket ID from the tokenId + owner address.
 * e.g. tokenId=1, addr=0xABC... → "GCT-2025-7F3A4B2C"
 * The actual tokenId is still used for all contract interactions.
 */
const formatTicketId = (tokenId, address = "") => {
    try {
        const hash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(["uint256", "address"], [tokenId, address || ethers.constants.AddressZero])
        );
        const hex = hash.slice(2, 10).toUpperCase(); // 8 hex chars
        const year = new Date().getFullYear();
        return `GCT-${year}-${hex}`;
    } catch {
        return `GCT-${String(tokenId).padStart(6, "0")}`;
    }
};

export default function MyTicketsPage() {
    const {
        address,
        isConnected,
        loader,
        LIST_FOR_RESALE,
        CANCEL_RESALE,
    } = useStateContext();

    const provider = useEthersProvider();
    const signer = useEthersSigner();
    const { data: walletClient } = useWalletClient();  // routes to MetaMask mobile or extension
    const [tickets, setTickets] = useState([]);
    const [activeTab, setActiveTab] = useState("active");
    const [loading, setLoading] = useState(true);
    const [resalePrice, setResalePrice] = useState("");
    const [selectedToken, setSelectedToken] = useState(null);
    const [qrDataMap, setQrDataMap] = useState({});
    const [certTicket, setCertTicket] = useState(null); // ticket to show certificate for

    useEffect(() => {
        if (address && provider) loadTickets();
    }, [address, provider]);

    const loadTickets = async () => {
        if (!provider || !address) return;
        setLoading(true);

        try {
            const contract = new ethers.Contract(NFTS_AIRDROP_ADDRESS, NFTS_AIRDROP_ABI, provider);
            const totalMinted = await contract.totalTicketsMinted();
            const total = totalMinted.toNumber();

            if (total === 0) {
                setTickets([]);
                setLoading(false);
                return;
            }

            // Step 1: Fetch all owners in parallel
            const tokenIds = Array.from({ length: total }, (_, i) => i + 1);
            const ownerResults = await Promise.all(
                tokenIds.map(async (tokenId) => {
                    try {
                        const owner = await contract.ownerOf(tokenId);
                        return { tokenId, owner };
                    } catch {
                        return null;
                    }
                })
            );

            // Step 2: Filter only tokens owned by current user
            const myTokenIds = ownerResults
                .filter((r) => r && r.owner.toLowerCase() === address.toLowerCase())
                .map((r) => r.tokenId);

            // Step 3: Fetch ALL data per ticket in one parallel block (no GET_TICKET_STATUS overhead)
            const userTickets = await Promise.all(
                myTokenIds.map(async (tokenId) => {
                    try {
                        const [used, eventId, tokenURI, listing] = await Promise.all([
                            contract.ticketUsed(tokenId),
                            contract.tokenToEvent(tokenId),
                            contract.tokenURI(tokenId),
                            contract.getResaleListing(tokenId),
                        ]);
                        const ev = await contract.events(eventId);
                        return {
                            tokenId,
                            eventId: eventId.toNumber(),
                            eventName: ev.name,
                            eventDate: ev.date.toNumber(),
                            ticketPrice: parseFloat(ethers.utils.formatEther(ev.ticketPrice)),
                            used,
                            listedForResale: listing.active || false,
                            resalePrice: listing.active
                                ? ethers.utils.formatEther(listing.price)
                                : null,
                            tokenURI,
                        };
                    } catch {
                        return null;
                    }
                })
            );

            setTickets(userTickets.filter(Boolean));
        } catch (error) {
            console.error("Error loading tickets:", error);
        }
        setLoading(false);
    };

    const filteredTickets = tickets.filter((t) => {
        if (activeTab === "active") return !t.used && !t.listedForResale;
        if (activeTab === "used") return t.used;
        if (activeTab === "listed") return t.listedForResale;
        return true;
    });

    const handleListForResale = async (tokenId) => {
        if (!resalePrice || parseFloat(resalePrice) <= 0) return;
        const success = await LIST_FOR_RESALE(tokenId, resalePrice);
        if (success) {
            setSelectedToken(null);
            setResalePrice("");
            await loadTickets();
        }
    };

    const handleCancelListing = async (tokenId) => {
        const success = await CANCEL_RESALE(tokenId);
        if (success) await loadTickets();
    };

    const generateSignedQRData = async (ticket) => {
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const message = `Validate ticket ${ticket.tokenId} at ${timestamp}`;

            let signature;

            if (walletClient) {
                // Works for WalletConnect (MetaMask mobile) AND MetaMask extension
                signature = await walletClient.signMessage({
                    account: walletClient.account,
                    message,
                });
            } else if (typeof window !== "undefined" && window.ethereum) {
                // Fallback: direct window.ethereum for desktop MetaMask
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const web3 = new ethers.providers.Web3Provider(window.ethereum, "any");
                const web3Signer = web3.getSigner();
                signature = await web3Signer.signMessage(message);
            } else if (signer) {
                signature = await signer.signMessage(message);
            } else {
                throw new Error("No wallet connected. Please connect your wallet.");
            }

            const payload = {
                tokenId: ticket.tokenId,
                eventId: ticket.eventId,
                timestamp,
                signature,
                contractAddress: NFTS_AIRDROP_ADDRESS,
                network: "sepolia",
            };
            return JSON.stringify(payload);
        } catch (e) {
            console.error("Failed to sign QR data:", e);
            toast.error("Signing failed: " + (e.reason || e.message || "Unknown error"));
            return null;
        }
    };

    if (!isConnected) {
        return (
            <div className="page container text-center" style={{ padding: 100 }}>
                <h2>Connect Your Wallet</h2>
                <p className="text-muted mt-4">Connect your wallet to view your tickets.</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>My Tickets — EventTicketNFT</title>
            </Head>

            {loader && <Loader />}

            {/* Attendance Certificate Modal */}
            {certTicket && (
                <AttendanceCertificate
                    ticket={certTicket}
                    address={address}
                    onClose={() => setCertTicket(null)}
                />
            )}

            <div className="page container">
                <div className="page-header">
                    <h1 className="page-title">My Tickets</h1>
                    <p className="page-subtitle">Your NFT ticket collection</p>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    {[
                        { key: "active", label: "Active Tickets" },
                        { key: "used", label: "Used Tickets" },
                        { key: "listed", label: "Listed for Resale" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`tab ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: 60 }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                        <p className="text-muted">Loading your tickets...</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="card-glass text-center" style={{ padding: 60 }}>
                        <p style={{ fontSize: "1.2rem", marginBottom: 8 }}>
                            {activeTab === "active" ? "No active tickets" :
                                activeTab === "used" ? "No used tickets" : "No listings"}
                        </p>
                        <p className="text-muted">
                            {activeTab === "active" && (
                                <Link href="/events" style={{ color: "var(--accent-purple)" }}>Browse events to get started →</Link>
                            )}
                        </p>
                    </div>
                ) : (
                    <div className="grid-2">
                        {filteredTickets.map((ticket) => (
                            <div key={ticket.tokenId} className="card ticket-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
                                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                                    <div className="ticket-card-thumb"></div>
                                    <div className="ticket-card-info">
                                        <h3 style={{ marginBottom: 4 }}>{ticket.eventName}</h3>
                                        <p className="text-muted text-sm">
                                            📅 {new Date(ticket.eventDate * 1000).toLocaleDateString()} &bull; <span style={{ fontFamily: "monospace", letterSpacing: "0.04em", fontSize: "0.8rem" }}>{formatTicketId(ticket.tokenId, address)}</span>
                                        </p>
                                        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                            {ticket.used ? (
                                                <>
                                                    <span className="badge badge-danger">Used</span>
                                                    <button
                                                        onClick={() => setCertTicket(ticket)}
                                                        style={{
                                                            padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700,
                                                            borderRadius: 20, cursor: "pointer",
                                                            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                                                            border: "none", color: "white",
                                                        }}
                                                    >
                                                        🏅 Claim Certificate
                                                    </button>
                                                </>
                                            ) : ticket.listedForResale ? (
                                                <span className="badge badge-warning">Listed — {ticket.resalePrice} ETH</span>
                                            ) : (
                                                <span className="badge badge-success">Valid</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code - Signed & Time-Limited */}
                                {!ticket.used && (
                                    <div style={{ marginTop: 16, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                                        {!qrDataMap[ticket.tokenId] ? (
                                            <button
                                                className="btn btn-primary"
                                                onClick={async () => {
                                                    const qrString = await generateSignedQRData(ticket);
                                                    if (qrString) {
                                                        setQrDataMap(prev => ({
                                                            ...prev,
                                                            [ticket.tokenId]: {
                                                                qrString,
                                                                expiresAt: Math.floor(Date.now() / 1000) + 60
                                                            }
                                                        }));
                                                        // Auto-clear after 65 seconds
                                                        setTimeout(() => {
                                                            setQrDataMap(prev => {
                                                                const next = { ...prev };
                                                                delete next[ticket.tokenId];
                                                                return next;
                                                            });
                                                        }, 65000);
                                                    }
                                                }}
                                            >
                                                🔐 Show Secure QR
                                            </button>
                                        ) : (
                                            <>
                                                <div style={{ background: "#fff", padding: 12, borderRadius: 8, display: "inline-block" }}>
                                                    <QRCodeCanvas
                                                        value={qrDataMap[ticket.tokenId].qrString}
                                                        size={220}
                                                        level="H"
                                                        includeMargin={true}
                                                    />
                                                </div>
                                                <p className="text-sm" style={{ marginTop: 8, color: "var(--accent-purple)", fontWeight: 600 }}>
                                                    ⏱ Expires in ~60s — screenshot won't work!
                                                </p>
                                            </>
                                        )}
                                        <p className="text-sm text-muted" style={{ marginTop: 12 }}>Scan at the gate for entry</p>
                                        <p style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 4 }}>
                                            Token #{ticket.tokenId} · Event #{ticket.eventId}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                                    {!ticket.used && !ticket.listedForResale && (
                                        <>
                                            {selectedToken === ticket.tokenId ? (
                                                <div style={{ display: "flex", gap: 8, flex: 1 }}>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="Price in ETH"
                                                        value={resalePrice}
                                                        onChange={(e) => setResalePrice(e.target.value)}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleListForResale(ticket.tokenId)}>
                                                        List
                                                    </button>
                                                    <button className="btn btn-outline btn-sm" onClick={() => setSelectedToken(null)}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="btn btn-outline btn-sm" onClick={() => setSelectedToken(ticket.tokenId)}>
                                                    List for Resale
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {ticket.listedForResale && (
                                        <button className="btn btn-danger btn-sm" onClick={() => handleCancelListing(ticket.tokenId)}>
                                            Cancel Listing
                                        </button>
                                    )}
                                    <Link href={`/event/${ticket.eventId}`} className="btn btn-outline btn-sm">
                                        View Event
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
