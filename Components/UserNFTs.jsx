import React, { useState, useEffect } from "react";

const dummyTickets = [
  {
    name: "Tech Conference 2024",
    date: "March 15, 2024",
    location: "San Francisco, CA",
    tokenId: 1234,
    image: "https://via.placeholder.com/400x200.png?text=Tech+Conference+2024",
    status: "Active"
  },
  {
    name: "Art Exhibition",
    date: "May 5, 2024",
    location: "New York, NY",
    tokenId: 5678,
    image: "https://via.placeholder.com/400x200.png?text=Art+Exhibition",
    status: "Validated"
  }
];

const UserNFTs = () => {
  // comment out live wallet logic for static screenshot demo:
  // const [userNFTs, setUserNFTs] = useState();
  // useEffect(() => {
  //   const load = async () => {
  //     const nfts = await GET_USER_OWN_NFTS();
  //     if (!nfts || nfts.length === 0) return [];
  //     setUserNFTs(nfts);
  //   };
  //   load();
  // }, [address]);
  const userNFTs = dummyTickets;
  return (
    <div
      id="uni_collection"
      className="uni-collection uk-panel uk-overflow-hidden uk-padding-2xlarge-bottom@m"
      style={{
        marginTop: "7rem",
        marginBottom: "7rem",
      }}
    >
      <div className="uk-container">
        <h1 className="uk-h2 uk-margin-large-top uk-margin-large-bottom">My Tickets</h1>
        <p className="uk-text-lead uk-margin-bottom">View and manage your NFT tickets</p>
        <div className="uk-panel uk-margin-top uk-margin-xlarge-top@m uk-position-z-index">
          <div
            className="uk-grid-xsmall uk-grid@m uk-child-width-1-2 uk-grid uk-flex"
            data-uk-grid="masonry: true;"
          >
            {userNFTs?.map((nft, index) => (
              <div className="uk-padding-medium-top@m" key={index}>
                <div className="uni-artwork uk-card uk-card-xsmall uk-text-center uk-overflow-hidden uk-radius-medium uk-radius-large@m uk-box-shadow-xsmall dark:uk-background-white-5" style={{ position: 'relative' }}>
                  {/* Ticket Image/Header */}
                  <div className="uni-artwork-featured-image uk-panel uk-flex-middle uk-flex-center" style={{ minHeight: 180, background: '#f5f5f5' }}>
                    <img
                      src={nft?.image}
                      alt={nft?.name}
                      style={{ width: '100%', height: 140, objectFit: 'cover' }}
                    />
                    {/* Status badge top right */}
                    <span style={{ position: 'absolute', top: 18, right: 18, background: nft.status === 'Validated' ? '#fff' : '#000', color: nft.status === 'Validated' ? '#216a31':'#fff', borderRadius: 8, padding: '4px 18px', fontWeight: 700, fontSize: '1em', boxShadow: '0 2px 7px 0 rgba(0,0,0,0.09)' }}>
                      {nft.status}
                    </span>
                  </div>
                  {/* Main Card Body */}
                  <div style={{padding: '24px 12px 12px 12px', background: '#fff', textAlign: 'left'}}>
                    <h2 style={{ fontWeight: 'bold', fontSize: 22, margin: 0, marginBottom: 10 }}>{nft?.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 16 }}>
                      <span className="uk-margin-small-right uk-flex uk-flex-middle"><span uk-icon="icon:calendar" style={{marginRight:'0.25em'}}></span> {nft.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 16 }}>
                      <span className="uk-flex uk-flex-middle"><span uk-icon="icon:location" style={{marginRight:'0.25em'}}></span> {nft.location}</span>
                    </div>
                    <div style={{marginTop:10, background:'#f6f6f8', borderRadius:10, padding:'10px 18px', fontSize: 15, fontWeight:500, marginBottom:10}}>
                      <div style={{color:'#707880'}}>Token ID</div>
                      <div style={{color:'#111'}}>#{nft.tokenId}</div>
                    </div>
                    {/* QR button row */}
                    <div>
                      <button className="uk-button uk-button-default uk-width-1-1 uk-flex uk-flex-center uk-flex-middle" style={{fontWeight:'bold',fontSize:'1em',gap:9,border:'1.5px solid #dedede',height:45}}>
                        <span uk-icon="icon:qrcode"></span>
                        Show QR Code
                      </button>
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

export default UserNFTs;
