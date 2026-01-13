import React, {
  useMemo,
  useState,
  useContext,
  createContext,
  useEffect,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BigNumber, ethers } from "ethers";
import { config } from "../Context/wagmiConfigs";

import { useAccount, useBalance, useChains } from "wagmi";

import {
  NFTS_AIRDROP_ABI,
  NFTS_AIRDROP_ADDRESS,
  parseErrorMsg,
} from "./constants";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const notifySuccess = (msg) => toast.success(msg, { duration: 2000 });
  const notifyError = (msg) => toast.error(msg, { duration: 2000 });

  const provider = useEthersProvider();
  const signer = useEthersSigner();
  const chains = useChains();

  const [loader, setLoader] = useState(false);
  const [userRole, setUserRole] = useState({
    isAdmin: false,
    isOrganizer: false,
    isUser: true,
  });
  const [adminAddress, setAdminAddress] = useState(null);

  const { address, isConnected } = useAccount({
    config: config,
  });

  // Fetch user role on address change
  useEffect(() => {
    if (address && provider) {
      checkUserRole();
    }
  }, [address, provider]);

  // Check user role based on smart contract data
  const checkUserRole = async () => {
    try {
      if (!address || !provider) return;

      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        provider
      );

      // Get admin address from contract
      const contractAdmin = await contract.admin();
      setAdminAddress(contractAdmin);

      // Check if user is admin
      const isAdmin = address.toLowerCase() === contractAdmin.toLowerCase();

      // Check if user is an event organizer
      const organizerEvents = await contract.getOrganizerEvents(address);
      const isOrganizer = organizerEvents.length > 0;

      setUserRole({
        isAdmin,
        isOrganizer,
        isUser: !isAdmin && !isOrganizer, // Regular user if not admin or organizer
      });

      console.log('User Role:', {
        address,
        isAdmin,
        isOrganizer,
        eventsCreated: organizerEvents.length,
      });
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  // Helper function to get admin address
  const getAdminAddress = async () => {
    try {
      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        provider
      );
      return await contract.admin();
    } catch (error) {
      console.error('Error getting admin address:', error);
      return null;
    }
  };

  // Helper function to check if current user is admin
  const isCurrentUserAdmin = () => {
    return userRole.isAdmin;
  };

  // Helper function to check if current user is organizer
  const isCurrentUserOrganizer = () => {
    return userRole.isOrganizer;
  };

  // Get organizer's events
  const GET_ORGANIZER_EVENTS = async (organizerAddress = address) => {
    try {
      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        provider
      );

      const eventIds = await contract.getOrganizerEvents(organizerAddress);

      // Fetch full event details
      const events = await Promise.all(
        eventIds.map(async (eventId) => {
          const event = await contract.getEvent(eventId);
          return {
            eventId: event.eventId.toNumber(),
            name: event.eventName,
            organizer: event.organizer,
            price: parseFloat(ethers.utils.formatEther(event.ticketPrice)),
            currency: 'ETH',
            totalTickets: event.totalTickets.toNumber(),
            ticketsLeft: event.totalTickets.toNumber() - event.ticketsSold.toNumber(),
            ticketsSold: event.ticketsSold.toNumber(),
            isActive: event.isActive,
          };
        })
      );

      return events;
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      return [];
    }
  };

  // Get platform statistics (admin only)
  const GET_PLATFORM_STATS = async () => {
    try {
      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        provider
      );

      const allEvents = await contract.getAllEvents();

      let totalRevenue = 0;
      let totalTicketsSold = 0;
      let activeEvents = 0;

      allEvents.forEach((event) => {
        const ticketsSold = event.ticketsSold.toNumber();
        const ticketPrice = parseFloat(ethers.utils.formatEther(event.ticketPrice));

        totalTicketsSold += ticketsSold;
        totalRevenue += ticketsSold * ticketPrice;

        if (event.isActive) activeEvents++;
      });

      return {
        totalEvents: allEvents.length,
        activeEvents,
        totalTicketsSold,
        totalRevenue,
        mintFee: parseFloat(ethers.utils.formatEther(await contract.mintFee())),
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return null;
    }
  };


  const CREATE_NFT = async (nft) => {
    try {
      const { IPFS_URL, name } = nft;
      setLoader(true);

      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        signer
      );
      const listingPrice = await contract.mintFee();
      const transaction = await contract.mint(IPFS_URL, name, {
        value: listingPrice.toString(),
      });

      const receipt = await transaction.wait();

      const message = "NFT Mint Successfully";

      setLoader(false);
      notifySuccess("Successfully created");
      window.location.reload();
    } catch (error) {
      setLoader(false);
      const errorMessage = parseErrorMsg(error);
      notifyError(errorMessage);
    }
  };

  // Upload to IPFS using Pinata (or fallback to base64 data URL for testing)
  const uploadToIPFS = async (file) => {
    try {
      // For now, we'll use a simple approach with base64 data URLs
      // In production, you should use Pinata or another IPFS service
      if (typeof file === 'string' && file.startsWith('data:')) {
        // Already a data URL, return as is
        return file;
      }

      // If you have Pinata API keys, uncomment and use this:
      /*
      const formData = new FormData();
      formData.append('file', file);
      
      const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
        }
      );
      
      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      */

      return file;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  };

  const uploadJSONToIPFS = async (jsonData) => {
    try {
      // For testing, we'll create a data URL with JSON
      const jsonString = JSON.stringify(jsonData);
      const dataUrl = `data:application/json;base64,${btoa(jsonString)}`;

      // If you have Pinata API keys, uncomment and use this:
      /*
      const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        jsonData,
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
        }
      );
      
      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      */

      return dataUrl;
    } catch (error) {
      console.error('JSON IPFS upload error:', error);
      throw error;
    }
  };

  const CREATE_EVENT = async (eventData) => {
    try {
      const { name, description, date, location, price, totalTickets, image } = eventData;
      setLoader(true);

      // Upload image to IPFS
      const imageUrl = await uploadToIPFS(image);

      // Create metadata object
      const metadata = {
        name,
        description,
        date,
        location,
        image: imageUrl,
        attributes: [
          { trait_type: 'Event Date', value: date },
          { trait_type: 'Location', value: location },
          { trait_type: 'Ticket Price', value: `${price} ETH` },
        ],
      };

      // Upload metadata to IPFS
      const metadataUrl = await uploadJSONToIPFS(metadata);

      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        signer
      );

      // Convert price to wei
      const priceInWei = ethers.utils.parseEther(price.toString());

      // Call smart contract createEvent function
      const transaction = await contract.createEvent(
        priceInWei,
        name,
        parseInt(totalTickets)
      );

      const receipt = await transaction.wait();

      // Get the event ID from the transaction
      const eventId = receipt.events?.find(e => e.event === 'EventCreated')?.args?.eventId?.toNumber() ||
        await contract._eventIds.current().then(id => id.toNumber());

      setLoader(false);
      notifySuccess('Event created successfully!');

      // Return the created event data
      return {
        eventId,
        name,
        description,
        date,
        location,
        price,
        currency: 'ETH',
        totalTickets: parseInt(totalTickets),
        ticketsLeft: parseInt(totalTickets),
        image: imageUrl,
        IPFS_URL: metadataUrl,
      };
    } catch (error) {
      setLoader(false);
      const errorMessage = parseErrorMsg(error);
      notifyError(errorMessage);
      throw error;
    }
  };

  const GET_ALL_EVENTS = async () => {
    try {
      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        provider
      );

      const events = await contract.getAllEvents();

      const formattedEvents = await Promise.all(
        events.map(async (event) => {
          try {
            // Try to fetch metadata if available
            let metadata = {};

            return {
              eventId: event.eventId.toNumber(),
              name: event.eventName,
              organizer: event.organizer,
              price: parseFloat(ethers.utils.formatEther(event.ticketPrice)),
              currency: 'ETH',
              totalTickets: event.totalTickets.toNumber(),
              ticketsLeft: event.totalTickets.toNumber() - event.ticketsSold.toNumber(),
              ticketsSold: event.ticketsSold.toNumber(),
              isActive: event.isActive,
              description: metadata.description || 'Blockchain event',
              date: metadata.date || 'TBA',
              location: metadata.location || 'TBA',
              image: metadata.image || 'https://via.placeholder.com/400x200.png?text=Event',
            };
          } catch (error) {
            console.error('Error formatting event:', error);
            return null;
          }
        })
      );

      return formattedEvents.filter(e => e !== null && e.isActive);
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  };

  const MINT_TICKET = async (eventData) => {
    try {
      const { eventId, ticketPrice, IPFS_URL, name } = eventData;
      setLoader(true);

      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        signer
      );

      // Convert ticket price to wei (assuming ticketPrice is in ETH)
      const priceInWei = ethers.utils.parseEther(ticketPrice.toString());

      const transaction = await contract.mintTicket(
        eventId,
        IPFS_URL,
        name,
        {
          value: priceInWei,
        }
      );

      const receipt = await transaction.wait();

      setLoader(false);
      notifySuccess("Ticket purchased successfully!");
      window.location.reload();
    } catch (error) {
      setLoader(false);
      const errorMessage = parseErrorMsg(error);
      notifyError(errorMessage);
    }
  };

  const GET_USER_OWN_NFTS = async () => {
    try {
      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        signer
      );

      const ownNFTs = await contract.fetchUserOwnedNFTs(address);

      const nfts = await Promise.all(
        ownNFTs.map(async ({ tokenId, creator, tokenURI }) => {
          const {
            data: { name, description, category, image, size, type },
          } = await axios.get(tokenURI, {});

          return {
            name,
            description,
            category,
            image,
            tokenId: tokenId.toNumber(),
            creator,
            tokenURI,
          };
        })
      );

      return nfts;
    } catch (error) {
      console.log(error);
    }
  };

  const GET_USER_CREATED_NFTS = async () => {
    try {
      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        signer
      );

      const ownNFTs = await contract.fetchUserCreatedNFTs(address);

      const nfts = await Promise.all(
        ownNFTs.map(async ({ tokenId, creator, tokenURI }) => {
          const {
            data: { name, description, category, image, type },
          } = await axios.get(tokenURI, {});

          return {
            name,
            description,
            category,
            image,
            tokenId: tokenId.toNumber(),
            creator,
            tokenURI,
          };
        })
      );

      return nfts;
    } catch (error) {
      console.log(error);
    }
  };

  const ALL_NOTIFICATIONS = async () => {
    try {
      const contract = new ethers.Contract(
        NFTS_AIRDROP_ADDRESS,
        NFTS_AIRDROP_ABI,
        signer
      );

      const notifications = await contract.GET_NOTIFICATIONS();

      const nfts = await Promise.all(
        notifications.map(
          async ({ id, userAddress, message, timestamp, nftID }) => {
            return {
              id: id.toNumber(),
              userAddress,
              message,
              timestamp: timestamp.toNumber(),
              nftID: nftID.toNumber(),
            };
          }
        )
      );

      return nfts;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <StateContext.Provider
      value={{
        CREATE_NFT,
        CREATE_EVENT,
        MINT_TICKET,
        GET_USER_OWN_NFTS,
        GET_USER_CREATED_NFTS,
        GET_ALL_EVENTS,
        GET_ORGANIZER_EVENTS,
        GET_PLATFORM_STATS,
        ALL_NOTIFICATIONS,
        checkUserRole,
        getAdminAddress,
        isCurrentUserAdmin,
        isCurrentUserOrganizer,
        userRole,
        adminAddress,
        loader,
        address,
        setLoader,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
