import React from "react";

import { MobileNav_1, Admin_2 } from "../Components/SVG/index";
import Input from "../Components/Input";

const ADDMIN = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

const MobileNav = ({
  setOpenNav,
  openNav,
  address,
  setAdmin,
  setOpenUserNFTs,
  setBooking,
}) => {
  return (
    <div className="new-loader-wrapper">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-logo">
            <span className="logo-circle">
              <MobileNav_1 />
            </span>
          </div>
          <button className="btn-close" onClick={() => setOpenNav(!openNav)}>
            <Admin_2 />
          </button>
        </div>
        <div className="modal-body">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              onClick={() => (setOpenUserNFTs(true), setOpenNav(!openNav))}
              class="card"
            >
              <h5 class="card-title">Your NFTs</h5>
            </div>
            <div
              onClick={() => (setBooking(true), setOpenNav(!openNav))}
              class="card"
            >
              <h5 class="card-title">Booking</h5>
            </div>
            {address == ADDMIN && (
              <div
                onClick={() => (setAdmin(true), setOpenNav(!openNav))}
                class="card"
              >
                <h5 class="card-title">Admin</h5>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
