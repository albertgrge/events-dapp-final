import React, { useState, useCallback, useRef, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import DatePicker from "react-datepicker";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { useStateContext } from "../Context/index";
import Loader from "../Components/Loader";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
const libraries = ["places"];

const mapContainerStyle = {
    width: "100%",
    height: "280px",
    borderRadius: "12px",
};

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

export default function CreateEventPage() {
    const router = useRouter();
    const { CREATE_EVENT, userRole, isConnected, loader } = useStateContext();

    const [form, setForm] = useState({
        name: "",
        description: "",
        date: null,
        location: "",
        price: "",
        totalTickets: "",
        royaltyPercent: 10,
        maxResaleMultiplier: 2,
        maxPerWallet: 1,
        image: null,
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [markerPos, setMarkerPos] = useState(null);
    const [locationSearch, setLocationSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteService = useRef(null);
    const placesService = useRef(null);
    const searchRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    // Initialize services after Google Maps loads
    useEffect(() => {
        if (isLoaded && window.google) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            // We need a dummy div for PlacesService
            const dummyDiv = document.createElement("div");
            placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
        }
    }, [isLoaded]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setForm((prev) => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        maxFiles: 1,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Search for places
    const handleLocationSearch = (value) => {
        setLocationSearch(value);
        if (!value || value.length < 3 || !autocompleteService.current) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        autocompleteService.current.getPlacePredictions(
            { input: value, types: ["establishment", "geocode"] },
            (predictions, status) => {
                if (status === "OK" && predictions) {
                    setSuggestions(predictions);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                }
            }
        );
    };

    // Select a suggestion
    const selectPlace = (placeId, description) => {
        setLocationSearch(description);
        setShowSuggestions(false);
        setForm((prev) => ({ ...prev, location: description }));

        if (placesService.current) {
            placesService.current.getDetails(
                { placeId, fields: ["geometry", "formatted_address", "name"] },
                (place, status) => {
                    if (status === "OK" && place.geometry) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        setMapCenter({ lat, lng });
                        setMarkerPos({ lat, lng });
                        setForm((prev) => ({
                            ...prev,
                            location: place.formatted_address || description,
                        }));
                    }
                }
            );
        }
    };

    // Click on map
    const onMapClick = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        if (window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === "OK" && results[0]) {
                    const addr = results[0].formatted_address;
                    setLocationSearch(addr);
                    setForm((prev) => ({ ...prev, location: addr }));
                }
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConnected) return alert("Please connect your wallet");
        if (!userRole.isOrganizer) {
            return alert("Stake ETH to become an organizer first");
        }
        try {
            const result = await CREATE_EVENT(form);
            if (result) router.push("/events");
        } catch (error) {
            console.error("Create event error:", error);
        }
    };

    return (
        <>
            <Head>
                <title>Create Event — EventTicketNFT</title>
            </Head>

            {loader && <Loader />}

            <div className="page container">
                <div className="page-header">
                    <h1 className="page-title">Create New Event</h1>
                    <p className="page-subtitle">Fill in the details to launch your event on-chain</p>
                </div>

                {!userRole.isOrganizer ? (
                    <div className="card-glass text-center" style={{ padding: 60 }}>
                        <span style={{ fontSize: "3rem" }}>🚀</span>
                        <h2 style={{ marginBottom: 12, marginTop: 16 }}>Become an Organizer</h2>
                        <p className="text-muted" style={{ marginBottom: 24 }}>
                            Stake 0.01 ETH to become an event organizer. You can unstake at any time.
                        </p>
                        <p className="text-muted text-sm">
                            Use the "Become Organizer" button in the navigation bar to get started.
                        </p>
                    </div>
                ) : (
                    <div className="responsive-grid-2col-wide">
                        {/* Form */}
                        <div className="card-glass" style={{ padding: 32 }}>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Event Name *</label>
                                    <input type="text" name="name" className="form-input" placeholder="e.g. ETH Denver 2026" value={form.name} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea name="description" className="form-input" placeholder="Tell people about your event..." value={form.description} onChange={handleChange} rows={3} />
                                </div>

                                <div className="responsive-grid-2col">
                                    <div className="form-group">
                                        <label className="form-label">📅 Event Date & Time *</label>
                                        <div style={{ position: "relative" }}>
                                            <DatePicker
                                                selected={form.date}
                                                onChange={(date) => setForm((prev) => ({ ...prev, date }))}
                                                showTimeSelect
                                                timeFormat="HH:mm"
                                                timeIntervals={30}
                                                timeCaption="Time"
                                                dateFormat="MMMM d, yyyy h:mm aa"
                                                minDate={new Date()}
                                                placeholderText="📅 Pick date & time..."
                                                showMonthDropdown
                                                showYearDropdown
                                                dropdownMode="select"
                                                isClearable
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ticket Price (ETH) *</label>
                                        <input type="number" name="price" className="form-input" placeholder="0.05" step="0.001" min="0.001" value={form.price} onChange={handleChange} required />
                                    </div>
                                </div>

                                {/* Location with Google Maps */}
                                <div className="form-group">
                                    <label className="form-label">📍 Event Location</label>

                                    {isLoaded && GOOGLE_MAPS_API_KEY ? (
                                        <>
                                            {/* Search Box */}
                                            <div ref={searchRef} style={{ position: "relative" }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    background: "rgba(255,255,255,0.05)",
                                                    border: "1px solid rgba(124,58,237,0.3)",
                                                    borderRadius: 12,
                                                    padding: "0 16px",
                                                    transition: "all 0.3s",
                                                }}>
                                                    <span style={{ fontSize: "1.2rem", marginRight: 10 }}>🔍</span>
                                                    <input
                                                        type="text"
                                                        value={locationSearch}
                                                        onChange={(e) => handleLocationSearch(e.target.value)}
                                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                                        placeholder="Search venue, city, or address..."
                                                        style={{
                                                            flex: 1,
                                                            background: "transparent",
                                                            border: "none",
                                                            outline: "none",
                                                            color: "#fff",
                                                            padding: "14px 0",
                                                            fontSize: "0.95rem",
                                                        }}
                                                    />
                                                    {locationSearch && (
                                                        <button
                                                            type="button"
                                                            onClick={() => { setLocationSearch(""); setSuggestions([]); setMarkerPos(null); setForm(p => ({ ...p, location: "" })); }}
                                                            style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1.1rem", padding: 4 }}
                                                        >✕</button>
                                                    )}
                                                </div>

                                                {/* Suggestions Dropdown */}
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <div style={{
                                                        position: "absolute",
                                                        top: "100%",
                                                        left: 0,
                                                        right: 0,
                                                        zIndex: 1000,
                                                        background: "rgba(15, 15, 25, 0.98)",
                                                        border: "1px solid rgba(124,58,237,0.3)",
                                                        borderRadius: 12,
                                                        marginTop: 4,
                                                        overflow: "hidden",
                                                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                                                        backdropFilter: "blur(20px)",
                                                    }}>
                                                        {suggestions.map((s) => (
                                                            <div
                                                                key={s.place_id}
                                                                onClick={() => selectPlace(s.place_id, s.description)}
                                                                style={{
                                                                    padding: "12px 16px",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 10,
                                                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                                                    transition: "background 0.2s",
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,58,237,0.15)"}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                            >
                                                                <span style={{ fontSize: "1.1rem", opacity: 0.6 }}>📍</span>
                                                                <div>
                                                                    <div style={{ fontSize: "0.9rem", color: "#fff" }}>
                                                                        {s.structured_formatting?.main_text || s.description}
                                                                    </div>
                                                                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>
                                                                        {s.structured_formatting?.secondary_text || ""}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div style={{ padding: "6px 16px", textAlign: "right" }}>
                                                            <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>Powered by Google</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selected Location Badge */}
                                            {form.location && (
                                                <div style={{
                                                    marginTop: 8,
                                                    padding: "8px 14px",
                                                    background: "rgba(124,58,237,0.1)",
                                                    border: "1px solid rgba(124,58,237,0.2)",
                                                    borderRadius: 8,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}>
                                                    <span style={{ color: "#10b981" }}>✅</span>
                                                    <span style={{ fontSize: "0.85rem", color: "#d1d5db" }}>{form.location}</span>
                                                </div>
                                            )}

                                            {/* Interactive Map */}
                                            <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(124,58,237,0.15)" }}>
                                                <GoogleMap
                                                    mapContainerStyle={mapContainerStyle}
                                                    center={mapCenter}
                                                    zoom={markerPos ? 15 : 10}
                                                    onClick={onMapClick}
                                                    options={{
                                                        styles: [
                                                            { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
                                                            { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
                                                            { elementType: "labels.text.fill", stylers: [{ color: "#8a8aaa" }] },
                                                            { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4e" }] },
                                                            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6a6a8a" }] },
                                                            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
                                                            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e1e3a" }] },
                                                            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6a6a8a" }] },
                                                        ],
                                                        disableDefaultUI: true,
                                                        zoomControl: true,
                                                        streetViewControl: false,
                                                    }}
                                                >
                                                    {markerPos && <MarkerF position={markerPos} />}
                                                </GoogleMap>
                                            </div>
                                            <p className="form-hint" style={{ marginTop: 8 }}>
                                                🔍 Search above or 👆 click on the map to set location
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <input type="text" name="location" className="form-input" placeholder="e.g. Denver Convention Center, CO" value={form.location} onChange={handleChange} />
                                            {!GOOGLE_MAPS_API_KEY && (
                                                <p className="form-hint" style={{ color: "rgba(245,158,11,0.8)" }}>
                                                    💡 Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env.local for interactive map
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Event Image</label>
                                    <div {...getRootProps()} className="upload-zone">
                                        <input {...getInputProps()} />
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" style={{ maxHeight: 150, margin: "0 auto", borderRadius: 8 }} />
                                        ) : isDragActive ? (
                                            <p>Drop the image here...</p>
                                        ) : (
                                            <p>📸 Drag & drop an image, or click to select</p>
                                        )}
                                    </div>
                                </div>

                                <div className="responsive-grid-2col">
                                    <div className="form-group">
                                        <label className="form-label">Max Ticket Supply *</label>
                                        <input type="number" name="totalTickets" className="form-input" placeholder="100" min="1" value={form.totalTickets} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Resale Royalty (%)</label>
                                        <input type="number" name="royaltyPercent" className="form-input" placeholder="10" min="0" max="50" value={form.royaltyPercent} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Max Resale Multiplier</label>
                                    <select name="maxResaleMultiplier" className="form-input" value={form.maxResaleMultiplier} onChange={handleChange}>
                                        <option value="0">No Limit</option>
                                        <option value="1">1x (no markup)</option>
                                        <option value="2">2x</option>
                                        <option value="3">3x</option>
                                        <option value="5">5x</option>
                                    </select>
                                    <p className="form-hint">Maximum resale price = ticket price × multiplier</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Max Tickets Per Wallet</label>
                                    <select name="maxPerWallet" className="form-input" value={form.maxPerWallet} onChange={handleChange}>
                                        <option value="0">Unlimited</option>
                                        <option value="1">1 ticket</option>
                                        <option value="2">2 tickets</option>
                                        <option value="3">3 tickets</option>
                                        <option value="5">5 tickets</option>
                                        <option value="10">10 tickets</option>
                                    </select>
                                    <p className="form-hint">Limit per wallet to prevent scalping (0 = unlimited)</p>
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg btn-block mt-4">
                                    🚀 Create Event
                                </button>
                                <p className="text-muted text-sm text-center mt-4">Cost: Gas fees only. No platform fee.</p>
                            </form>
                        </div>

                        {/* Preview */}
                        <div>
                            <h3 style={{ marginBottom: 16, color: "var(--text-secondary)" }}>Event Preview</h3>
                            <div className="card event-card" style={{ pointerEvents: "none" }}>
                                <div className="event-card-image" style={{ background: imagePreview ? `url(${imagePreview}) center/cover` : "var(--accent-gradient)" }}></div>
                                <div className="event-card-body">
                                    <h3 className="event-card-title">{form.name || "Your Event Name"}</h3>
                                    <div className="event-card-meta">
                                        <span>📅 {form.date ? new Date(form.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBA"}</span>
                                        <span>📍 {form.location || "TBA"}</span>
                                    </div>
                                    <div className="event-card-price">{form.price || "0.00"} ETH</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span className="text-sm text-muted">Tickets</span>
                                        <span className="text-sm">0/{form.totalTickets || "—"}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: "0%" }}></div>
                                    </div>
                                    <div className="event-card-footer" style={{ marginTop: 16 }}>
                                        <span className="badge badge-purple">{form.royaltyPercent}% royalty</span>
                                        <span className="badge badge-purple">{form.maxResaleMultiplier > 0 ? `Max ${form.maxResaleMultiplier}x` : "No cap"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Map Location Card */}
                            {markerPos && (
                                <div className="card-glass" style={{ padding: 16, marginTop: 16 }}>
                                    <h4 style={{ marginBottom: 8, fontSize: "0.9rem" }}>📍 Venue Location</h4>
                                    <p className="text-sm text-muted">{form.location}</p>
                                    <p style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>
                                        {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
