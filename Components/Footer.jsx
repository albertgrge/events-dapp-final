import React from "react";
import {
  TiSocialTwitter,
  TiSocialLinkedin,
  TiSocialYoutube,
} from "react-icons/ti";
import { IoIosArrowUp } from "react-icons/io";

const Footer = () => {
  return (
    <footer className="uni-footer uk-section uk-section-xlarge@m uk-border-top">
      <div className="uk-container">
        <div className="uk-panel uk-position-z-index">
          <div className="uk-grid">
            <div className="uk-width-expand@m">
              <div className="uk-panel uk-width-medium@m">
                <a className="uk-logo">
                  <img
                    className="uk-visible dark:uk-hidden"
                    width={120}
                    src="../assets/images/nerko-light.svg"
                    alt="MintMyTicket"
                  />
                  <img
                    className="uk-hidden dark:uk-visible"
                    width={120}
                    src="../assets/images/nerko-dark.svg"
                    alt="MintMyTicket"
                  />
                </a>
                <p className="uk-margin-medium@m">
                  Join our Discord channel or follow us on Twitter keep up to
                  date with our latest work and announcements.
                </p>
                <ul className="uk-subnav uk-subnav-small">
                  <li>
                    <a href="#">
                      <i className="">
                        <TiSocialTwitter />
                      </i>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="">
                        <TiSocialLinkedin />
                      </i>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="">
                        <TiSocialYoutube />
                      </i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="uk-width-2-5@m">
              <div className="uk-grid">
                <div className="uk-width-1-2 uk-width-expand@m">
                  <ul className="uk-list">
                    <li>
                      <a href="#">About</a>
                    </li>
                    <li>
                      <a href="#">Collection</a>
                    </li>
                    <li>
                      <a href="#">Roadmap</a>
                    </li>
                    <li>
                      <a href="#">FAQs</a>
                    </li>
                  </ul>
                </div>
                <div className="uk-width-1-2 uk-width-expand@m">
                  <ul className="uk-list">
                    <li>
                      <a href="#">How it works!</a>
                    </li>
                    <li>
                      <a href="#">Community</a>
                    </li>
                    <li>
                      <a href="#">Get in touch</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="uk-panel uk-text-small uk-margin-medium-top uk-margin-2xlarge-top@m">
            <div className="uk-grid uk-child-width-auto@m uk-flex-between">
              <div>
                <ul className="uk-subnav uk-subnav-small">
                  <li>
                    <a href="#">Privacy policy</a>
                  </li>
                  <li>
                    <a href="#">Terms of use</a>
                  </li>
                  <li>
                    <a
                      href="https://sepolia.basescan.org/address/0xf02f081007a5C5c427F04bB11aDcC9fEe4de1c7F"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Contract
                    </a>
                  </li>
                  <li className="uk-margin-small-left">
                    <a href="#">
                      <i className="">
                        <IoIosArrowUp />
                      </i>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="uk-flex-first@m">
                <p>© 2022 MintMyTicket. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
