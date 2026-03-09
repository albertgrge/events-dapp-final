import { useState, useEffect } from "react";

/**
 * Custom hook to fetch live ETH/INR exchange rate from CoinGecko.
 * Returns { ethToInr, convertEthToInr, loading }
 */
export const useEthToInr = () => {
    const [ethToInr, setEthToInr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";
                const url = apiKey
                    ? `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr&x_cg_demo_api_key=${apiKey}`
                    : `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr`;

                const res = await fetch(url);
                const data = await res.json();
                if (data?.ethereum?.inr) {
                    setEthToInr(data.ethereum.inr);
                }
            } catch (error) {
                console.error("Failed to fetch ETH/INR rate:", error);
                // Fallback rate
                setEthToInr(250000);
            } finally {
                setLoading(false);
            }
        };

        fetchRate();
        // Refresh every 5 minutes
        const interval = setInterval(fetchRate, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const convertEthToInr = (ethAmount) => {
        if (!ethToInr || !ethAmount) return null;
        const inr = parseFloat(ethAmount) * ethToInr;
        return inr.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        });
    };

    return { ethToInr, convertEthToInr, loading };
};
