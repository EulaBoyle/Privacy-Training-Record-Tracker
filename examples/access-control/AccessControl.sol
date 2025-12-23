// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AccessControl
 * @notice Implements comprehensive access control for encrypted data
 * @dev Demonstrates role-based permissions with encrypted values
 */
contract AccessControl is SepoliaConfig {
    // Role definitions
    enum Role {
        ADMIN,
        MANAGER,
        USER
    }

    // Data structure with encrypted sensitive info
    struct EncryptedRecord {
        address owner;
        ebool encryptedStatus;
        euint32 encryptedScore;
        uint256 createdAt;
        Role ownerRole;
        bool isActive;
    }

    // Storage
    mapping(uint256 => EncryptedRecord) public records;
    mapping(address => Role) public userRoles;
    mapping(address => uint256[]) public userRecords;
    uint256 public recordCount;
    address public admin;

    // Events
    event RecordCreated(
        uint256 indexed recordId,
        address indexed owner,
        Role indexed role
    );
    event AccessGranted(
        uint256 indexed recordId,
        address indexed user,
        string dataType
    );
    event RoleAssigned(address indexed user, Role indexed role);

    // Modifiers
    modifier onlyAdmin() {
        require(userRoles[msg.sender] == Role.ADMIN, "Only admin");
        _;
    }

    modifier onlyAdminOrOwner(uint256 recordId) {
        EncryptedRecord storage record = records[recordId];
        require(
            userRoles[msg.sender] == Role.ADMIN ||
                msg.sender == record.owner,
            "Not authorized"
        );
        _;
    }

    modifier recordExists(uint256 recordId) {
        require(records[recordId].isActive, "Record does not exist");
        _;
    }

    /**
     * @notice Constructor - sets up admin role
     */
    constructor() {
        admin = msg.sender;
        userRoles[msg.sender] = Role.ADMIN;
    }

    /**
     * @notice Assign a role to a user
     * @param user User address
     * @param role Role to assign
     */
    function assignRole(address user, Role role) external onlyAdmin {
        userRoles[user] = role;
        emit RoleAssigned(user, role);
    }

    /**
     * @notice Create an encrypted record
     * @param status Boolean status (will be encrypted)
     * @param score Score value (will be encrypted)
     * @return recordId The ID of created record
     */
    function createRecord(
        bool status,
        uint32 score
    ) external returns (uint256) {
        uint256 recordId = recordCount++;
        EncryptedRecord storage record = records[recordId];

        record.owner = msg.sender;
        record.encryptedStatus = FHE.asEbool(status);
        record.encryptedScore = FHE.asEuint32(score);
        record.createdAt = block.timestamp;
        record.ownerRole = userRoles[msg.sender];
        record.isActive = true;

        // Set base permissions
        FHE.allowThis(record.encryptedStatus);
        FHE.allowThis(record.encryptedScore);
        FHE.allow(record.encryptedStatus, msg.sender);
        FHE.allow(record.encryptedScore, msg.sender);

        // Admin always gets access
        FHE.allow(record.encryptedStatus, admin);
        FHE.allow(record.encryptedScore, admin);

        userRecords[msg.sender].push(recordId);

        emit RecordCreated(recordId, msg.sender, userRoles[msg.sender]);
        return recordId;
    }

    /**
     * @notice Grant access to encrypted status
     * @param recordId Record ID
     * @param user User to grant access to
     */
    function grantStatusAccess(
        uint256 recordId,
        address user
    ) external onlyAdminOrOwner(recordId) recordExists(recordId) {
        EncryptedRecord storage record = records[recordId];
        FHE.allow(record.encryptedStatus, user);
        emit AccessGranted(recordId, user, "status");
    }

    /**
     * @notice Grant access to encrypted score
     * @param recordId Record ID
     * @param user User to grant access to
     */
    function grantScoreAccess(
        uint256 recordId,
        address user
    ) external onlyAdminOrOwner(recordId) recordExists(recordId) {
        EncryptedRecord storage record = records[recordId];
        FHE.allow(record.encryptedScore, user);
        emit AccessGranted(recordId, user, "score");
    }

    /**
     * @notice Get encrypted status
     * @param recordId Record ID
     * @return Encrypted status
     */
    function getEncryptedStatus(
        uint256 recordId
    ) external view recordExists(recordId) returns (ebool) {
        EncryptedRecord storage record = records[recordId];
        require(
            msg.sender == record.owner ||
                msg.sender == admin ||
                userRoles[msg.sender] == Role.MANAGER,
            "Cannot access status"
        );
        return record.encryptedStatus;
    }

    /**
     * @notice Get encrypted score
     * @param recordId Record ID
     * @return Encrypted score
     */
    function getEncryptedScore(
        uint256 recordId
    ) external view recordExists(recordId) returns (euint32) {
        EncryptedRecord storage record = records[recordId];
        require(
            msg.sender == record.owner ||
                msg.sender == admin ||
                userRoles[msg.sender] == Role.MANAGER,
            "Cannot access score"
        );
        return record.encryptedScore;
    }

    /**
     * @notice Get user's role
     * @param user User address
     * @return User's role
     */
    function getUserRole(address user) external view returns (Role) {
        return userRoles[user];
    }

    /**
     * @notice Get user's records
     * @param user User address
     * @return Array of record IDs
     */
    function getUserRecords(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userRecords[user];
    }

    /**
     * @notice Deactivate a record
     * @param recordId Record ID
     */
    function deactivateRecord(uint256 recordId)
        external
        onlyAdminOrOwner(recordId)
    {
        records[recordId].isActive = false;
    }
}
