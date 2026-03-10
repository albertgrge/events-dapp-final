import { useRef, useState } from "react";
import { ethers } from "ethers";

export default function AttendanceCertificate({ ticket, address, onClose }) {
    const canvasRef = useRef(null);
    const [generated, setGenerated] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const certId = (() => {
        try {
            const hash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address", "string"],
                    [ticket.tokenId, address || ethers.constants.AddressZero, "CERT"]
                )
            );
            return hash.slice(2, 14).toUpperCase();
        } catch {
            return String(ticket.tokenId).padStart(12, "0");
        }
    })();

    const eventDate = new Date(ticket.eventDate * 1000).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
    });
    const issuedDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
    });
    const shortAddr = address
        ? `${address.slice(0, 10)}...${address.slice(-8)}`
        : "Unknown";

    const generateCertificate = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width;   // 794 (A4-ish landscape)
        const H = canvas.height;  // 560

        // ── Background: cream/parchment ──────────────────────
        ctx.fillStyle = "#FFFDF5";
        ctx.fillRect(0, 0, W, H);

        // Subtle parchment texture (light noise)
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 180 : 160},${140},${100},${Math.random() * 0.04})`;
            ctx.fillRect(x, y, 1, 1);
        }

        // ── Outer double border (LaTeX style) ───────────────
        // Thick outer
        ctx.strokeStyle = "#1a1a2a";
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, W - 40, H - 40);
        // Thin inner
        ctx.strokeStyle = "#1a1a2a";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(28, 28, W - 56, H - 56);
        // Very thin second inner
        ctx.strokeStyle = "#8B7355";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(34, 34, W - 68, H - 68);

        // ── Corner ornaments (LaTeX-style flourishes) ─────────
        const drawOrnament = (ox, oy, flipX, flipY) => {
            ctx.save();
            ctx.translate(ox, oy);
            ctx.scale(flipX, flipY);
            ctx.strokeStyle = "#8B7355";
            ctx.lineWidth = 1.2;
            // L-bracket
            ctx.beginPath();
            ctx.moveTo(0, 40); ctx.lineTo(0, 0); ctx.lineTo(40, 0);
            ctx.stroke();
            // Small diamond in corner
            ctx.fillStyle = "#5C3D11";
            ctx.beginPath();
            ctx.moveTo(8, 8);
            ctx.lineTo(14, 14);
            ctx.lineTo(8, 20);
            ctx.lineTo(2, 14);
            ctx.closePath();
            ctx.fill();
            // Vine-like curves
            ctx.strokeStyle = "#8B7355";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(24, 4);
            ctx.quadraticCurveTo(30, 12, 36, 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(4, 24);
            ctx.quadraticCurveTo(12, 30, 4, 36);
            ctx.stroke();
            ctx.restore();
        };
        drawOrnament(20, 20, 1, 1);
        drawOrnament(W - 20, 20, -1, 1);
        drawOrnament(20, H - 20, 1, -1);
        drawOrnament(W - 20, H - 20, -1, -1);

        // ── Top decorative divider line ───────────────────────
        const drawDoubleLine = (y) => {
            ctx.strokeStyle = "#5C3D11";
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W - 50, y); ctx.stroke();
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(50, y + 4); ctx.lineTo(W - 50, y + 4); ctx.stroke();
        };

        // ── Institution header ────────────────────────────────
        ctx.fillStyle = "#1a1a2a";
        ctx.textAlign = "center";

        // Institution name (small caps style)
        ctx.font = "bold 13px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#5C3D11";
        ctx.fillText("EVENTTICKETNFT  ·  BLOCKCHAIN INSTITUTE OF TECHNOLOGY", W / 2, 72);

        // ── Ornamental top separator ──────────────────────────
        ctx.strokeStyle = "#5C3D11";
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(50, 80); ctx.lineTo(W - 50, 80); ctx.stroke();

        // ── Main title ────────────────────────────────────────
        ctx.font = "bold 36px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#1a1a2a";
        ctx.fillText("Certificate of Attendance", W / 2, 130);

        // Decorative rule under title
        drawDoubleLine(145);

        // ── "This is to certify that" ─────────────────────────
        ctx.font = "italic 15px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#333";
        ctx.fillText("This is to certify that", W / 2, 178);

        // ── Attendee address (underlined style) ───────────────
        ctx.font = "bold 17px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#1a1a2a";
        ctx.fillText(shortAddr, W / 2, 212);
        // Underline
        const addrW = ctx.measureText(shortAddr).width;
        ctx.strokeStyle = "#1a1a2a";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(W / 2 - addrW / 2, 216);
        ctx.lineTo(W / 2 + addrW / 2, 216);
        ctx.stroke();

        // ── Body text ─────────────────────────────────────────
        ctx.font = "italic 15px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#333";
        ctx.fillText("has attended and participated in the event", W / 2, 246);

        // ── Event name (large, bold) ──────────────────────────
        ctx.font = "bold 28px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#1a1a2a";
        const evName = `"${ticket.eventName}"`;
        // Wrap if too long
        const maxNameW = W - 140;
        if (ctx.measureText(evName).width > maxNameW) {
            const words = ticket.eventName.split(" ");
            let line = "\"";
            let y = 286;
            for (let i = 0; i < words.length; i++) {
                const test = line + words[i] + (i < words.length - 1 ? " " : "\"");
                if (ctx.measureText(test).width > maxNameW && line !== "\"") {
                    ctx.fillText(line.trim(), W / 2, y);
                    line = words[i] + " ";
                    y += 36;
                } else {
                    line = test;
                }
            }
            ctx.fillText(line.trim(), W / 2, y);
        } else {
            ctx.fillText(evName, W / 2, 286);
        }

        // ── Held on ───────────────────────────────────────────
        ctx.font = "italic 14px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#555";
        ctx.fillText(`held on ${eventDate}`, W / 2, 326);

        // ── Bottom divider ────────────────────────────────────
        drawDoubleLine(348);

        // ── Signature + seal row ──────────────────────────────
        const colL = W * 0.22;
        const colR = W * 0.78;

        // Left: Signature line
        ctx.strokeStyle = "#1a1a2a";
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(colL - 70, 412); ctx.lineTo(colL + 70, 412); ctx.stroke();
        ctx.font = "13px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#333";
        ctx.fillText("Event Organizer", colL, 428);

        // Right: Issue date line
        ctx.beginPath(); ctx.moveTo(colR - 70, 412); ctx.lineTo(colR + 70, 412); ctx.stroke();
        ctx.fillText(`Issued: ${issuedDate}`, colR, 428);

        // Center: Circular Seal
        const sealX = W / 2;
        const sealY = 400;
        const sealR = 40;

        // Outer ring
        ctx.beginPath();
        ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
        ctx.strokeStyle = "#5C3D11";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner ring
        ctx.beginPath();
        ctx.arc(sealX, sealY, sealR - 6, 0, Math.PI * 2);
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Seal fill
        ctx.beginPath();
        ctx.arc(sealX, sealY, sealR - 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139,115,85,0.08)";
        ctx.fill();

        // Seal text around the ring
        ctx.save();
        ctx.translate(sealX, sealY);
        ctx.font = "bold 7px 'Times New Roman', Times, serif";
        ctx.fillStyle = "#5C3D11";
        const sealText = "· BLOCKCHAIN VERIFIED · ETHEREUM SEPOLIA ·";
        const angleStep = (Math.PI * 2) / sealText.length;
        for (let i = 0; i < sealText.length; i++) {
            ctx.save();
            ctx.rotate(i * angleStep - Math.PI / 2);
            ctx.translate(0, -(sealR - 3));
            ctx.rotate(Math.PI / 2);
            ctx.fillText(sealText[i], 0, 0);
            ctx.restore();
        }
        ctx.restore();

        // Seal center emoji
        ctx.font = "22px serif";
        ctx.textAlign = "center";
        ctx.fillText("⚖", sealX, sealY + 8);

        // ── Certificate ID footer ─────────────────────────────
        ctx.font = "10px 'Courier New', Courier, monospace";
        ctx.fillStyle = "#888";
        ctx.textAlign = "center";
        ctx.fillText(
            `Certificate No. ${certId}  ·  Token ID: ${ticket.tokenId}  ·  Verified on-chain via EventTicketNFT Smart Contract`,
            W / 2, H - 30
        );

        setGenerated(true);
    };

    const downloadCertificate = () => {
        setDownloading(true);
        const canvas = canvasRef.current;
        const link = document.createElement("a");
        link.download = `Certificate_${ticket.eventName.replace(/\s+/g, "_")}_${certId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        setDownloading(false);
    };

    return (
        <div
            style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(8px)",
                zIndex: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 16, overflowY: "auto",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "#1a1a2e",
                    border: "1px solid rgba(124,58,237,0.3)",
                    borderRadius: 20,
                    padding: 28,
                    maxWidth: 860,
                    width: "100%",
                    position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                        <h2 style={{ fontSize: "1.2rem", marginBottom: 4 }}>📜 Attendance Certificate</h2>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            LaTeX-style · Cert ID: <code style={{ color: "#a78bfa" }}>{certId}</code>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: "none", cursor: "pointer",
                            color: "white", fontSize: "1rem",
                        }}
                    >✕</button>
                </div>

                {/* Canvas */}
                <div style={{ textAlign: "center", marginBottom: 20, overflowX: "auto" }}>
                    <canvas
                        ref={canvasRef}
                        width={794}
                        height={560}
                        style={{
                            borderRadius: 4,
                            border: "1px solid rgba(255,255,255,0.1)",
                            maxWidth: "100%",
                            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                        }}
                    />
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                    {!generated ? (
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateCertificate}>
                            ✨ Generate Certificate
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={downloadCertificate}
                            disabled={downloading}
                        >
                            {downloading ? "Downloading..." : "⬇ Download as PNG"}
                        </button>
                    )}
                    <button className="btn btn-outline" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
