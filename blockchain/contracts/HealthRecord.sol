// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title NutriID - Health Record Registry
 * @dev Stores IPFS CIDs of encrypted medical records along with their SHA-256 hashes.
 */
contract HealthRecord is Ownable {
    
    struct Record {
        string ipfsCID;        // Default IPFS CID (e.g. Qm...)
        string documentHash;   // SHA-256 hash of the encrypted document for integrity
        uint256 timestamp;     // Creation timestamp
        address doctor;        // Doctor/Hospital address that issued the record
        string recordType;     // "PRESCRIPTION", "VACCINE", "TEST_RESULT"
    }

    // Mapping from NFT token ID (from HealthID contract) to an array of Records
    mapping(uint256 => Record[]) private patientRecords;
    
    // Reference to the authorized HealthID contract (Soulbound Token)
    IERC721 public healthIDContract;

    // Authorized doctors mapping
    mapping(address => bool) public authorizedDoctors;

    event RecordAdded(uint256 indexed tokenId, address indexed doctor, string documentHash, string recordType);
    event DoctorAuthorized(address indexed doctor, bool status);

    modifier onlyAuthorizedDoctor() {
        require(authorizedDoctors[msg.sender], "Not an authorized doctor");
        _;
    }

    constructor(address _healthIDContract) Ownable(msg.sender) {
        healthIDContract = IERC721(_healthIDContract);
    }

    /**
     * @dev Authorize or deauthorize a healthcare provider
     */
    function setDoctorAuthorization(address doctor, bool status) external onlyOwner {
        authorizedDoctors[doctor] = status;
        emit DoctorAuthorized(doctor, status);
    }

    /**
     * @dev Add a new encrypted record for a patient (identified by their SBT token ID).
     * Only authorized doctors can add records, and the token MUST exist.
     */
    function addRecord(
        uint256 tokenId,
        string memory _ipfsCID,
        string memory _documentHash,
        string memory _recordType
    ) external onlyAuthorizedDoctor {
        
        // Ensure the Token ID is valid (minted by the HealthID contract)
        // If ownerOf reverts, it means the token doesn't exist
        address tokenOwner = healthIDContract.ownerOf(tokenId);
        require(tokenOwner != address(0), "Invalid HealthID Token");
        
        Record memory newRecord = Record({
            ipfsCID: _ipfsCID,
            documentHash: _documentHash,
            timestamp: block.timestamp,
            doctor: msg.sender,
            recordType: _recordType
        });
        
        patientRecords[tokenId].push(newRecord);

        emit RecordAdded(tokenId, msg.sender, _documentHash, _recordType);
    }

    /**
     * @dev Get total number of records for a patient
     */
    function getRecordCount(uint256 tokenId) external view returns (uint256) {
        return patientRecords[tokenId].length;
    }

    /**
     * @dev Get a specific record by index.
     */
    function getRecord(uint256 tokenId, uint256 index) external view returns (Record memory) {
        require(index < patientRecords[tokenId].length, "Index out of bounds");
        return patientRecords[tokenId][index];
    }
}
