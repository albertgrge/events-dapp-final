// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTsAirDrop is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    address payable public admin;
    uint public mintFee = 0.00025 ether;

    Counters.Counter private _tokenIds;
    Counters.Counter private _eventIds;

    struct NFTData {
        uint256 tokenId;
        address creator;
        string tokenURI;
        uint256 eventId; // Link ticket to event
    }

    struct Event {
        uint256 eventId;
        address organizer;
        uint256 ticketPrice; // Price in ether set by organizer
        string eventName;
        uint256 totalTickets;
        uint256 ticketsSold;
        bool isActive;
    }

     struct Notification {
        uint id;
        address userAddress;
        string message;
        uint timestamp;
        uint nftID;
    }

    NFTData[] private allNFTs;
    Notification[] private allNotifications;
    Event[] private allEvents;

    mapping(address => NFTData[]) private userCreatedNFTs;
    mapping(address => NFTData[]) private userOwnedNFTs;
    mapping(uint256 => Event) public events; // eventId => Event
    mapping(uint256 => uint256) public ticketsSoldPerEvent; // eventId => tickets sold
    mapping(address => uint256[]) private organizerEvents; // organizer => eventIds

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() ERC721("@theblockchaincoders", "@TBC") Ownable(msg.sender) {
        admin = payable(msg.sender);
    }

    // Create an event with organizer-set ticket price
    function createEvent(
        uint256 _ticketPrice,
        string memory _eventName,
        uint256 _totalTickets
    ) external returns (uint256) {
        require(_ticketPrice > 0, "Ticket price must be greater than 0");
        require(_totalTickets > 0, "Total tickets must be greater than 0");
        
        _eventIds.increment();
        uint256 eventId = _eventIds.current();

        Event memory newEvent = Event({
            eventId: eventId,
            organizer: msg.sender,
            ticketPrice: _ticketPrice,
            eventName: _eventName,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            isActive: true
        });

        events[eventId] = newEvent;
        allEvents.push(newEvent);
        organizerEvents[msg.sender].push(eventId);

        return eventId;
    }

    // Mint a ticket for a specific event (uses event's ticket price)
    function mintTicket(
        uint256 _eventId,
        string memory tokenURI,
        string memory _name
    ) payable external returns (uint256) {
        require(events[_eventId].isActive, "Event is not active");
        require(events[_eventId].ticketsSold < events[_eventId].totalTickets, "Event is sold out");
        require(msg.value == events[_eventId].ticketPrice, "Incorrect ticket price");
        
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        NFTData memory newNFT = NFTData({
            tokenId: tokenId,
            creator: msg.sender,
            tokenURI: tokenURI,
            eventId: _eventId
        });

        allNFTs.push(newNFT);
        userCreatedNFTs[msg.sender].push(newNFT);
        userOwnedNFTs[msg.sender].push(newNFT);

        // Update event ticket sales
        events[_eventId].ticketsSold++;
        ticketsSoldPerEvent[_eventId]++;

        // Transfer payment to event organizer
        (bool success, ) = payable(events[_eventId].organizer).call{value: msg.value}("");
        require(success, "Payment to organizer failed");

        ADD_NOTIFICATION(msg.sender, _name, tokenId);

        return tokenId;
    }

    // Original mint function (kept for backward compatibility)
    function mint(string memory tokenURI, string memory _name) payable external
        returns (uint256)
    {
        require(msg.value == mintFee, "Incorrect registration fee");
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        NFTData memory newNFT = NFTData({
            tokenId: tokenId,
            creator: msg.sender,
            tokenURI: tokenURI,
            eventId: 0 // No event for legacy mints
        });

        allNFTs.push(newNFT);
        userCreatedNFTs[msg.sender].push(newNFT);
        userOwnedNFTs[msg.sender].push(newNFT);

        (bool success, ) = payable(admin).call{value: msg.value}("");
        require(success, "Payment to admin failed");

        ADD_NOTIFICATION(msg.sender, _name, tokenId);

        return tokenId;

    }

    function fetchUserOwnedNFTs(address user) external view returns (NFTData[] memory) {
        return userOwnedNFTs[user];
    }

    function fetchUserCreatedNFTs(address user) external view returns (NFTData[] memory) {
        return userCreatedNFTs[user];
    }

    function updateMintFee(uint _newFee) public onlyAdmin {
        mintFee = _newFee;
    }

     //NOTIFICATIOn
    function ADD_NOTIFICATION(address _userAddress, string memory _message, uint256 _nftID) internal {
        Notification memory newNotification = Notification({
            id: allNotifications.length,
            userAddress: _userAddress,
            message: _message,
            timestamp: block.timestamp,
            nftID: _nftID
        });

        allNotifications.push(newNotification);
        
    }

    function GET_NOTIFICATIONS() external view returns (Notification[] memory) {
        return allNotifications;
    }

    // Get event details by eventId
    function getEvent(uint256 _eventId) external view returns (Event memory) {
        return events[_eventId];
    }

    // Get all events
    function getAllEvents() external view returns (Event[] memory) {
        return allEvents;
    }

    // Get events created by a specific organizer
    function getOrganizerEvents(address _organizer) external view returns (uint256[] memory) {
        return organizerEvents[_organizer];
    }

    // Get event details for an organizer
    function getOrganizerEventDetails(address _organizer) external view returns (Event[] memory) {
        uint256[] memory eventIds = organizerEvents[_organizer];
        Event[] memory organizerEventList = new Event[](eventIds.length);
        
        for (uint256 i = 0; i < eventIds.length; i++) {
            organizerEventList[i] = events[eventIds[i]];
        }
        
        return organizerEventList;
    }

    // Update event status (only organizer can update their own event)
    function updateEventStatus(uint256 _eventId, bool _isActive) external {
        require(events[_eventId].organizer == msg.sender, "Only organizer can update event");
        events[_eventId].isActive = _isActive;
        
        // Update in allEvents array
        for (uint256 i = 0; i < allEvents.length; i++) {
            if (allEvents[i].eventId == _eventId) {
                allEvents[i].isActive = _isActive;
                break;
            }
        }
    }

    // Update ticket price (only organizer can update their own event)
    function updateTicketPrice(uint256 _eventId, uint256 _newPrice) external {
        require(events[_eventId].organizer == msg.sender, "Only organizer can update price");
        require(_newPrice > 0, "Ticket price must be greater than 0");
        require(events[_eventId].ticketsSold == 0, "Cannot change price after tickets are sold");
        
        events[_eventId].ticketPrice = _newPrice;
        
        // Update in allEvents array
        for (uint256 i = 0; i < allEvents.length; i++) {
            if (allEvents[i].eventId == _eventId) {
                allEvents[i].ticketPrice = _newPrice;
                break;
            }
        }
    }
    
}