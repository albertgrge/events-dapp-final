import "../styles/globals.css";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker-dark.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Toaster } from "react-hot-toast";

import { StateContextProvider } from "../Context/index";
import { config } from "../Context/wagmiConfigs";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import Loader from "../Components/Loader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0 },
    mutations: { retry: 0 },
  },
});

// Suppress WalletConnect "No matching key / session topic doesn't exist" errors
// that fire repeatedly on page refresh — these are not app bugs
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event?.reason?.message || "";
    if (
      msg.includes("No matching key") ||
      msg.includes("session topic") ||
      msg.includes("Missing or invalid") ||
      msg.includes("getActiveSessions")
    ) {
      event.preventDefault(); // suppress from console + error reporting
    }
  });
}

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <StateContextProvider>
            <Navbar />
            <Component {...pageProps} />
            <Footer />
            <Toaster />
          </StateContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
