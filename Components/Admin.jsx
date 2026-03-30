

import React, { useState } from "react";
import { Admin_1 } from "../Components/SVG/index";
import eventsData from "../Components/Data/Events.json";
import CreateEvent from "../Components/CreateEvent";
import ValidateTicket from "../Components/ValidateTicket";
import Header from "../Components/Header";

// ------ Stat Card Component ------
const StatCard = ({ title, value, subtitle, icon }) => (
  <div style={{ flex: 1, minWidth: 180, background: '#fff', boxShadow: '0 2px 10px #0001', borderRadius: '18px', padding: '2.5em 1.3em', margin: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{icon}<span style={{ fontWeight: 700, fontSize: '1.07em' }}>{title}</span></div>
    <div style={{ fontSize: '2em', fontWeight: 700, marginTop: 14 }}>{value}</div>
    <div style={{ fontSize: '1em', color: '#838383', marginTop: 4 }}>{subtitle}</div>
  </div>
);

// ------ Single Event Row ------
const EventRow = ({ evt }) => (
  <div className="uk-card uk-card-small uk-card-body uk-flex uk-flex-between" style={{ marginBottom: '16px', alignItems: 'center', background: '#fafbfc', borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontWeight: '600', fontSize: '1.13em' }}>{evt.name}</div>
      <span style={{ fontSize: '0.96em', color: '#444' }}>{evt.totalTickets - evt.ticketsLeft} tickets sold • {((evt.price * (evt.totalTickets - evt.ticketsLeft)).toFixed(2))} {evt.currency} revenue</span>
    </div>
    <div>
      {evt.ticketsLeft === 0 ? (
        <span className="uk-label" style={{ fontSize: '1em', background: '#eee', color: '#555', borderRadius: 7, padding: '5px 18px' }}>Sold Out</span>
      ) : (
        <span className="uk-label uk-label-success" style={{ fontSize: '1em', borderRadius: 7, padding: '5px 18px', background: '#13d354' }}>Active</span>
      )}
    </div>
  </div>
);

const Admin = ({ setAdmin, customEvents = [], setCustomEvents }) => {
  // -- For adding new event (local/demo only) --
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showValidateTicket, setShowValidateTicket] = useState(false);
  // combine static and new events
  const events = [...customEvents, ...eventsData];

  const handleClose = () => {
    setAdmin(false);
    window.location.hash = '';
  };

  const handleNavClick = (action) => {
    if (action === 'events' || action === 'tickets') {
      setAdmin(false);
      window.location.hash = '';
    }
  };

  // Calculate stats
  const activeEvents = events.filter(e => e.ticketsLeft > 0).length;
  const ticketsSold = events.reduce((sum, e) => sum + (e.totalTickets - e.ticketsLeft), 0);
  const totalRevenue = events.reduce((sum, e) => sum + (e.price * (e.totalTickets - e.ticketsLeft)), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header
        setOpenUserNFTs={(val) => {
          if (val) {
            handleClose();
            window.location.hash = '#uni_tickets';
          } else {
            handleClose();
            window.location.hash = '';
          }
        }}
        setAdmin={(val) => {
          if (!val) handleClose();
        }}
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '80px', paddingLeft: '2em', paddingRight: '2em', paddingBottom: '2em' }}>
        {/* Dashboard Title Section */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2em',
          paddingBottom: '1.5em',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: '1', minWidth: '300px' }}>
            <div className="modal-logo">
              <span className="logo-circle">
                <Admin_1 />
              </span>
            </div>
            <div>
              <h1 style={{ fontWeight: '700', fontSize: '2.7em', margin: 0, lineHeight: '1.2' }}>
                Organizer Dashboard
              </h1>
              <div style={{ fontSize: '1.25em', color: '#666', marginTop: '0.3em' }}>
                Manage your events and validate tickets
              </div>
            </div>
          </div>
          {/* Action buttons - side by side */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <button
              className="uk-button uk-button-secondary"
              style={{
                fontWeight: 'bold',
                padding: '0.7em 1.5em',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setShowValidateTicket(true)}
            >
              Validate Ticket
            </button>
            <button
              className="uk-button uk-button-primary"
              style={{
                fontWeight: 'bold',
                padding: '0.7em 1.5em',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setShowCreateEvent(true)}
            >
              + Create Event
            </button>
          </div>
        </div>
        {/* Statistics grid */}
        <div style={{ display: 'flex', gap: '36px', margin: '0 0 45px 0', flexWrap: 'wrap' }}>
          <StatCard title="Total Events" value={activeEvents} subtitle="Active events" />
          <StatCard title="Tickets Sold" value={ticketsSold.toLocaleString()} subtitle="Across all events" />
          <StatCard title="Total Revenue" value={totalRevenue.toFixed(2) + " ETH"} subtitle="Total earnings" />
        </div>

        {/* Event List */}
        <div style={{ background: '#fafbfc', borderRadius: 16, padding: '35px 24px 18px 24px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.35em', marginBottom: '8px' }}>Your Events</div>
          <div style={{ color: '#838383', marginBottom: '24px', fontSize: '1.08em' }}>Manage and monitor your created events</div>
          <div style={{ width: '100%', maxWidth: 880 }}>
            {events.map((evt, idx) => (<EventRow evt={evt} key={idx} />))}
          </div>
        </div>
        {showCreateEvent && (
          <CreateEvent
            onClose={() => setShowCreateEvent(false)}
            onEventCreated={evt => setCustomEvents(evs => [evt, ...evs])}
          />
        )}
        {showValidateTicket && (
          <ValidateTicket
            onClose={() => setShowValidateTicket(false)}
            events={events}
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
