import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">EventTicketNFT</div>
            <p className="footer-desc">
              The future of event ticketing. Mint NFT tickets, validate at the
              gate, and trade on-chain with organizer royalties.
            </p>
          </div>

          <div>
            <div className="footer-title">Platform</div>
            <ul className="footer-links">
              <li><Link href="/events">Browse Events</Link></li>
              <li><Link href="/marketplace">Marketplace</Link></li>
              <li><Link href="/my-tickets">My Tickets</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-title">Organizers</div>
            <ul className="footer-links">
              <li><Link href="/create-event">Create Event</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-title">Resources</div>
            <ul className="footer-links">
              <li><a href="https://sepolia.basescan.org" target="_blank" rel="noopener noreferrer">BaseScan</a></li>
              <li><a href="https://docs.openzeppelin.com/" target="_blank" rel="noopener noreferrer">OpenZeppelin</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} EventTicketNFT — Built on Base Sepolia
        </div>
      </div>
    </footer>
  );
};

export default Footer;
