import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import toast, { Toaster } from "react-hot-toast";

import { StateContextProvider } from "../Context/index";
import { config } from "../Context/wagmiConfigs";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export default function App({ Component, pageProps }) {
  const queryClient = new QueryClient();
  return (
    <>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <StateContextProvider>
              <Component {...pageProps} />
              <Toaster />
            </StateContextProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>

      <script src="/assets/js/libs/jquery.min.js"></script>
      <script src="/assets/js/libs/swiper-bundle.min.js"></script>
      <script src="/assets/js/libs/feather.min.js"></script>
      <script src="/assets/js/libs/typed.min.js"></script>
      <script src="/assets/js/libs/anime.min.js"></script>
      {/* <script src="/assets/js/app.js"></script> */}
      <script src="/assets/js/helpers/data-attr-helper.js"></script>
      <script src="/assets/js/helpers/swiper-helper.js"></script>
      <script src="/assets/js/helpers/typed-helper.js"></script>
      <script src="/assets/js/helpers/anime-helper.js"></script>
      {/* <script src="/assets/js/libs/uikit.min.js"></script> */}
      <script src="/assets/js/uikit-components.js"></script>
    </>
  );
}
