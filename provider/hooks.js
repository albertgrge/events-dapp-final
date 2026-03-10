import { providers } from "ethers";
import { useMemo } from "react";
import { useClient, useConnectorClient } from "wagmi";

const FALLBACK_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

// ── Read-only provider (no wallet needed) ────────────────────────────────────
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
      return new providers.JsonRpcProvider(urls[0] || FALLBACK_RPC, network);
    }

    const url = transport.url || FALLBACK_RPC;
    return new providers.JsonRpcProvider(url, network);
  } catch {
    return new providers.JsonRpcProvider(FALLBACK_RPC);
  }
}

export function useEthersProvider({ chainId } = {}) {
  const client = useClient({ chainId });
  return useMemo(() => (client ? clientToProvider(client) : undefined), [client]);
}

// ── Write signer — works for MetaMask AND WalletConnect on mobile ────────────
//
// Canonical wagmi v2 + ethers v5 approach (official docs):
// useConnectorClient() gives us the WalletClient whose transport is always
// an EIP-1193 provider — on MetaMask it wraps window.ethereum, on
// WalletConnect it wraps the WC relay. We pass it directly to Web3Provider.
//
export function clientToSigner(walletClient) {
  try {
    const { account, chain, transport } = walletClient;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new providers.Web3Provider(transport, network);
    return provider.getSigner(account.address);
  } catch (err) {
    console.warn("clientToSigner failed:", err?.message);
    return undefined;
  }
}

export function useEthersSigner({ chainId } = {}) {
  const { data: walletClient } = useConnectorClient({ chainId });
  return useMemo(
    () => (walletClient ? clientToSigner(walletClient) : undefined),
    [walletClient]
  );
}
