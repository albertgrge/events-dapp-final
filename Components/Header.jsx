import React from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = ({ setOpenUserNFTs, setAdmin }) => {
  return (
    <header className="uni-header uk-position-top">
      <div className="uni-header-navbar">
        <div className="uk-container">
          <nav className="uk-navbar uk-navbar-container uk-navbar-transparent">
            <div
              className="uk-navbar-top"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="uk-navbar-left uk-flex-1@m">
                <a
                  href="/"
                  className="uk-logo uk-navbar-item uk-h4 uk-h3@m uk-margin-remove"
                >
                  <img
                    className="uk-visible dark:uk-hidden"
                    width={120}
                    src="../assets/images/nerko-light.svg"
                    alt="MintMyTicket"
                    loading="lazy"
                  />
                </a>
              </div>
              <div className="uk-navbar-center">
                <ul className="uk-navbar-nav dark:uk-text-gray-10 uk-visible@m">
                  <li>
                    <a onClick={() => setOpenUserNFTs(false)} href="#uni_collection">
                      Events
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setOpenUserNFTs(true)} href="#uni_tickets">
                      My Tickets
                    </a>
                  </li>
                  <li>
                    <a onClick={() => { setAdmin(true); window.location.hash = '#organizer'; }} style={{cursor: 'pointer'}}>
                      Organizer
                    </a>
                  </li>
                </ul>
              </div>
              <ConnectButton />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
