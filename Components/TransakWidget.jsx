import { useEffect, useCallback } from "react";

/**
 * TransakWidget — launches the official Transak SDK popup
 *
 * Props:
 *   walletAddress – destination wallet (pre-filled)
 *   fiatAmount    – INR amount to pre-fill  
 *   buttonLabel   – button text
 *   buttonClass   – CSS class for the button
 */
export default function TransakWidget({
    walletAddress = "",
    fiatAmount = "",
    buttonLabel = "💳 Buy ETH with ₹ (UPI/Card)",
    buttonClass = "btn btn-outline",
}) {
    const openTransak = useCallback(async () => {
        try {
            const { default: transakSDK } = await import("@transak/transak-sdk");

            const settings = {
                environment: "STAGING",
                // No API key — staging works without one for demos

                defaultCryptoCurrency: "ETH",
                networks: "ethereum",

                fiatCurrency: "INR",
                countryCode: "IN",
                ...(fiatAmount && { defaultFiatAmount: Number(fiatAmount) }),
                ...(walletAddress && { walletAddress, disableWalletAddressForm: true }),

                themeColor: "7C3AED",
                exchangeScreenTitle: "Buy ETH for Event Ticket",
                partnerName: "GECI EventTicket",
                hostURL: typeof window !== "undefined" ? window.location.origin : "",
                hideMenu: true,
            };

            const transak = new transakSDK(settings);
            transak.init();
            transak.on(transakSDK.EVENTS.TRANSAK_ORDER_SUCCESSFUL, () => transak.close());
            transak.on(transakSDK.EVENTS.TRANSAK_WIDGET_CLOSE, () => transak.close());

        } catch (error) {
            console.error("Transak SDK error:", error);
            // Fallback — open staging Transak as popup window
            const url = new URL("https://global-stg.transak.com");
            url.searchParams.set("defaultCryptoCurrency", "ETH");
            url.searchParams.set("network", "ethereum");
            url.searchParams.set("fiatCurrency", "INR");
            url.searchParams.set("countryCode", "IN");
            url.searchParams.set("themeColor", "7C3AED");
            if (walletAddress) url.searchParams.set("walletAddress", walletAddress);
            if (fiatAmount) url.searchParams.set("defaultFiatAmount", String(fiatAmount));
            window.open(url.toString(), "transak", "width=450,height=700,left=200,top=100");
        }
    }, [walletAddress, fiatAmount]);

    return (
        <button className={buttonClass} onClick={openTransak}>
            {buttonLabel}
        </button>
    );
}
