import React, { useState, useRef } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";
import { NFTS_AIRDROP_ABI, NFTS_AIRDROP_ADDRESS } from "../Context/constants";

const QR_EXPIRY_SECONDS = 90; // must match the 65s auto-clear on my-tickets (give a little grace)

const ValidateTicket = ({ onClose, eventId: organizerEventId }) => {
  const provider = useEthersProvider();
  const signer = useEthersSigner();

  const [step, setStep] = useState("idle"); // idle | validating | result
  const [rawInput, setRawInput] = useState("");
  const [result, setResult] = useState(null); // { ok, tokenId, owner, eventName, error }
  const inputRef = useRef(null);

  // ─── Core validation logic ────────────────────────────────────────────────
  const runValidation = async (raw) => {
    setStep("validating");
    setResult(null);

    try {
      // 1. Parse QR JSON
      let payload;
      try {
        payload = JSON.parse(raw.trim());
      } catch {
        throw new Error("Invalid QR code — not readable JSON.");
      }

      const { tokenId, eventId, timestamp, signature, contractAddress } = payload;

      if (!tokenId || !eventId || !timestamp || !signature) {
        throw new Error("QR code is missing required fields.");
      }

      // 2. Check QR not expired
      const now = Math.floor(Date.now() / 1000);
      const age = now - timestamp;
      if (age > QR_EXPIRY_SECONDS) {
        throw new Error(`QR code expired ${age}s ago. Ask the attendee to regenerate it.`);
      }

      // 3. Verify contract address (optional safety check)
      if (contractAddress && contractAddress.toLowerCase() !== NFTS_AIRDROP_ADDRESS.toLowerCase()) {
        throw new Error("QR code is for a different contract.");
      }

      // 4. Recover signer from signature
      const message = `Validate ticket ${tokenId} at ${timestamp}`;
      const recoveredSigner = ethers.utils.verifyMessage(message, signature);

      // 5. Read on-chain state
      const contract = new ethers.Contract(NFTS_AIRDROP_ADDRESS, NFTS_AIRDROP_ABI, provider);

      const [owner, isUsed, tokenEventId, eventData] = await Promise.all([
        contract.ownerOf(tokenId),
        contract.ticketUsed(tokenId),
        contract.tokenToEvent(tokenId),
        contract.events(eventId),
      ]);

      // 6. Validate checks
      if (owner.toLowerCase() !== recoveredSigner.toLowerCase()) {
        throw new Error(
          `Signature mismatch. Signer (${recoveredSigner.slice(0, 8)}…) is not the current owner (${owner.slice(0, 8)}…). Ticket may have been transferred.`
        );
      }

      if (isUsed) {
        throw new Error("This ticket has already been used.");
      }

      if (tokenEventId.toNumber() !== Number(eventId)) {
        throw new Error(`Ticket belongs to event #${tokenEventId.toNumber()}, not event #${eventId}.`);
      }

      // If organizer provided their eventId, enforce it
      if (organizerEventId !== undefined && Number(organizerEventId) !== Number(eventId)) {
        throw new Error(`This ticket is for a different event ("${eventData.name}"), not yours.`);
      }

      // 7. All checks passed — call validateTicket on-chain
      if (!signer) throw new Error("No wallet signer available. Please connect your wallet.");

      const contractWithSigner = new ethers.Contract(NFTS_AIRDROP_ADDRESS, NFTS_AIRDROP_ABI, signer);
      const tx = await contractWithSigner.validateTicket(tokenId);
      toast.loading("Confirming on blockchain…", { id: "vt" });
      await tx.wait();
      toast.dismiss("vt");

      setResult({
        ok: true,
        tokenId,
        eventId,
        eventName: eventData.name,
        owner,
        age,
      });
    } catch (e) {
      const msg = e?.reason || e?.data?.message || e?.message || "Unknown error";
      setResult({ ok: false, error: msg });
    }

    setStep("result");
  };

  const handleManualSubmit = () => {
    if (!rawInput.trim()) return;
    runValidation(rawInput);
  };

  const handleReset = () => {
    setStep("idle");
    setRawInput("");
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--card-bg, #1a1a2e)",
        border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: "var(--radius-lg, 16px)",
        padding: "32px 28px",
        width: "100%", maxWidth: 500,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>🎫 Validate Ticket</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1 }}>×</button>
        </div>

        {step === "idle" && (
          <>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: 20 }}>
              Paste the QR code text from the attendee's ticket, or let them scan it directly into this field.
            </p>

            <textarea
              ref={inputRef}
              rows={5}
              autoFocus
              placeholder={'Paste QR payload here…\n{"tokenId":1,"eventId":1,"timestamp":...,"signature":"0x..."}'}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: "var(--radius-md, 10px)",
                color: "var(--text)", padding: "12px 14px",
                fontSize: "0.8rem", fontFamily: "monospace",
                resize: "vertical", outline: "none", marginBottom: 16,
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleManualSubmit}
                disabled={!rawInput.trim()}
                style={{
                  flex: 1, padding: "10px 0", fontWeight: 700, fontSize: "0.9rem",
                  background: rawInput.trim() ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(124,58,237,0.2)",
                  border: "none", color: "white", borderRadius: "var(--radius-md, 10px)",
                  cursor: rawInput.trim() ? "pointer" : "not-allowed",
                }}
              >
                Validate →
              </button>
              <button onClick={onClose} style={{ padding: "10px 20px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-muted)", borderRadius: "var(--radius-md, 10px)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </>
        )}

        {step === "validating" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="spinner" style={{ margin: "0 auto 16px", width: 40, height: 40 }}></div>
            <p style={{ color: "var(--text-muted)" }}>Verifying signature & checking blockchain…</p>
          </div>
        )}

        {step === "result" && result && (
          <div>
            <div style={{
              padding: "20px 22px",
              borderRadius: "var(--radius-md, 10px)",
              background: result.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${result.ok ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 12, color: result.ok ? "#22c55e" : "#ef4444" }}>
                {result.ok ? "✅ Ticket Validated!" : "❌ Validation Failed"}
              </div>

              {result.ok ? (
                <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div><span style={{ color: "var(--text-muted)" }}>Token ID:</span> <strong>#{result.tokenId}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Event:</span> <strong>{result.eventName}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Owner:</span> <span style={{ fontFamily: "monospace" }}>{result.owner.slice(0, 10)}…{result.owner.slice(-6)}</span></div>
                  <div><span style={{ color: "var(--text-muted)" }}>QR Age:</span> {result.age}s (valid)</div>
                  <div style={{ marginTop: 6, color: "#22c55e", fontWeight: 600 }}>
                    ✓ Marked as used on-chain — entry granted!
                  </div>
                </div>
              ) : (
                <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{result.error}</p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleReset}
                style={{ flex: 1, padding: "10px 0", fontWeight: 700, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", color: "white", borderRadius: "var(--radius-md, 10px)", cursor: "pointer" }}
              >
                Validate Another
              </button>
              <button onClick={onClose} style={{ padding: "10px 20px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-muted)", borderRadius: "var(--radius-md, 10px)", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidateTicket;
