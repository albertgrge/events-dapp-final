import React, { useState, useEffect } from "react";
import { useStateContext } from "../Context/index";

//INTERNAL IMPORT
import {
  Theme,
  ConnectWallet,
  Header,
  Hero,
  Collection,
  Image,
  WhyUs,
  About,
  Team,
  Numbers,
  Roadmap,
  Faq,
  Cta,
  Footer,
  CreateEvent,
} from "../Components/index";
import Admin from "../Components/Admin";
import Loader from "../Components/Loader";
import NFTDrop from "../Components/NFTDrop";
import UserNFTs from "../Components/UserNFTs";
import Booking from "../Components/Booking";
import MobileNav from "../Components/MobileNav";

const index = () => {
  const { loader, GET_USER_OWN_NFTS, address } = useStateContext();
  const [admin, setAdmin] = useState(false);
  const [claimNFT, setClaimNFT] = useState();

  const [openUserNFTs, setOpenUserNFTs] = useState(false);
  const [openNav, setOpenNav] = useState(false);
  const [booking, setBooking] = useState();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [customEvents, setCustomEvents] = useState([]);

  // Handle hash-based routing for organizer dashboard
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#organizer') {
        setAdmin(true);
      } else {
        setAdmin(false);
      }
    };
    // Check on mount
    handleHashChange();
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // If admin/organizer is open, show full-screen dashboard
  if (admin) {
    return (
      <div className="uni-body">
        <Admin setAdmin={setAdmin} customEvents={customEvents} setCustomEvents={setCustomEvents} />
        {loader && <Loader />}
        {claimNFT && <NFTDrop claimNFT={claimNFT} setClaimNFT={setClaimNFT} />}
        {booking && <Booking setBooking={setBooking} />}
      </div>
    );
  }

  return (
    <div className="uni-body">
      <Theme setOpenNav={setOpenNav} openNav={openNav} />
      <div className="wrap uk-overflow-hidden">
        <Header setOpenUserNFTs={setOpenUserNFTs} setAdmin={setAdmin} />
        <main>
          {/* Centered Hero with Browse and Create Events */}
          {!openUserNFTs && (
            <>
              <Hero onCreateEvent={() => setShowCreateEvent(true)} />
              {showCreateEvent && (
                <CreateEvent 
                  onClose={() => setShowCreateEvent(false)}
                  onEventCreated={(evt) => setCustomEvents((prev) => [evt, ...prev])}
                />
              )}
              {/* Upcoming Events Section */}
              <section className="uk-section uk-section-small" id="upcoming-events">
                <div className="uk-container uk-text-center">
                  <h2 className="uk-heading-medium uk-margin-large-bottom">Upcoming Events</h2>
                  <Collection setClaimNFT={setClaimNFT} customEvents={customEvents} />
                </div>
              </section>
            </>
          )}
          {openUserNFTs && <UserNFTs GET_USER_OWN_NFTS={GET_USER_OWN_NFTS} address={address} />}
        </main>
      </div>
      <Footer />
      {loader && <Loader />}
      {claimNFT && <NFTDrop claimNFT={claimNFT} setClaimNFT={setClaimNFT} />}
      {booking && <Booking setBooking={setBooking} />}
      {openNav && (
        <MobileNav
          setOpenNav={setOpenNav}
          openNav={openNav}
          address={address}
          setAdmin={setAdmin}
          setOpenUserNFTs={setOpenUserNFTs}
          setBooking={setBooking}
        />
      )}
    </div>
  );
};

export default index;
