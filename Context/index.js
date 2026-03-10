import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import { config } from "../Context/wagmiConfigs";
import { useAccount, useChains } from "wagmi";
import { NFTS_AIRDROP_ABI, NFTS_AIRDROP_ADDRESS, parseErrorMsg } from "./constants";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const notifySuccess = (msg) => toast.success(msg, { duration: 3000 });
  const notifyError = (msg) => toast.error(msg, { duration: 5000 });

  const provider = useEthersProvider();
  const signer = useEthersSigner();
  const chains = useChains();

  const [loader, setLoader] = useState(false);
  const [userRole, setUserRole] = useState({
    isOrganizer: false,
    isUser: true,
  });
  const [organizerStake, setOrganizerStake] = useState("0");

  const { address, isConnected } = useAccount({ config });

  // ── Helper: get read-only contract ──
  const getReadContract = () => {
    const readProvider = provider || new ethers.providers.JsonRpcProvider("https://rpc.sepolia.org");
    return new ethers.Contract(NFTS_AIRDROP_ADDRESS, NFTS_AIRDROP_ABI, readProvider);
  };

  // ── Helper: get writable contract ──
  const getWriteContract = () => {
    if (!signer) return null;
    return new ethers.Contract(NFTS_AIRDROP_ADDRESS, NFTS_AIRDROP_ABI, signer);
  };

  // ============================================================
  // ROLE CHECKING  (no admin — just organizer vs user)
  // ============================================================

  useEffect(() => {
    if (address && provider) {
      checkUserRole();
    }
  }, [address, provider]);

  const checkUserRole = async () => {
    try {
      if (!address || !provider) return;
      const contract = getReadContract();
      if (!contract) return;

      let isOrganizer = false;
      let stake = "0";

      try {
        isOrganizer = await contract.isActiveOrganizer(address);
      } catch { /* Not an organizer */ }

      try {
        const stakeWei = await contract.getOrganizerStake(address);
        stake = ethers.utils.formatEther(stakeWei);
      } catch { /* No stake */ }

      setUserRole({ isOrganizer, isUser: !isOrganizer });
      setOrganizerStake(stake);
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  // ============================================================
  // STAKING — BECOME / LEAVE ORGANIZER
  // ============================================================

  const STAKE_TO_BECOME_ORGANIZER = async (name, contact, stakeEth) => {
    try {
      setLoader(true);
      const contract = getWriteContract();
      if (!contract) throw new Error("Wallet not connected");

      const stakeWei = ethers.utils.parseEther(stakeEth.toString());
      const tx = await contract.stakeToBeOrganizer(name, contact, {
        value: stakeWei,
      });
      await tx.wait();

      await checkUserRole();
      setLoader(false);
      notifySuccess("🎉 You are now an organizer!");
      return true;
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Failed to stake");
      return false;
    }
  };

  const UNSTAKE = async () => {
    try {
      setLoader(true);
      const contract = getWriteContract();
      if (!contract) throw new Error("Wallet not connected");

      const tx = await contract.unstake();
      await tx.wait();

      await checkUserRole();
      setLoader(false);
      notifySuccess("Unstaked! You are no longer an organizer.");
      return true;
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Failed to unstake");
      return false;
    }
  };

  const GET_MIN_STAKE = async () => {
    try {
      const contract = getReadContract();
      if (!contract) return "0.01";
      const minStake = await contract.MIN_STAKE();
      return ethers.utils.formatEther(minStake);
    } catch (e) {
      return "0.01";
    }
  };

  // ============================================================
  // EVENT CREATION (Organizer only)
  // ============================================================

  const CREATE_EVENT = async (eventData) => {
    try {
      const { name, description, date, location, price, totalTickets, image, royaltyPercent, maxResaleMultiplier, maxPerWallet } = eventData;
      setLoader(true);

      if (!signer) {
        setLoader(false);
        notifyError("Please connect your wallet first");
        throw new Error("Wallet not connected");
      }

      const imageUrl = await uploadToIPFS(image);

      const metadata = {
        name,
        description,
        date,
        location,
        image: imageUrl,
        attributes: [
          { trait_type: "Event Date", value: date },
          { trait_type: "Location", value: location },
          { trait_type: "Ticket Price", value: `${price} ETH` },
        ],
      };

      const metadataUrl = await uploadJSONToIPFS(metadata);

      const contract = getWriteContract();
      const priceInWei = ethers.utils.parseEther(price.toString());
      const dateTimestamp = Math.floor(new Date(date).getTime() / 1000);
      const royaltyBps = Math.floor((royaltyPercent || 10) * 100);
      const multiplier = maxResaleMultiplier || 2;
      const perWalletLimit = maxPerWallet || 1;

      const tx = await contract.createEvent(
        name,
        description || "",
        dateTimestamp,
        priceInWei,
        parseInt(totalTickets),
        royaltyBps,
        multiplier,
        metadataUrl,
        perWalletLimit
      );

      const receipt = await tx.wait();

      let eventId;
      try {
        const iface = new ethers.utils.Interface(NFTS_AIRDROP_ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed.name === "EventCreated") {
              eventId = parsed.args.eventId.toNumber();
              break;
            }
          } catch (e) { }
        }
      } catch (e) {
        console.error("Error parsing event ID:", e);
      }

      if (!eventId) {
        const counter = await contract.eventCounter();
        eventId = counter.toNumber();
      }

      setLoader(false);
      notifySuccess("Event created successfully!");
      return { eventId, ...eventData, image: imageUrl, IPFS_URL: metadataUrl };
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Failed to create event");
      throw error;
    }
  };

  // ============================================================
  // GET ALL EVENTS
  // ============================================================

  const GET_ALL_EVENTS = async () => {
    try {
      const contract = getReadContract();
      if (!contract) return [];

      const totalEvents = await contract.eventCounter();
      const count = totalEvents.toNumber();
      if (count === 0) return [];

      const eventPromises = [];
      for (let i = 1; i <= count; i++) {
        eventPromises.push(
          (async (id) => {
            try {
              const ev = await contract.events(id);
              const stats = await contract.eventStats(id);

              let meta = {};
              const metadataURI = ev.metadataURI;
              if (metadataURI && metadataURI.length > 0) {
                try {
                  const res = await fetch(metadataURI);
                  if (res.ok) {
                    meta = await res.json();
                  }
                } catch (fetchErr) {
                  console.warn(`Failed to fetch metadata for event ${id}:`, fetchErr.message);
                }
              }

              return {
                eventId: ev.eventId.toNumber(),
                name: ev.name,
                description: ev.description || meta.description || "",
                date: ev.date.toNumber(),
                organizer: ev.organizer,
                ticketPrice: parseFloat(ethers.utils.formatEther(ev.ticketPrice)),
                maxSupply: ev.maxSupply.toNumber(),
                ticketsMinted: ev.ticketsMinted.toNumber(),
                ticketsLeft: ev.maxSupply.toNumber() - ev.ticketsMinted.toNumber(),
                royaltyBps: ev.royaltyBps.toNumber(),
                maxResaleMultiplier: ev.maxResaleMultiplier.toNumber(),
                maxPerWallet: ev.maxPerWallet.toNumber(),
                totalMinted: stats.totalMinted.toNumber(),
                totalValidated: stats.totalValidated.toNumber(),
                totalRevenue: parseFloat(ethers.utils.formatEther(stats.totalRevenue)),
                totalResales: stats.totalResales.toNumber(),
                location: meta.location || "TBA",
                image: meta.image || null,
                metadataUrl: metadataURI || "",
              };
            } catch (e) {
              console.error(`Error fetching event ${id}:`, e);
              return null;
            }
          })(i)
        );
      }

      const events = await Promise.all(eventPromises);
      return events.filter((e) => e !== null);
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  };

  // ============================================================
  // MINT TICKET
  // ============================================================

  const MINT_TICKET = async (eventId, tokenURI) => {
    try {
      setLoader(true);

      // Guard: signer may take a moment to init on mobile WalletConnect
      let contract = getWriteContract();
      if (!contract) {
        await new Promise((r) => setTimeout(r, 1500));
        contract = getWriteContract();
      }
      if (!contract) {
        setLoader(false);
        notifyError("Wallet not ready — please reconnect and try again.");
        throw new Error("Wallet not connected");
      }

      const ev = await contract.events(eventId);
      const ticketPrice = ev.ticketPrice;

      const tx = await contract.mintTicket(eventId, tokenURI, {
        value: ticketPrice,
      });
      const receipt = await tx.wait();

      let tokenId;
      try {
        const iface = new ethers.utils.Interface(NFTS_AIRDROP_ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed.name === "TicketMinted") {
              tokenId = parsed.args.tokenId.toNumber();
              break;
            }
          } catch (e) { }
        }
      } catch (e) { }

      setLoader(false);
      notifySuccess("Ticket minted successfully!");
      return tokenId;
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Failed to mint ticket");
      throw error;
    }
  };

  // ============================================================
  // VALIDATE TICKET
  // ============================================================

  const VALIDATE_TICKET = async (tokenId) => {
    try {
      setLoader(true);
      const contract = getWriteContract();
      if (!contract) throw new Error("Wallet not connected");

      const tx = await contract.validateTicket(tokenId);
      await tx.wait();

      setLoader(false);
      notifySuccess(`Ticket #${tokenId} validated!`);
      return true;
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Validation failed");
      return false;
    }
  };

  // ============================================================
  // REVENUE WITHDRAWAL
  // ============================================================

  const WITHDRAW_REVENUE = async (eventId) => {
    try {
      setLoader(true);
      const contract = getWriteContract();
      if (!contract) throw new Error("Wallet not connected");

      const tx = await contract.withdrawRevenue(eventId);
      await tx.wait();

      setLoader(false);
      notifySuccess("Revenue withdrawn!");
      return true;
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Withdrawal failed");
      return false;
    }
  };

  // ============================================================
  // RESALE MARKETPLACE
  // ============================================================

  const LIST_FOR_RESALE = async (tokenId, priceInEth) => {
    try {
      setLoader(true);
      const contract = getWriteContract();
      if (!contract) throw new Error("Wallet not connected");

      const priceWei = ethers.utils.parseEther(priceInEth.toString());
      const tx = await contract.listTicketForResale(tokenId, priceWei);
      await tx.wait();

      setLoader(false);
      notifySuccess("Ticket listed for resale!");
      return true;
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Failed to list ticket");
      return false;
    }
  };

  const CANCEL_RESALE = async (tokenId) => {
    try {
      setLoader(true);
      const contract = getWriteContract();
      if (!contract) throw new Error("Wallet not connected");

      const tx = await contract.cancelResaleListing(tokenId);
      await tx.wait();

      setLoader(false);
      notifySuccess("Listing cancelled!");
      return true;
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Failed to cancel listing");
      return false;
    }
  };

  const BUY_RESALE = async (tokenId) => {
    try {
      setLoader(true);
      const contract = getWriteContract();
      if (!contract) throw new Error("Wallet not connected");

      const listing = await contract.getResaleListing(tokenId);
      const tx = await contract.buyResaleTicket(tokenId, {
        value: listing.price,
      });
      await tx.wait();

      setLoader(false);
      notifySuccess("Resale ticket purchased!");
      return true;
    } catch (error) {
      setLoader(false);
      notifyError(parseErrorMsg(error) || "Failed to buy resale ticket");
      return false;
    }
  };

  // ============================================================
  // VIEW FUNCTIONS
  // ============================================================

  const GET_PENDING_REVENUE = async (eventId) => {
    try {
      const contract = getReadContract();
      if (!contract) return "0";
      const revenue = await contract.getPendingRevenue(eventId);
      return ethers.utils.formatEther(revenue);
    } catch (e) {
      return "0";
    }
  };

  const GET_TICKET_STATUS = async (tokenId) => {
    try {
      const contract = getReadContract();
      if (!contract) return null;
      const used = await contract.ticketUsed(tokenId);
      const eventId = await contract.tokenToEvent(tokenId);
      const owner = await contract.ownerOf(tokenId);
      const listing = await contract.getResaleListing(tokenId);
      return {
        tokenId,
        used,
        eventId: eventId.toNumber(),
        owner,
        listedForResale: listing.active,
        resalePrice: listing.active ? ethers.utils.formatEther(listing.price) : null,
      };
    } catch (e) {
      return null;
    }
  };

  const GET_EVENT_STATS = async (eventId) => {
    try {
      const contract = getReadContract();
      if (!contract) return null;
      const stats = await contract.eventStats(eventId);
      return {
        totalMinted: stats.totalMinted.toNumber(),
        totalValidated: stats.totalValidated.toNumber(),
        totalRevenue: ethers.utils.formatEther(stats.totalRevenue),
        totalResales: stats.totalResales.toNumber(),
      };
    } catch (e) {
      return null;
    }
  };

  const GET_TOTAL_TICKETS_MINTED = async () => {
    try {
      const contract = getReadContract();
      if (!contract) return 0;
      const total = await contract.totalTicketsMinted();
      return total.toNumber();
    } catch (e) {
      return 0;
    }
  };

  // ============================================================
  // IPFS UPLOAD (Pinata)
  // ============================================================

  const uploadToIPFS = async (file) => {
    try {
      if (typeof file === "string" && file.startsWith("data:")) {
        const response = await fetch(file);
        const blob = await response.blob();
        file = new File([blob], "event-image.jpg", { type: blob.type });
      }

      if (!file) return null;

      const formData = new FormData();
      formData.append("file", file);

      const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_AIP_KEY || "376d2889c6c19feefd9c";
      const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRECT_KEY || "db4b90e3cb4066cc243af5b7d8cc7ab549d7cd0bd63e7f3c970168aefd95f83f";

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
      });

      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
      console.error("IPFS upload error:", error);
      notifyError("Failed to upload to IPFS");
      throw error;
    }
  };

  const uploadJSONToIPFS = async (jsonData) => {
    try {
      const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_AIP_KEY || "376d2889c6c19feefd9c";
      const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRECT_KEY || "db4b90e3cb4066cc243af5b7d8cc7ab549d7cd0bd63e7f3c970168aefd95f83f";

      const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", jsonData, {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
      });

      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
      console.error("JSON IPFS upload error:", error);
      throw error;
    }
  };

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  return (
    <StateContext.Provider
      value={{
        // Roles
        userRole,
        checkUserRole,
        address,
        isConnected,
        loader,
        setLoader,
        organizerStake,

        // Staking
        STAKE_TO_BECOME_ORGANIZER,
        UNSTAKE,
        GET_MIN_STAKE,

        // Events
        CREATE_EVENT,
        GET_ALL_EVENTS,

        // Tickets
        MINT_TICKET,
        VALIDATE_TICKET,

        // Revenue
        WITHDRAW_REVENUE,
        GET_PENDING_REVENUE,

        // Resale
        LIST_FOR_RESALE,
        CANCEL_RESALE,
        BUY_RESALE,

        // View
        GET_TICKET_STATUS,
        GET_EVENT_STATS,
        GET_TOTAL_TICKETS_MINTED,

        // IPFS
        uploadToIPFS,
        uploadJSONToIPFS,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
