// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool, inEuint32, inEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title UserDecrypt
 * @notice Demonstrates user decryption patterns for FHEVM
 * @dev Shows how to properly set permissions for client-side decryption
 *
 * Learning objectives:
 * - Understand permission management for decryption
 * - Learn how users decrypt their own encrypted data
 * - See proper patterns for encrypted data access
 * - Understand FHE.allow() for granting decryption rights
 */
contract UserDecrypt is SepoliaConfig {
    // User encrypted balances
    mapping(address => euint64) public userBalances;

    // User encrypted scores
    mapping(address => euint32) public userScores;

    // User encrypted status
    mapping(address => ebool) public userStatus;

    // Shared encrypted data with specific permissions
    mapping(bytes32 => euint32) public sharedData;
    mapping(bytes32 => address[]) public dataViewers;

    // Events
    event DataStored(address indexed user, string dataType);
    event PermissionGranted(address indexed owner, address indexed viewer, bytes32 dataId);
    event PermissionRevoked(address indexed owner, address indexed viewer, bytes32 dataId);

    /**
     * @notice Store encrypted balance for user
     * @param encryptedBalance Encrypted balance value
     * @param inputProof Input proof for encrypted value
     * @dev User can decrypt this value client-side after storage
     */
    function storeBalance(
        inEuint64 calldata encryptedBalance,
        bytes calldata inputProof
    ) external {
        euint64 balance = FHE.asEuint64(encryptedBalance, inputProof);

        userBalances[msg.sender] = balance;

        // CRITICAL: Grant permission to contract for internal operations
        FHE.allowThis(balance);

        // CRITICAL: Grant permission to user for client-side decryption
        FHE.allow(balance, msg.sender);

        emit DataStored(msg.sender, "balance");
    }

    /**
     * @notice Store encrypted score for user
     * @param encryptedScore Encrypted score value
     * @param inputProof Input proof
     */
    function storeScore(
        inEuint32 calldata encryptedScore,
        bytes calldata inputProof
    ) external {
        euint32 score = FHE.asEuint32(encryptedScore, inputProof);

        userScores[msg.sender] = score;

        FHE.allowThis(score);
        FHE.allow(score, msg.sender);

        emit DataStored(msg.sender, "score");
    }

    /**
     * @notice Add to user's balance
     * @param encryptedAmount Amount to add
     * @param inputProof Input proof
     * @dev Demonstrates permission update after operation
     */
    function addToBalance(
        inEuint64 calldata encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

        // Perform encrypted addition
        userBalances[msg.sender] = FHE.add(userBalances[msg.sender], amount);

        // IMPORTANT: Must update permissions after operation
        // New encrypted value needs new permissions
        FHE.allowThis(userBalances[msg.sender]);
        FHE.allow(userBalances[msg.sender], msg.sender);
    }

    /**
     * @notice Update user status based on score threshold
     * @param encryptedThreshold Score threshold
     * @param inputProof Input proof
     * @dev Result is encrypted boolean user can decrypt
     */
    function updateStatus(
        inEuint32 calldata encryptedThreshold,
        bytes calldata inputProof
    ) external {
        euint32 threshold = FHE.asEuint32(encryptedThreshold, inputProof);

        // Compare score to threshold (result is encrypted boolean)
        ebool isPassing = FHE.gte(userScores[msg.sender], threshold);

        userStatus[msg.sender] = isPassing;

        // Grant permissions for the boolean result
        FHE.allowThis(isPassing);
        FHE.allow(isPassing, msg.sender);

        emit DataStored(msg.sender, "status");
    }

    /**
     * @notice Share encrypted data with specific viewer
     * @param dataId Unique identifier for the data
     * @param encryptedValue Encrypted value to share
     * @param viewer Address that can decrypt the data
     * @param inputProof Input proof
     */
    function shareData(
        bytes32 dataId,
        inEuint32 calldata encryptedValue,
        address viewer,
        bytes calldata inputProof
    ) external {
        require(viewer != address(0), "Invalid viewer");

        euint32 value = FHE.asEuint32(encryptedValue, inputProof);

        sharedData[dataId] = value;
        dataViewers[dataId].push(viewer);

        // Grant permissions
        FHE.allowThis(value);
        FHE.allow(value, msg.sender); // Owner can decrypt
        FHE.allow(value, viewer);      // Viewer can decrypt

        emit PermissionGranted(msg.sender, viewer, dataId);
    }

    /**
     * @notice Grant additional viewer permission for shared data
     * @param dataId Data identifier
     * @param newViewer New viewer address
     * @dev Only data owner (first to share) can grant additional permissions
     */
    function grantViewPermission(bytes32 dataId, address newViewer) external {
        require(newViewer != address(0), "Invalid viewer");

        euint32 value = sharedData[dataId];

        // Grant decryption permission to new viewer
        FHE.allow(value, newViewer);

        dataViewers[dataId].push(newViewer);

        emit PermissionGranted(msg.sender, newViewer, dataId);
    }

    /**
     * @notice Get user's encrypted balance
     * @return Encrypted balance value
     * @dev User can decrypt this client-side using fhevmjs
     */
    function getBalance() external view returns (euint64) {
        return userBalances[msg.sender];
    }

    /**
     * @notice Get user's encrypted score
     * @return Encrypted score value
     */
    function getScore() external view returns (euint32) {
        return userScores[msg.sender];
    }

    /**
     * @notice Get user's encrypted status
     * @return Encrypted boolean status
     */
    function getStatus() external view returns (ebool) {
        return userStatus[msg.sender];
    }

    /**
     * @notice Get shared encrypted data
     * @param dataId Data identifier
     * @return Encrypted value
     * @dev Only viewers with permission can decrypt this
     */
    function getSharedData(bytes32 dataId) external view returns (euint32) {
        return sharedData[dataId];
    }

    /**
     * @notice Get all viewers for a data item
     * @param dataId Data identifier
     * @return Array of viewer addresses
     */
    function getViewers(bytes32 dataId) external view returns (address[] memory) {
        return dataViewers[dataId];
    }

    /**
     * @notice Demonstrate multiple data types with proper permissions
     * @param encBalance Encrypted balance
     * @param encScore Encrypted score
     * @param balanceProof Balance proof
     * @param scoreProof Score proof
     */
    function storeMultiple(
        inEuint64 calldata encBalance,
        inEuint32 calldata encScore,
        bytes calldata balanceProof,
        bytes calldata scoreProof
    ) external {
        // Store balance
        euint64 balance = FHE.asEuint64(encBalance, balanceProof);
        userBalances[msg.sender] = balance;
        FHE.allowThis(balance);
        FHE.allow(balance, msg.sender);

        // Store score
        euint32 score = FHE.asEuint32(encScore, scoreProof);
        userScores[msg.sender] = score;
        FHE.allowThis(score);
        FHE.allow(score, msg.sender);

        emit DataStored(msg.sender, "multiple");
    }

    /**
     * @notice Transfer balance to another user
     * @param to Recipient address
     * @param encryptedAmount Amount to transfer
     * @param inputProof Input proof
     * @dev Both sender and recipient can decrypt their new balances
     */
    function transferBalance(
        address to,
        inEuint64 calldata encryptedAmount,
        bytes calldata inputProof
    ) external {
        require(to != address(0), "Invalid recipient");

        euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

        // Update balances
        euint64 newSenderBalance = FHE.sub(userBalances[msg.sender], amount);
        euint64 newRecipientBalance = FHE.add(userBalances[to], amount);

        userBalances[msg.sender] = newSenderBalance;
        userBalances[to] = newRecipientBalance;

        // Update permissions for both parties
        FHE.allowThis(userBalances[msg.sender]);
        FHE.allow(userBalances[msg.sender], msg.sender);

        FHE.allowThis(userBalances[to]);
        FHE.allow(userBalances[to], to);
    }

    /**
     * @notice Check if score is above threshold and return result
     * @param encryptedThreshold Threshold value
     * @param inputProof Input proof
     * @return Encrypted boolean result that user can decrypt
     */
    function checkScore(
        inEuint32 calldata encryptedThreshold,
        bytes calldata inputProof
    ) external view returns (ebool) {
        euint32 threshold = FHE.asEuint32(encryptedThreshold, inputProof);

        // Return encrypted comparison result
        // User can decrypt this to see if their score is above threshold
        return FHE.gte(userScores[msg.sender], threshold);
    }

    /**
     * @notice Demonstrate conditional selection based on encrypted comparison
     * @param encThreshold Threshold for comparison
     * @param encHighValue Value if above threshold
     * @param encLowValue Value if below threshold
     * @param thresholdProof Threshold proof
     * @param highProof High value proof
     * @param lowProof Low value proof
     * @return Selected value based on user's score
     */
    function conditionalReward(
        inEuint32 calldata encThreshold,
        inEuint64 calldata encHighValue,
        inEuint64 calldata encLowValue,
        bytes calldata thresholdProof,
        bytes calldata highProof,
        bytes calldata lowProof
    ) external view returns (euint64) {
        euint32 threshold = FHE.asEuint32(encThreshold, thresholdProof);
        euint64 highValue = FHE.asEuint64(encHighValue, highProof);
        euint64 lowValue = FHE.asEuint64(encLowValue, lowProof);

        // Check if user's score is above threshold
        ebool isHigh = FHE.gte(userScores[msg.sender], threshold);

        // Select value based on comparison (all encrypted)
        // User can decrypt the result to see their reward
        return FHE.select(isHigh, highValue, lowValue);
    }
}
