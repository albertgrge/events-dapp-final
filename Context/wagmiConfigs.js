import { sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT || "fbe049d035d54590dd5935edc2a7d780";

// Public Sepolia RPC — no CORS issues
const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

// ── Clear stale WalletConnect sessions on every app load ──────────────────
// This prevents the "No matching key. session topic doesn't exist" spam errors
if (typeof window !== "undefined") {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith("wc@") ||
          k.startsWith("walletconnect") ||
          k.startsWith("WALLETCONNECT") ||
          k.includes("session") && k.includes("topic"))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage not available (SSR)
  }
}

export const config = getDefaultConfig({
  appName: "EventTicketNFT",
  projectId: projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
  },
  ssr: true,
});
