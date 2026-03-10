import { providers } from "ethers";
import { useMemo } from "react";
import { useClient, useConnectorClient } from "wagmi";

// ── Provider (read-only) ────────────────────────────────────────────────────

export function clientToProvider(client) {
  try {
    const { chain, transport } = client;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };

    if (transport.type === "fallback") {
      const urls = (transport.transports || [])
        .map(({ value }) => value?.url)
        .filter(Boolean);
      const rpc = urls[0] || "https://ethereum-sepolia-rpc.publicnode.com";
      return new providers.JsonRpcProvider(rpc, network);
    }

    const url = transport.url || "https://ethereum-sepolia-rpc.publicnode.com";
    return new providers.JsonRpcProvider(url, network);
  } catch {
    return new providers.JsonRpcProvider(
      "https://ethereum-sepolia-rpc.publicnode.com"
    );
  }
}

export function useEthersProvider({ chainId } = {}) {
  const client = useClient({ chainId });
  return useMemo(
    () => (client ? clientToProvider(client) : undefined),
    [client]
  );
}

// ── Signer (write) ──────────────────────────────────────────────────────────

/**
 * Converts a viem connector client to an ethers.js Signer.
 *
 * Priority:
 * 1. Connector's own EIP-1193 provider from viem transport
 *    → covers WalletConnect v2, Coinbase Wallet, injected (when viem exposes it)
 * 2. window.ethereum
 *    → covers MetaMask extension, mobile in-app browsers
 */
export function clientToSigner(client) {
  try {
    const { account, chain, transport } = client;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };

    // ── 1. Try the connector's own EIP-1193 provider ──
    // Works for WalletConnect v2, Coinbase Wallet, injected wallets via viem
    const rawProvider =
      transport?.provider ??
      transport?.value?.provider ??
      transport?.inner?.provider;

    if (rawProvider && typeof rawProvider.request === "function") {
      const provider = new providers.Web3Provider(rawProvider, network);
      return provider.getSigner(account.address);
    }

    // ── 2. Fall back to window.ethereum ──
    // Works for MetaMask extension, Trust Wallet, mobile in-app browsers
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = new providers.Web3Provider(window.ethereum, network);
      return provider.getSigner(account.address);
    }

    return undefined;
  } catch (err) {
    console.warn("[clientToSigner] Failed:", err.message);
    return undefined;
  }
}

export function useEthersSigner({ chainId } = {}) {
  const { data: client } = useConnectorClient({ chainId });
  return useMemo(
    () => (client ? clientToSigner(client) : undefined),
    [client]
  );
}
