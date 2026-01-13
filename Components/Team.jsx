import React from "react";
import {
  TiSocialTwitter,
  TiSocialLinkedin,
  TiSocialYoutube,
} from "react-icons/ti";

import creatorInfo from "./Data/Creator.json";

const Team = () => {
  return (
    <div
      id="uni_team"
      className="uni-team uk-section uk-section-large@m uk-panel uk-overflow-hidden uk-padding-2xlarge-bottom@m"
    >
      <div className="uk-container">
        <header
          className="uk-grid-xsmall uk-flex-center uk-flex-middle uk-text-center uk-child-width-auto@m uk-grid"
          data-uk-grid=""
        >
          <div className="uk-panel">
            <h2 className="uk-h3 uk-h1@m">MintMyTicket's Crew</h2>
          </div>
        </header>
        <div className="uk-panel uk-margin-medium-top uk-margin-2xlarge-top@m">
          <div
            className="uk-position-cover uk-background-cover uk-position-z-index-negative uk-opacity-10 uk-text-gray-100"
            data-src="../assets/images/map.svg"
          />
          <div
            className="uk-grid-small uk-grid-medium@m uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-3@m uk-flex-center uk-grid"
            data-uk-grid="masonry: true;"
          >
            {creatorInfo.map((item, index) => (
              <div
                key={index}
                className={`${
                  index % 2 !== 0 ? "uk-padding-medium-top@m" : ""
                }`}
              >
                <div className="uni-artist uk-panel uk-overflow-hidden">
                  <div
                    className="uni-artist-avatar uk-grid uk-grid-collapse uk-child-width-1-1 uk-flex-middle uk-text-center"
                    data-uk-grid=""
                  >
                    <div>
                      <div className="uk-card uk-card-2xsmall uk-panel uk-overflow-hidden uk-width-xsmall@m uk-radius-circle uk-margin-auto uk-box-shadow-xsmall uk-background-white dark:uk-background-white-5 ">
                        <img
                          className="uk-radius-circle"
                          src={item?.image}
                          alt={item?.name}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="uk-panel uk-card-2xsmall uk-card-small@m uk-text-center">
                        <h3 className="uni-artist-name uk-text-small uk-h5@m uk-margin-2xsmall">
                          {item?.name}
                        </h3>
                        <span className="uni-artist-position uk-text-small uk-text-muted">
                          {item?.job}
                        </span>
                        <ul className="uk-subnav uk-subnav-small uk-flex-center uk-margin-xsmall-top uk-margin-small-top@m">
                          <li>
                            <a href="#">
                              <i className="">
                                <TiSocialYoutube />
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
                                <TiSocialTwitter />
                              </i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
