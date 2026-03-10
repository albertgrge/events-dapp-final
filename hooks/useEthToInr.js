import { useState, useEffect } from "react";

// ── Singleton cache so only ONE fetch fires for the entire app ──
let cachedRate = null;
let fetchPromise = null;
const listeners = new Set();

const fetchRate = async () => {
    try {
        const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";
        const url = apiKey
            ? `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr&x_cg_demo_api_key=${apiKey}`
            : `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.ethereum?.inr) {
            cachedRate = data.ethereum.inr;
            listeners.forEach((fn) => fn(cachedRate));
        }
    } catch {
        if (!cachedRate) cachedRate = 250000; // fallback
        listeners.forEach((fn) => fn(cachedRate));
    } finally {
        fetchPromise = null;
    }
};

const ensureFetched = () => {
    if (cachedRate) return;
    if (!fetchPromise) fetchPromise = fetchRate();
};

// Refresh every 5 minutes (singleton interval)
if (typeof window !== "undefined") {
    setInterval(fetchRate, 5 * 60 * 1000);
}

/**
 * useEthToInr — singleton hook, only one CoinGecko call regardless of how many
 * components use it. Returns { ethToInr, convertEthToInr, loading }.
 */
export const useEthToInr = () => {
    const [ethToInr, setEthToInr] = useState(cachedRate);

    useEffect(() => {
        // Subscribe to rate updates
        listeners.add(setEthToInr);
        // Trigger fetch if not already done
        ensureFetched();
        return () => listeners.delete(setEthToInr);
    }, []);

    const convertEthToInr = (ethAmount) => {
        if (!ethToInr || !ethAmount) return null;
        return (parseFloat(ethAmount) * ethToInr).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        });
    };

    return { ethToInr, convertEthToInr, loading: !ethToInr };
};
