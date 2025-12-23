// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptDecrypt
 * @notice Demonstrates encryption and decryption patterns with FHEVM
 * @dev Shows how to work with encrypted values and proper permission management
 */
contract EncryptDecrypt is SepoliaConfig {
    // Storage for encrypted values
    mapping(address => euint32) private userEncryptedValues;
    mapping(address => bool) private hasValue;

    // Events for important actions
    event ValueEncrypted(address indexed user);
    event ValueRetrieved(address indexed user);

    /**
     * @notice Store an encrypted value for the caller
     * @param inputHandle Encrypted input handle from client
     * @param inputProof Input proof for encryption verification
     * @dev The value is encrypted using FHE and stored with proper permissions
     */
    function encryptAndStore(
        inEuint32 calldata inputHandle,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted input to internal format
        euint32 encryptedValue = FHE.asEuint32(inputHandle, inputProof);

        // Store the encrypted value
        userEncryptedValues[msg.sender] = encryptedValue;
        hasValue[msg.sender] = true;

        // Set permissions - contract can use, user can decrypt
        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);

        emit ValueEncrypted(msg.sender);
    }

    /**
     * @notice Retrieve encrypted value for authorized user
     * @return The encrypted value for the caller
     * @dev Only returns if user has stored a value
     */
    function getEncryptedValue() external view returns (euint32) {
        require(hasValue[msg.sender], "No value stored for user");
        return userEncryptedValues[msg.sender];
    }

    /**
     * @notice Check if user has stored value
     * @param user Address to check
     * @return True if user has stored value
     */
    function hasStoredValue(address user) external view returns (bool) {
        return hasValue[user];
    }

    /**
     * @notice Perform arithmetic on stored encrypted value
     * @param inputHandle The value to add (encrypted)
     * @param inputProof Proof for the input
     * @dev Updates stored value by adding encrypted input
     */
    function addToStoredValue(
        inEuint32 calldata inputHandle,
        bytes calldata inputProof
    ) external {
        require(hasValue[msg.sender], "No value stored for user");

        // Convert and verify input
        euint32 valueToAdd = FHE.asEuint32(inputHandle, inputProof);

        // Perform encrypted addition
        userEncryptedValues[msg.sender] = FHE.add(
            userEncryptedValues[msg.sender],
            valueToAdd
        );

        // Update permissions
        FHE.allowThis(userEncryptedValues[msg.sender]);
        FHE.allow(userEncryptedValues[msg.sender], msg.sender);

        emit ValueEncrypted(msg.sender);
    }

    /**
     * @notice Clear stored value for caller
     * @dev Allows users to remove their encrypted data
     */
    function clearValue() external {
        hasValue[msg.sender] = false;
    }
}
