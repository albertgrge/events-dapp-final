import React, { useState, useEffect } from "react";
import { FaArrowTrendUp } from "react-icons/fa6";
import { useStateContext } from "../Context/index";

import events from "../Components/Data/Events.json";
const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER;
const NFTS_AIRDROP = process.env.NEXT_PUBLIC_NFTS_AIRDROP;

const Collection = ({ setClaimNFT, customEvents = [] }) => {
  const { GET_ALL_EVENTS } = useStateContext();
  const [airdrops, setAirdrops] = useState();
  const [blockchainEvents, setBlockchainEvents] = useState([]);

  useEffect(() => {
    const load = async () => {
      const airdropsLists = JSON.parse(localStorage.getItem("NFTS_AIRDROPS"));

      console.log(airdropsLists);

      if (!airdropsLists || airdropsLists.length === 0) return [];

      setAirdrops(airdropsLists);
    };
    load();
  }, []);

  useEffect(() => {
    const loadBlockchainEvents = async () => {
      try {
        const eventsFromChain = await GET_ALL_EVENTS();
        console.log("Blockchain events:", eventsFromChain);
        setBlockchainEvents(eventsFromChain || []);
      } catch (error) {
        console.error("Error loading blockchain events:", error);
      }
    };

    if (GET_ALL_EVENTS) {
      loadBlockchainEvents();
    }
  }, [GET_ALL_EVENTS]);
  return (
    <div
      id="uni_collection"
      className="uni-collection uk-panel uk-overflow-hidden uk-padding-2xlarge-bottom@m"
    >
      <div className="uk-container">
        <div className="uk-panel uk-margin-top uk-margin-xlarge-top@m uk-position-z-index">
          <div
            className="uk-grid-xsmall uk-grid@m uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-4@m uk-grid"
            data-uk-grid="masonry: true;"
          >
            {[...(blockchainEvents || []), ...(customEvents || []), ...(events || [])].map((nft, index) => (
              <div key={index} className="uk-padding-medium-top@m">
                <div
                  onClick={() => setClaimNFT({
                    ...nft,
                    IPFS_URL: nft.IPFS_URL || nft.image, // Ensure IPFS_URL is available for minting
                  })}
                  className="uni-artwork uk-card uk-card-xsmall uk-text-center uk-overflow-hidden uk-radius-medium uk-radius-large@m uk-box-shadow-xsmall dark:uk-background-white-5"
                >
                  <div className="uni-artwork-featured-image uk-panel uk-flex-middle uk-flex-center">
                    <div className="uk-panel uk-image-middle">
                      <img
                        src={nft?.image}
                        alt={nft?.name}
                        className="uk-radius-small uk-radius-medium@m"
                      />
                      <a className="uk-position-cover" />
                    </div>
                  </div>
                  <div className="uni-artwork-content uk-panel uk-margin-small-top uk-margin-2xsmall-bottom uk-flex-column uk-flex-middle">
                    <h2 className="uk-h6 uk-h5@m uk-margin-remove">
                      <a className="uk-link-reset" href="#">
                        {nft?.name}
                      </a>
                    </h2>
                    <div className="uk-text-meta uk-margin-xsmall-top">{nft?.description}</div>
                    <div className="uk-grid-small uk-flex-center uk-margin-top" data-uk-grid>
                      <div>
                        <span className="uk-text-bold">
                          {nft?.date} | {nft?.location}
                        </span>
                      </div>
                    </div>
                    <div className="uk-grid-small uk-flex-center uk-margin-top" data-uk-grid>
                      <div>
                        <span className="uk-text-muted">
                          {nft?.ticketsLeft} / {nft?.totalTickets} available
                        </span>
                      </div>
                      <div>
                        <span className="uk-text-bold" style={{ marginLeft: 10 }}>
                          {nft?.price} {nft?.currency}
                        </span>
                      </div>
                    </div>
                    <div className="uk-margin-top">
                      {nft?.ticketsLeft > 0 ? (
                        <a className="uk-button uk-button-primary">Buy Ticket</a>
                      ) : (
                        <span className="uk-label uk-label-danger" style={{ fontSize: '1.1em', padding: '.7em 2em' }}>SOLD OUT</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="uni-btn uk-margin-medium-top uk-margin-2xlarge-top@m uk-flex-center">
            <a
              href={`${BLOCK_EXPLORER}${NFTS_AIRDROP}`}
              target="_blank"
              className="uk-button uk-button-small uk-button-large@m uk-button-gradient"
            >
              <span>View Contract</span>
              <i className="">
                <FaArrowTrendUp />
              </i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;
