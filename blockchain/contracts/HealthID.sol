// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NutriID - National Health ID (SBT)
 * @dev Soulbound Token (ERC-5484) acting as a National Health ID card in Cote d'Ivoire.
 * Tokens cannot be transferred after minting.
 */
contract HealthID is ERC721, Ownable {
    
    struct PatientInfo {
        string nip;         // Numero d'Identification Personnel (Encrypted hash)
        string bloodType;   // Groupe sanguin
        bool hasCMU;        // Couverture Maladie Universelle
        uint256 issuedAt;
    }

    mapping(uint256 => PatientInfo) private patientRecords;
    mapping(address => uint256) public walletToTokenId;
    
    uint256 private nextTokenId = 1;

    event IDMinted(address indexed patientWallet, uint256 indexed tokenId, string nip);

    constructor() ERC721("NutriID", "NID") Ownable(msg.sender) {}

    /**
     * @dev Mint a new Health ID for a citizen
     */
    function mintID(address citizen, string memory _nipHash, string memory _bloodType, bool _cmu) public onlyOwner {
        require(walletToTokenId[citizen] == 0, "Citizen already has a Health ID");
        
        uint256 tokenId = nextTokenId++;
        
        patientRecords[tokenId] = PatientInfo({
            nip: _nipHash,
            bloodType: _bloodType,
            hasCMU: _cmu,
            issuedAt: block.timestamp
        });
        
        walletToTokenId[citizen] = tokenId;
        
        _mint(citizen, tokenId);

        emit IDMinted(citizen, tokenId, _nipHash);
    }

    /**
     * @dev Fetch patient info. Accessible by the patient or authorized systems.
     */
    function getMyInfo() public view returns (string memory, string memory, bool, uint256) {
        uint256 tokenId = walletToTokenId[msg.sender];
        require(tokenId != 0, "No Health ID found for this wallet");
        
        PatientInfo memory info = patientRecords[tokenId];
        return (info.nip, info.bloodType, info.hasCMU, info.issuedAt);
    }

    /**
     * @dev Overriding transfer functions to make the token SOULBOUND (non-transferable)
     */
    function transferFrom(address from, address to, uint256 tokenId) public override {
        revert("HealthID: This is a Soulbound Token. It cannot be transferred.");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        revert("HealthID: This is a Soulbound Token. It cannot be transferred.");
    }
}
