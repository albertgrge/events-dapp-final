import axios from "axios";
import toast from "react-hot-toast";

import EventTicketNFT from "./EventTicketNFT.json";

const notifySuccess = (msg) => toast.success(msg, { duration: 2000 });
const notifyError = (msg) => toast.error(msg, { duration: 2000 });

export const NFTS_AIRDROP_ABI = EventTicketNFT;
export const NFTS_AIRDROP_ADDRESS = process.env.NEXT_PUBLIC_NFTS_AIRDROP || "0xD4C2cCCF179AD4ecff76e5CaBDB22656ba0ebde2";
export const CONTRACT_DEPLOY_BLOCK = 10403654; // block when contract was deployed on Sepolia
export const CONTRACT_EXPLORER_URL = "https://sepolia.etherscan.io/address/0xD4C2cCCF179AD4ecff76e5CaBDB22656ba0ebde2";


//PINATE API - SECRECT KEYS
const PINATA_AIP_KEY = process.env.NEXT_PUBLIC_PINATA_AIP_KEY;
const PINATA_SECRECT_KEY = process.env.NEXT_PUBLIC_PINATA_SECRECT_KEY;

export const copyText = (text) => {
  navigator.clipboard.writeText(text);
  notifySuccess("Text copied successfully");
};

export const SHORTEN_ADDRESS = (address) =>
  `${address?.slice(0, 8)}...${address?.slice(address.length - 4)}`;

//--IMAGE UPLOAD
export const UPLOAD_IPFS_IMAGE = async (file) => {
  if (file) {
    const formData = new FormData();
    formData.append("file", file);

    console.log(file);

    const response = await axios({
      method: "post",
      url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data: formData,
      headers: {
        pinata_api_key: PINATA_AIP_KEY,
        pinata_secret_api_key: PINATA_SECRECT_KEY,
        "Content-Type": "multipart/form-data",
      },
    });
    const ImgHash = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    notifySuccess("Uploaded successfully");
    return ImgHash;
  }
};

//--METADAT UPLOAD
export const UPLOAD_METADATA = async (nft, address) => {
  const { name, description, category, image } = nft;

  if (!name || !description || !image || !category)
    return notifyError("Data is missing");

  const data = JSON.stringify({
    name: name,
    description: description,
    category: category,
    image: image,
    creator: address,
  });

  const response = await axios({
    method: "POST",
    url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    data: data,
    headers: {
      pinata_api_key: PINATA_AIP_KEY,
      pinata_secret_api_key: PINATA_SECRECT_KEY,
      "Content-Type": "application/json",
    },
  });

  const _IPFS_URL = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

  const NFTS_AIRDROPS = {
    name: name,
    description: description,
    category: category,
    image: image,
    creator: address,
    IPFS_URL: _IPFS_URL,
  };

  let localNFTsAirDrop = [];

  const localNFTs = localStorage.getItem("NFTS_AIRDROPS");
  if (localNFTs) {
    localNFTsAirDrop = JSON.parse(localStorage.getItem("NFTS_AIRDROPS"));
    localNFTsAirDrop.push(NFTS_AIRDROPS);
    localStorage.setItem("NFTS_AIRDROPS", JSON.stringify(localNFTsAirDrop));
    notifySuccess("Uploaded successfully");
  } else {
    localNFTsAirDrop.push(NFTS_AIRDROPS);
    localStorage.setItem("NFTS_AIRDROPS", JSON.stringify(localNFTsAirDrop));
    notifySuccess("Uploaded successfully");
  }

  return _IPFS_URL;
};

export function toWei(amount, decimals = 18) {
  const toWei = ethers.utils.parseUnits(amount, decimals);
  return toWei.toString();
}

export function toEth(amount, decimals = 18) {
  const toEth = ethers.utils.formatUnits(amount, decimals);
  return toEth.toString();
}

export function parseErrorMsg(e) {
  const json = JSON.parse(JSON.stringify(e));
  return json?.reason || json?.error?.message;
}
