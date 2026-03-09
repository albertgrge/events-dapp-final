import { sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT || "fbe049d035d54590dd5935edc2a7d780";

export const config = getDefaultConfig({
  appName: "EventTicketNFT",
  projectId: projectId,
  chains: [sepolia],
  ssr: true,
});
