import React, { useState } from "react";

/**
 * TransakWidget — opens a Transak fiat on-ramp modal
 * Lets users buy ETH using INR (UPI / card) without leaving the dApp.
 *
 * Props:
 *   walletAddress – pre-fill the destination wallet (optional)
 *   fiatAmount    – pre-fill the INR amount (optional)
 *   buttonLabel   – custom button text (optional)
 *   buttonClass   – custom CSS class for the button (optional)
 */
export default function TransakWidget({
    walletAddress = "",
    fiatAmount = "",
    buttonLabel = "💳 Buy ETH with ₹ (UPI/Card)",
    buttonClass = "btn btn-outline",
}) {
    const [open, setOpen] = useState(false);

    // Build the Transak URL — staging if no key, production if key provided
    const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY;
    const baseUrl = apiKey
        ? "https://global.transak.com"
        : "https://global-stg.transak.com";
    const transakUrl = new URL(baseUrl);
    transakUrl.searchParams.set("defaultCryptoCurrency", "ETH");
    transakUrl.searchParams.set("network", "ethereum");
    transakUrl.searchParams.set("fiatCurrency", "INR");
    transakUrl.searchParams.set("countryCode", "IN");
    transakUrl.searchParams.set("themeColor", "7C3AED");
    transakUrl.searchParams.set("exchangeScreenTitle", "Buy ETH for Event Ticket");
    transakUrl.searchParams.set("partnerName", "GECI EventTicket");
    transakUrl.searchParams.set("hostURL", typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    if (walletAddress) transakUrl.searchParams.set("walletAddress", walletAddress);
    if (fiatAmount) transakUrl.searchParams.set("defaultFiatAmount", String(fiatAmount));
    if (apiKey) transakUrl.searchParams.set("apiKey", apiKey);

    return (
        <>
            {/* Trigger button */}
            <button className={buttonClass} onClick={() => setOpen(true)}>
                {buttonLabel}
            </button>

            {/* Modal overlay */}
            {open && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(0,0,0,0.75)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                    }}
                    onClick={() => setOpen(false)}
                >
                    <div
                        style={{
                            background: "var(--surface)",
                            borderRadius: "var(--radius-lg)",
                            overflow: "hidden",
                            width: "min(480px, 100%)",
                            maxHeight: "90vh",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                            display: "flex",
                            flexDirection: "column",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "16px 20px",
                                borderBottom: "1px solid var(--border)",
                            }}
                        >
                            <div>
                                <p style={{ fontWeight: 700, fontSize: "1rem", margin: 0 }}>
                                    💳 Buy ETH with ₹ Rupees
                                </p>
                                <p className="text-muted" style={{ fontSize: "0.75rem", margin: 0, marginTop: 2 }}>
                                    Powered by Transak · Staging (demo) mode
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    fontSize: "1.5rem",
                                    cursor: "pointer",
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Transak iframe */}
                        <iframe
                            src={transakUrl.toString()}
                            title="Transak — Buy ETH with INR"
                            allow="camera;microphone;fullscreen;payment"
                            style={{
                                border: "none",
                                width: "100%",
                                height: 600,
                                display: "block",
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
