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

const queryClient = new QueryClient();

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
