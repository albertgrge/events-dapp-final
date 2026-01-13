import React, { useState, useEffect } from "react";

import { useStateContext } from "../Context/index";

import { Admin_1, Admin_2, Admin_3 } from "../Components/SVG/index";
import Input from "../Components/Input";

const Booking = ({ setBooking }) => {
  const { ALL_NOTIFICATIONS } = useStateContext();
  const [notifyArray, setNotifyArray] = useState();
  const [notifyArrayCopy, setNotifyArrayCopy] = useState();

  const [search, setSearch] = useState("");
  const [searchItem, setSearchItem] = useState(search);

  useEffect(() => {
    const load = async () => {
      const notifications = await ALL_NOTIFICATIONS();
      setNotifyArray(notifications);
      setNotifyArrayCopy(notifications);
      console.log(notifications);
    };
    load();
  }, []);

  const onHandleSearch = (value) => {
    const filteredNFTS = notifyArray.filter(
      ({ message, nftID, userAddress }) =>
        message.toLowerCase().includes(value.toLowerCase()) ||
        nftID.toString().toLowerCase().includes(value.toLowerCase()) ||
        userAddress.toLowerCase().includes(value.toLowerCase())
    );

    if (filteredNFTS.length === 0) {
      setNotifyArray(notifyArrayCopy);
    } else {
      setNotifyArray(filteredNFTS);
    }
  };

  const onClearSearch = () => {
    if (notifyArray?.length && notifyArrayCopy.length) {
      setNotifyArray(notifyArrayCopy);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchItem), 1000);
    return () => clearTimeout(timer);
  }, [searchItem]);

  useEffect(() => {
    if (search) {
      onHandleSearch(search);
    } else {
      onClearSearch();
    }
  }, [search]);
  return (
    <div className="new-loader-wrapper">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-logo">
            <span className="logo-circle">
              <Admin_1 />
            </span>
          </div>
          <button className="btn-close" onClick={() => setBooking(false)}>
            <Admin_2 />
          </button>
        </div>
        <div className="uk-grid-2xsmall uk-grid uk-child-width-auto@m uk-flex-middle uk-flex-center uk-margin-small-top uk-margin-medium-top@m">
          <div className="uk-first-column">
            <input
              type="text"
              placeholder="Event Name"
              className="uk-input uk-form-medium uk-form-large@m uk-width-large@m"
              onChange={(e) => setSearchItem(e.target.value)}
              value={searchItem}
            />
          </div>
        </div>
        <div class="table-container">
          <table class="responsive-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>NFT ID</th>
              </tr>
            </thead>
            <tbody>
              {notifyArray?.map((item, index) => (
                <tr key={index}>
                  <td>{item?.message}</td>
                  <td>#-{item?.nftID}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Booking;
