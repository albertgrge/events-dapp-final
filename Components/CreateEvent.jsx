import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useStateContext } from "../Context/index";
import Input from "./Input";

const CreateEvent = ({ onClose, onEventCreated }) => {
  const { CREATE_EVENT, loader } = useStateContext();

  const [event, setEvent] = useState({
    name: "",
    description: "",
    date: "",
    location: "",
    price: "",
    totalTickets: "",
    image: "",
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [localImage, setLocalImage] = useState();

  const onDrop = useCallback(async (acceptedFile) => {
    setImageUploading(true);
    const file = acceptedFile[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalImage(reader.result);
      setEvent({ ...event, image: reader.result });
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  }, [event]);

  const { getInputProps, getRootProps } = useDropzone({
    onDrop,
    maxSize: 500000000,
    accept: {
      'image/*': [],
    },
  });

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!event.name || !event.description || !event.date || !event.location || !event.price || !event.totalTickets || !event.image) {
      alert("Please fill all fields and upload an image");
      return;
    }

    if (parseFloat(event.price) <= 0) {
      alert("Ticket price must be greater than 0");
      return;
    }

    if (parseInt(event.totalTickets) <= 0) {
      alert("Total tickets must be greater than 0");
      return;
    }

    try {
      // Call CREATE_EVENT from Context
      const createdEvent = await CREATE_EVENT(event);

      if (createdEvent) {
        // Pass the created event to parent component
        onEventCreated(createdEvent);
        onClose();
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  }

  return (
    <div className="new-loader-wrapper" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <span className="logo-circle" style={{ fontWeight: 'bold', fontSize: 20 }}>
            Create Event
          </span>
          <button className="btn-close" onClick={onClose} type="button">&times;</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          {localImage ? (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <img style={{ width: "200px", height: "auto", borderRadius: '8px' }} src={localImage} alt="preview" />
              <button
                type="button"
                onClick={() => { setLocalImage(null); setEvent({ ...event, image: "" }); }}
                style={{ display: 'block', margin: '0.5rem auto', fontSize: '0.9rem', color: '#666', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}
              >
                Change Image
              </button>
            </div>
          ) : (
            <button className="upload-area" type="button" {...getRootProps()}>
              <span className="upload-area-title">
                Drag file(s) here or <strong>click here</strong> to upload event image
              </span>
              <input id="file" type="file" {...getInputProps()} />
            </button>
          )}

          <Input
            name={"Event Name"}
            placeholder="e.g., Tech Conference 2024"
            handleChange={(e) => setEvent({ ...event, name: e.target.value })}
          />

          <Input
            name={"Description"}
            placeholder="Brief description of the event"
            handleChange={(e) => setEvent({ ...event, description: e.target.value })}
          />

          <Input
            name={"Event Date"}
            type="date"
            handleChange={(e) => setEvent({ ...event, date: e.target.value })}
          />

          <Input
            name={"Location"}
            placeholder="e.g., San Francisco, CA"
            handleChange={(e) => setEvent({ ...event, location: e.target.value })}
          />

          <Input
            name={"Ticket Price (ETH)"}
            type="number"
            step="0.001"
            placeholder="e.g., 0.05"
            handleChange={(e) => setEvent({ ...event, price: e.target.value })}
          />

          <Input
            name={"Total Tickets"}
            type="number"
            placeholder="e.g., 100"
            handleChange={(e) => setEvent({ ...event, totalTickets: e.target.value })}
          />

          <div className="modal-footer">
            <button className="btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" type="submit" disabled={imageUploading || loader}>
              {loader ? "Creating..." : imageUploading ? "Uploading..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;

