import React, { useState } from "react";
import { Admin_2 } from "../Components/SVG/index";
import Input from "./Input";

const ValidateTicket = ({ onClose, events = [] }) => {
  const [ticketId, setTicketId] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [scanMode, setScanMode] = useState(false);

  const handleValidate = async () => {
    if (!ticketId.trim()) {
      alert("Please enter a ticket ID");
      return;
    }

    setIsValidating(true);
    
    // Simulate validation process
    setTimeout(() => {
      // Mock validation logic - in real app, this would check against blockchain/backend
      const isValid = ticketId.length >= 8; // Simple validation for demo
      const event = events[0] || null; // Get first event as example
      
      setValidationResult({
        valid: isValid,
        ticketId: ticketId,
        eventName: event ? event.name : "Tech Conference 2024",
        eventDate: event ? event.date : "March 15, 2024",
        ticketHolder: isValid ? "0x1234...5678" : null,
        purchaseDate: isValid ? "March 1, 2024" : null,
        price: event ? event.price : 0.05,
        currency: event ? event.currency : "ETH"
      });
      setIsValidating(false);
    }, 1500);
  };

  const handleScanQR = () => {
    setScanMode(true);
    // In a real app, this would open camera/QR scanner
    alert("QR Scanner would open here. For demo, please enter ticket ID manually.");
    setScanMode(false);
  };

  const handleReset = () => {
    setTicketId("");
    setValidationResult(null);
  };

  return (
    <div className="new-loader-wrapper" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '600px', width: '95%' }}>
        <div className="modal-header">
          <div className="modal-logo">
            <span className="logo-circle" style={{ fontWeight: 'bold', fontSize: 20 }}>
              Validate Ticket
            </span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <Admin_2 />
          </button>
        </div>

        <div className="modal-body">
          {!validationResult ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '1.1em', marginBottom: '16px', color: '#666' }}>
                  Enter ticket ID or scan QR code to validate
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
                  className="uk-button uk-button-secondary"
                  onClick={handleScanQR}
                  style={{ flex: 1, padding: '12px' }}
                >
                  📷 Scan QR Code
                </button>
              </div>

              <Input
                name="Ticket ID"
                handleChange={(e) => setTicketId(e.target.value)}
              />
              <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#888' }}>
                Enter the ticket ID or transaction hash
              </div>

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleValidate}
                  disabled={isValidating || !ticketId.trim()}
                >
                  {isValidating ? "Validating..." : "Validate Ticket"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                padding: '24px',
                borderRadius: '12px',
                background: validationResult.valid ? '#d4edda' : '#f8d7da',
                border: `2px solid ${validationResult.valid ? '#28a745' : '#dc3545'}`,
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '1.5em',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: validationResult.valid ? '#155724' : '#721c24'
                }}>
                  {validationResult.valid ? '✓ Valid Ticket' : '✗ Invalid Ticket'}
                </div>
                
                {validationResult.valid ? (
                  <div style={{ color: '#155724' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Ticket ID:</strong> {validationResult.ticketId}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Event:</strong> {validationResult.eventName}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Date:</strong> {validationResult.eventDate}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Ticket Holder:</strong> {validationResult.ticketHolder}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Purchase Date:</strong> {validationResult.purchaseDate}
                    </div>
                    <div>
                      <strong>Price:</strong> {validationResult.price} {validationResult.currency}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#721c24' }}>
                    <p>This ticket ID is not valid or has already been used.</p>
                    <p style={{ marginTop: '8px', fontSize: '0.9em' }}>
                      Please check the ticket ID and try again.
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={handleReset}>
                  Validate Another
                </button>
                <button className="btn-primary" onClick={onClose}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidateTicket;

