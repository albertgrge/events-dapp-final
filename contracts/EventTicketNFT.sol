// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// ============================================================
// IMPORTS
// ============================================================
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ============================================================
// CONTRACT DECLARATION
// ============================================================

/// @title  EventTicketNFT
/// @notice Fully decentralized event ticketing. Anyone can stake ETH to become
///         an organizer — no admin or owner. Supports NFT minting, on-chain
///         validation, analytics, revenue withdrawal, and a controlled resale
///         marketplace (organizer-set price cap + royalty split).
/// @dev    Direct ERC721 transfers are blocked — all secondary sales MUST go
///         through listTicketForResale / buyResaleTicket to enforce royalties.
contract EventTicketNFT is ERC721URIStorage, ReentrancyGuard {

    // ============================================================
    // STATE VARIABLES
    // ============================================================

    /// @notice Auto-incrementing NFT token ID (starts at 1)
    uint256 private _nextTokenId;

    /// @notice Total events created; also serves as the last valid eventId
    uint256 public eventCounter;

    /// @notice Minimum ETH required to stake as organizer (immutable)
    uint256 public constant MIN_STAKE = 0.01 ether;

    // ============================================================
    // STRUCT DEFINITIONS
    // ============================================================

    /// @notice Organizer profile — self-managed via staking
    struct Organizer {
        string  name;
        string  contact;
        bool    active;
        uint256 stakedAmount;
    }

    /// @notice Core on-chain data for each event
    struct EventData {
        uint256 eventId;
        string  name;
        string  description;
        uint256 date;
        uint256 ticketPrice;          // primary sale price in wei
        uint256 maxSupply;
        uint256 ticketsMinted;
        address organizer;
        uint256 royaltyBps;           // resale royalty in basis points (max 5000 = 50%)
        uint256 maxResaleMultiplier;  // 0 = unlimited; 2 = max 2× ticketPrice
        string  metadataURI;          // IPFS URL for event metadata JSON
        uint256 maxPerWallet;         // max tickets per wallet (0 = unlimited)
    }

    /// @notice Gas-efficient analytics — counters only, no loops
    struct EventStats {
        uint256 totalMinted;
        uint256 totalValidated;
        uint256 totalRevenue;   // pending wei owed to organizer
        uint256 totalResales;
    }

    /// @notice An active secondary-market listing
    struct ResaleListing {
        uint256 price;
        address seller;
        bool    active;
    }

    // ============================================================
    // MAPPINGS
    // ============================================================

    mapping(address => Organizer)      public organizers;
    mapping(uint256 => EventData)      public events;
    mapping(uint256 => EventStats)     public eventStats;
    mapping(uint256 => bool)           public ticketUsed;
    mapping(uint256 => uint256)        public tokenToEvent;
    mapping(uint256 => ResaleListing)  public resaleListings;
    mapping(uint256 => mapping(address => uint256)) public ticketsPerUser;

    // ============================================================
    // EVENTS
    // ============================================================

    event OrganizerStaked    (address indexed organizer, string name, uint256 amount);
    event OrganizerUnstaked  (address indexed organizer, uint256 amount);
    event EventCreated       (uint256 indexed eventId, string name, address indexed organizer);
    event TicketMinted       (uint256 indexed eventId, uint256 indexed tokenId, address indexed buyer);
    event TicketValidated    (uint256 indexed eventId, uint256 indexed tokenId);
    event RevenueWithdrawn   (uint256 indexed eventId, uint256 amount);
    event TicketListed       (uint256 indexed eventId, uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled   (uint256 indexed eventId, uint256 indexed tokenId);
    event TicketResold       (uint256 indexed eventId, uint256 indexed tokenId, address indexed buyer, uint256 price);

    // ============================================================
    // MODIFIERS
    // ============================================================

    modifier onlyActiveOrganizer() {
        require(organizers[msg.sender].active, "Not an active organizer");
        _;
    }

    // ============================================================
    // CONSTRUCTOR  (no owner — fully decentralized)
    // ============================================================

    constructor() ERC721("EventTicketNFT", "ETNFT") {}

    // ============================================================
    // BLOCK DIRECT ERC721 TRANSFERS
    // ============================================================

    bool private _resaleInProgress;

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && !_resaleInProgress) {
            revert("Direct transfer disabled: use resale marketplace");
        }
        return super._update(to, tokenId, auth);
    }

    // ============================================================
    // STAKING — BECOME / LEAVE ORGANIZER  (fully permissionless)
    // ============================================================

    /// @notice Stake ETH to become an organizer. Anyone can call this.
    /// @param _name    Display name for the organizer
    /// @param _contact Contact info (email, Twitter, etc.)
    function stakeToBeOrganizer(
        string calldata _name,
        string calldata _contact
    ) external payable nonReentrant {
        require(msg.value >= MIN_STAKE,              "Stake must be >= MIN_STAKE");
        require(bytes(_name).length > 0,             "Name cannot be empty");
        require(!organizers[msg.sender].active,      "Already an active organizer");

        organizers[msg.sender] = Organizer({
            name:         _name,
            contact:      _contact,
            active:       true,
            stakedAmount: msg.value
        });

        emit OrganizerStaked(msg.sender, _name, msg.value);
    }

    /// @notice Unstake and return ETH. Loses organizer status.
    /// @dev    Must withdraw all event revenue before unstaking.
    function unstake() external nonReentrant {
        Organizer storage org = organizers[msg.sender];
        require(org.active,         "Not an active organizer");
        require(org.stakedAmount > 0, "No stake to withdraw");

        uint256 amount = org.stakedAmount;

        // Effects before interaction (CEI)
        org.active = false;
        org.stakedAmount = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Stake refund failed");

        emit OrganizerUnstaked(msg.sender, amount);
    }

    // ============================================================
    // EVENT CREATION  (active organizer only)
    // ============================================================

    function createEvent(
        string calldata _name,
        string calldata _description,
        uint256         _date,
        uint256         _ticketPrice,
        uint256         _maxSupply,
        uint256         _royaltyBps,
        uint256         _maxResaleMultiplier,
        string calldata _metadataURI,
        uint256         _maxPerWallet
    ) external onlyActiveOrganizer {
        require(bytes(_name).length > 0,  "Event name required");
        require(_date > block.timestamp,  "Date must be in the future");
        require(_ticketPrice > 0,         "Ticket price must be > 0");
        require(_maxSupply   > 0,         "Max supply must be > 0");
        require(_royaltyBps  <= 5000,     "Royalty cannot exceed 50%");

        uint256 newEventId = ++eventCounter;

        events[newEventId] = EventData({
            eventId:             newEventId,
            name:                _name,
            description:         _description,
            date:                _date,
            ticketPrice:         _ticketPrice,
            maxSupply:           _maxSupply,
            ticketsMinted:       0,
            organizer:           msg.sender,
            royaltyBps:          _royaltyBps,
            maxResaleMultiplier: _maxResaleMultiplier,
            metadataURI:         _metadataURI,
            maxPerWallet:        _maxPerWallet
        });

        emit EventCreated(newEventId, _name, msg.sender);
    }

    // ============================================================
    // PRIMARY MINTING  (public, payable)
    // ============================================================

    function mintTicket(uint256 eventId, string calldata tokenURI)
        external
        payable
        nonReentrant
    {
        EventData storage ev = events[eventId];

        require(ev.eventId != 0,                  "Event does not exist");
        require(ev.ticketsMinted < ev.maxSupply,  "Event is sold out");
        require(msg.value == ev.ticketPrice,      "Incorrect payment");

        if (ev.maxPerWallet > 0) {
            require(
                ticketsPerUser[eventId][msg.sender] < ev.maxPerWallet,
                "Exceeds per-wallet ticket limit"
            );
        }

        ev.ticketsMinted++;
        ticketsPerUser[eventId][msg.sender]++;

        uint256 newTokenId  = ++_nextTokenId;
        tokenToEvent[newTokenId] = eventId;

        EventStats storage stats = eventStats[eventId];
        stats.totalMinted++;
        stats.totalRevenue += msg.value;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        emit TicketMinted(eventId, newTokenId, msg.sender);
    }

    // ============================================================
    // TICKET VALIDATION  (event organizer only — no admin)
    // ============================================================

    function validateTicket(uint256 tokenId) external {
        ownerOf(tokenId);  // reverts if token does not exist

        require(!ticketUsed[tokenId], "Ticket already validated");

        uint256 eventId        = tokenToEvent[tokenId];
        address eventOrganizer = events[eventId].organizer;

        require(
            msg.sender == eventOrganizer,
            "Only event organizer can validate"
        );

        ticketUsed[tokenId] = true;
        eventStats[eventId].totalValidated++;

        if (resaleListings[tokenId].active) {
            resaleListings[tokenId].active = false;
            emit ListingCancelled(eventId, tokenId);
        }

        emit TicketValidated(eventId, tokenId);
    }

    // ============================================================
    // RESALE MARKETPLACE
    // ============================================================

    function listTicketForResale(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender,   "Not ticket owner");
        require(!ticketUsed[tokenId],             "Cannot resell validated ticket");
        require(price > 0,                        "Price must be > 0");

        uint256 eventId = tokenToEvent[tokenId];
        EventData storage ev = events[eventId];

        if (ev.maxResaleMultiplier > 0) {
            uint256 maxAllowed = ev.ticketPrice * ev.maxResaleMultiplier;
            require(price <= maxAllowed, "Exceeds organizer max resale price");
        }

        resaleListings[tokenId] = ResaleListing({
            price:  price,
            seller: msg.sender,
            active: true
        });

        emit TicketListed(eventId, tokenId, msg.sender, price);
    }

    /// @notice Cancel an active listing (seller only — no admin)
    function cancelResaleListing(uint256 tokenId) external {
        ResaleListing storage listing = resaleListings[tokenId];
        require(listing.active, "No active listing");
        require(listing.seller == msg.sender, "Only seller can cancel");

        listing.active = false;

        uint256 eventId = tokenToEvent[tokenId];
        emit ListingCancelled(eventId, tokenId);
    }

    function buyResaleTicket(uint256 tokenId) external payable nonReentrant {
        ResaleListing storage listing = resaleListings[tokenId];
        require(listing.active,             "Not listed for resale");
        require(msg.value == listing.price, "Incorrect payment");

        uint256 eventId = tokenToEvent[tokenId];
        EventData storage ev = events[eventId];

        address seller = listing.seller;
        uint256 price  = listing.price;

        listing.active = false;

        uint256 royalty        = (price * ev.royaltyBps) / 10_000;
        uint256 sellerProceeds = price - royalty;

        EventStats storage stats = eventStats[eventId];
        stats.totalResales++;
        stats.totalRevenue += royalty;

        _resaleInProgress = true;
        _transfer(seller, msg.sender, tokenId);
        _resaleInProgress = false;

        if (sellerProceeds > 0) {
            (bool ok, ) = payable(seller).call{value: sellerProceeds}("");
            require(ok, "Seller payment failed");
        }

        emit TicketResold(eventId, tokenId, msg.sender, price);
    }

    // ============================================================
    // REVENUE WITHDRAWAL  (organizer only)
    // ============================================================

    function withdrawRevenue(uint256 eventId) external nonReentrant {
        EventData  storage ev    = events[eventId];
        EventStats storage stats = eventStats[eventId];

        require(ev.eventId       != 0,      "Event does not exist");
        require(ev.organizer == msg.sender, "Not event organizer");

        uint256 amount = stats.totalRevenue;
        require(amount > 0, "Nothing to withdraw");

        stats.totalRevenue = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");

        emit RevenueWithdrawn(eventId, amount);
    }

    // ============================================================
    // VIEW / HELPER FUNCTIONS
    // ============================================================

    function getPendingRevenue(uint256 eventId) external view returns (uint256) {
        return eventStats[eventId].totalRevenue;
    }

    function getResaleListing(uint256 tokenId) external view returns (ResaleListing memory) {
        return resaleListings[tokenId];
    }

    function isActiveOrganizer(address _addr) external view returns (bool) {
        return organizers[_addr].active;
    }

    function getOrganizerStake(address _addr) external view returns (uint256) {
        return organizers[_addr].stakedAmount;
    }

    function totalTicketsMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function getEventMetadataURI(uint256 eventId) external view returns (string memory) {
        return events[eventId].metadataURI;
    }

    function getUserTicketCount(uint256 eventId, address user) external view returns (uint256) {
        return ticketsPerUser[eventId][user];
    }
}
