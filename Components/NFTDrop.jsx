import React from "react";

import { useStateContext } from "../Context/index";
const NFTDrop = ({ claimNFT, setClaimNFT }) => {
  const { CREATE_NFT, MINT_TICKET, loader } = useStateContext();

  // Check if this is an event ticket (has eventId and price) or a legacy NFT
  const isEventTicket = claimNFT?.eventId !== undefined || claimNFT?.price !== undefined;
  const displayPrice = isEventTicket
    ? `${claimNFT?.price || '0.001'} ${claimNFT?.currency || 'ETH'}`
    : '0.00025 ETH';

  const handlePurchase = () => {
    if (isEventTicket) {
      // For event tickets, use MINT_TICKET with event-specific data
      const eventData = {
        eventId: claimNFT?.eventId || 1, // Default to 1 if not set
        ticketPrice: claimNFT?.price || 0.001,
        IPFS_URL: claimNFT?.IPFS_URL || claimNFT?.image,
        name: claimNFT?.name,
      };
      MINT_TICKET(eventData);
    } else {
      // For legacy NFTs, use CREATE_NFT
      CREATE_NFT(claimNFT);
    }
  };

  return (
    <div className="new-loader-wrapper">
      <div className="modal">
        <div className="modal-body">
          <div className="uni-artwork-featured-image uk-panel uk-flex-middle uk-flex-center">
            <div className="uk-padding-medium-top@m">
              <div className="uni-artwork uk-card uk-card-xsmall uk-text-center uk-overflow-hidden uk-radius-medium uk-radius-large@m uk-box-shadow-xsmall dark:uk-background-white-5">
                <div className="uni-artwork-featured-image uk-panel uk-flex-middle uk-flex-center">
                  <div className="uk-panel uk-image-middle">
                    <img
                      src={claimNFT?.image}
                      alt={claimNFT?.name}
                      className="uk-radius-small uk-radius-medium@m"
                    />
                    <a className="uk-position-cover" />
                  </div>
                </div>
                <div className="uni-artwork-content uk-panel uk-margin-small-top uk-margin-2xsmall-bottom uk-flex-column uk-flex-middle">
                  <h2 className="uk-h6 uk-h5@m uk-margin-remove">
                    <a className="uk-link-reset" href="#">
                      {claimNFT?.name}
                    </a>
                  </h2>
                  {claimNFT?.description && (
                    <span className="uk-text-meta uk-margin-xsmall-top uk-visible@m">
                      {claimNFT?.description}
                    </span>
                  )}
                  {isEventTicket && claimNFT?.date && (
                    <span className="uk-text-meta uk-margin-xsmall-top uk-visible@m">
                      📅 {claimNFT?.date}
                    </span>
                  )}
                  {isEventTicket && claimNFT?.location && (
                    <span className="uk-text-meta uk-margin-xsmall-top uk-visible@m">
                      📍 {claimNFT?.location}
                    </span>
                  )}
                  {!isEventTicket && (
                    <span className="uk-text-meta uk-margin-xsmall-top uk-visible@m">
                      By @theblockchaincoders
                    </span>
                  )}
                  <span className="uk-text-meta uk-margin-xsmall-top uk-visible@m">
                    Pay: {displayPrice}
                  </span>
                  {isEventTicket && claimNFT?.ticketsLeft !== undefined && (
                    <span className="uk-text-meta uk-margin-xsmall-top uk-visible@m">
                      {claimNFT?.ticketsLeft} / {claimNFT?.totalTickets} tickets available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setClaimNFT("")}>
            Cancel
          </button>

          {loader ? (
            <svg className="new_svg" viewBox="25 25 50 50">
              <circle className="new_circle" r="20" cy="50" cx="50"></circle>
            </svg>
          ) : (
            <button
              className="btn-primary"
              onClick={handlePurchase}
            >
              {isEventTicket ? 'Buy Ticket' : 'Claim NFT'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTDrop;
