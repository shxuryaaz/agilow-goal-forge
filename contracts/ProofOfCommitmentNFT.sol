// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title ProofOfCommitmentNFT
 * @dev A soulbound NFT contract for Agilow goal commitments
 * @notice This NFT cannot be transferred (soulbound) and represents commitment to personal goals
 */
contract ProofOfCommitmentNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Mapping to track if an address has already minted for a specific goal
    mapping(string => mapping(address => bool)) public goalMinted;
    
    // Mapping to store goal metadata
    mapping(uint256 => string) public goalIds;
    
    // Events
    event GoalCommitted(address indexed to, uint256 indexed tokenId, string goalId);
    
    constructor() ERC721("Proof of Commitment", "POC") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new Proof-of-Commitment NFT
     * @param to The address to mint the NFT to
     * @param goalId The unique identifier for the goal
     * @param tokenURI The metadata URI for the NFT
     */
    function mint(address to, string memory goalId, string memory tokenURI) public onlyOwner {
        // Ensure the recipient hasn't already minted for this goal
        require(!goalMinted[goalId][to], "Already minted for this goal");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Mark this goal as minted for this address
        goalMinted[goalId][to] = true;
        goalIds[tokenId] = goalId;
        
        emit GoalCommitted(to, tokenId, goalId);
    }
    
    /**
     * @dev Override transfer functions to make NFT soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow minting (from == address(0))
        if (from == address(0)) {
            super._beforeTokenTransfer(from, to, tokenId, batchSize);
        } else {
            // Revert all other transfers (soulbound)
            revert("Soulbound NFT: Cannot be transferred");
        }
    }
    
    /**
     * @dev Override transfer functions to prevent transfers
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound NFT: Cannot be transferred");
    }
    
    function safeTransferFrom(address, address, uint256) public pure override {
        revert("Soulbound NFT: Cannot be transferred");
    }
    
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound NFT: Cannot be transferred");
    }
    
    /**
     * @dev Get the total number of minted tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Get the goal ID for a specific token
     */
    function getGoalId(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return goalIds[tokenId];
    }
    
    /**
     * @dev Check if an address has minted for a specific goal
     */
    function hasMintedForGoal(string memory goalId, address user) public view returns (bool) {
        return goalMinted[goalId][user];
    }
    
    // Required overrides for ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

