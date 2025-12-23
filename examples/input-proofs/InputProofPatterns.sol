// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint16, euint32, euint64, eaddress, ebool, inEuint8, inEuint16, inEuint32, inEuint64, inEaddress, inEbool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title InputProofPatterns
 * @notice Comprehensive guide to input proof handling in FHEVM
 * @dev Demonstrates all input proof patterns, validation, and best practices
 *
 * Learning objectives:
 * - Understand input proofs for all encrypted types
 * - Learn proper validation patterns
 * - Explore batch operations with proofs
 * - See common pitfalls and solutions
 * - Understand proof format and validation
 */
contract InputProofPatterns is SepoliaConfig {
    // Storage for various encrypted types with proofs
    mapping(address => euint8) public smallValues;
    mapping(address => euint16) public mediumValues;
    mapping(address => euint32) public largeValues;
    mapping(address => euint64) public veryLargeValues;
    mapping(address => eaddress) public encryptedAddresses;
    mapping(address => ebool) public encryptedBooleans;

    // Proof metadata storage
    mapping(address => bytes) public lastProofUsed;
    mapping(address => uint256) public proofTimestamps;

    // Validation tracking
    mapping(address => uint256) public validProofsCount;
    mapping(address => uint256) public invalidProofsCount;

    // Events
    event InputProcessed(address indexed user, string dataType, bool success);
    event ProofValidated(address indexed user, bytes32 proofHash);
    event ProofRejected(address indexed user, string reason);
    event BatchProcessed(address indexed user, uint256 count);

    /**
     * @notice Process euint8 with input proof
     * @param encryptedInput Encrypted 8-bit input
     * @param inputProof Proof for the input
     * @dev Pattern: Store small values (0-255)
     */
    function storeEuint8(
        inEuint8 calldata encryptedInput,
        bytes calldata inputProof
    ) external {
        require(inputProof.length > 0, "Proof cannot be empty");

        // Convert encrypted input with proof
        euint8 value = FHE.asEuint8(encryptedInput, inputProof);

        // Store value
        smallValues[msg.sender] = value;

        // Set permissions
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        // Track successful proof
        validProofsCount[msg.sender]++;
        lastProofUsed[msg.sender] = inputProof;
        proofTimestamps[msg.sender] = block.timestamp;

        emit InputProcessed(msg.sender, "euint8", true);
        emit ProofValidated(msg.sender, keccak256(inputProof));
    }

    /**
     * @notice Process euint16 with validation
     * @param encryptedInput Encrypted 16-bit input
     * @param inputProof Proof for the input
     */
    function storeEuint16(
        inEuint16 calldata encryptedInput,
        bytes calldata inputProof
    ) external {
        require(encryptedInput.length > 0, "Encrypted input cannot be empty");
        require(inputProof.length > 0, "Proof cannot be empty");

        euint16 value = FHE.asEuint16(encryptedInput, inputProof);

        mediumValues[msg.sender] = value;

        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        validProofsCount[msg.sender]++;
        emit InputProcessed(msg.sender, "euint16", true);
    }

    /**
     * @notice Process euint32 with proof
     * @param encryptedInput Encrypted 32-bit input
     * @param inputProof Proof for the input
     * @dev Most common encrypted integer type
     */
    function storeEuint32(
        inEuint32 calldata encryptedInput,
        bytes calldata inputProof
    ) external {
        require(encryptedInput.length > 0, "Input cannot be empty");
        require(inputProof.length >= 32, "Proof too short"); // Minimum proof size

        euint32 value = FHE.asEuint32(encryptedInput, inputProof);

        largeValues[msg.sender] = value;

        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        validProofsCount[msg.sender]++;
        emit InputProcessed(msg.sender, "euint32", true);
    }

    /**
     * @notice Process euint64 with proof
     * @param encryptedInput Encrypted 64-bit input
     * @param inputProof Proof for the input
     */
    function storeEuint64(
        inEuint64 calldata encryptedInput,
        bytes calldata inputProof
    ) external {
        require(encryptedInput.length > 0, "Input cannot be empty");
        require(inputProof.length > 0, "Proof cannot be empty");

        euint64 value = FHE.asEuint64(encryptedInput, inputProof);

        veryLargeValues[msg.sender] = value;

        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        validProofsCount[msg.sender]++;
        emit InputProcessed(msg.sender, "euint64", true);
    }

    /**
     * @notice Process encrypted address with proof
     * @param encryptedAddress Encrypted address
     * @param inputProof Proof for the address
     */
    function storeEaddress(
        inEaddress calldata encryptedAddress,
        bytes calldata inputProof
    ) external {
        require(encryptedAddress.length > 0, "Address cannot be empty");
        require(inputProof.length > 0, "Proof cannot be empty");

        eaddress value = FHE.asEaddress(encryptedAddress, inputProof);

        encryptedAddresses[msg.sender] = value;

        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        validProofsCount[msg.sender]++;
        emit InputProcessed(msg.sender, "eaddress", true);
    }

    /**
     * @notice Process encrypted boolean with proof
     * @param encryptedBool Encrypted boolean value
     * @param inputProof Proof for the boolean
     */
    function storeEbool(
        inEbool calldata encryptedBool,
        bytes calldata inputProof
    ) external {
        require(encryptedBool.length > 0, "Boolean cannot be empty");
        require(inputProof.length > 0, "Proof cannot be empty");

        ebool value = FHE.asEbool(encryptedBool, inputProof);

        encryptedBooleans[msg.sender] = value;

        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        validProofsCount[msg.sender]++;
        emit InputProcessed(msg.sender, "ebool", true);
    }

    /**
     * @notice Demonstrate batch processing with multiple proofs
     * @param value1 First encrypted value
     * @param value2 Second encrypted value
     * @param proof1 First proof
     * @param proof2 Second proof
     */
    function processBatch(
        inEuint32 calldata value1,
        inEuint32 calldata value2,
        bytes calldata proof1,
        bytes calldata proof2
    ) external {
        require(value1.length > 0 && value2.length > 0, "Empty inputs");
        require(proof1.length > 0 && proof2.length > 0, "Empty proofs");

        // Process first value
        euint32 enc1 = FHE.asEuint32(value1, proof1);
        largeValues[msg.sender] = enc1;

        FHE.allowThis(enc1);
        FHE.allow(enc1, msg.sender);

        // Process second value
        euint32 enc2 = FHE.asEuint32(value2, proof2);
        // Store in different mapping or combine
        euint32 sum = FHE.add(enc1, enc2);

        FHE.allowThis(sum);
        FHE.allow(sum, msg.sender);

        validProofsCount[msg.sender] += 2;
        emit BatchProcessed(msg.sender, 2);
    }

    /**
     * @notice Demonstrate safe proof handling with try-catch pattern
     * @param encryptedInput Encrypted value
     * @param inputProof Proof that might be invalid
     * @return success Whether input processing succeeded
     */
    function safeSt oregEuint32(
        inEuint32 calldata encryptedInput,
        bytes calldata inputProof
    ) external returns (bool success) {
        try this.storeEuint32(encryptedInput, inputProof) {
            validProofsCount[msg.sender]++;
            return true;
        } catch {
            invalidProofsCount[msg.sender]++;
            emit ProofRejected(msg.sender, "Processing failed");
            return false;
        }
    }

    /**
     * @notice Demonstrate proof size validation
     * @param encryptedInput Encrypted value
     * @param inputProof Proof to validate
     * @return isValid Whether proof meets minimum requirements
     */
    function validateProofSize(
        inEuint32 calldata encryptedInput,
        bytes calldata inputProof
    ) external pure returns (bool isValid) {
        // Typical proof sizes:
        // - Minimum: ~32 bytes
        // - Typical: ~128-256 bytes
        // - Maximum: ~512+ bytes depending on proof system

        if (inputProof.length < 32) {
            return false; // Proof too short
        }

        if (inputProof.length > 1024) {
            return false; // Proof too long (potential DOS)
        }

        if (encryptedInput.length == 0) {
            return false; // No encrypted input
        }

        return true;
    }

    /**
     * @notice Demonstrate proof and input correlation
     * @param encryptedValue Encrypted value
     * @param inputProof Proof must match this value
     * @return valueStored Whether value was stored successfully
     */
    function storeWithValidation(
        inEuint32 calldata encryptedValue,
        bytes calldata inputProof
    ) external returns (bool valueStored) {
        // Validate input-proof pair
        if (encryptedValue.length == 0 || inputProof.length == 0) {
            emit ProofRejected(msg.sender, "Empty input or proof");
            invalidProofsCount[msg.sender]++;
            return false;
        }

        // Additional validation: proof hash should relate to input
        // (Simplified example - real implementation depends on proof system)
        bytes32 inputHash = keccak256(encryptedValue);
        bytes32 proofHash = keccak256(inputProof);

        // Try to process
        euint32 value = FHE.asEuint32(encryptedValue, inputProof);

        largeValues[msg.sender] = value;
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        validProofsCount[msg.sender]++;
        emit ProofValidated(msg.sender, proofHash);

        return true;
    }

    /**
     * @notice Get input proof statistics for user
     * @param user User address to check
     * @return validCount Number of valid proofs processed
     * @return invalidCount Number of invalid proofs encountered
     */
    function getProofStats(
        address user
    ) external view returns (uint256 validCount, uint256 invalidCount) {
        return (validProofsCount[user], invalidProofsCount[user]);
    }

    /**
     * @notice Get last proof timestamp for user
     * @param user User address to check
     * @return timestamp When last proof was used
     */
    function getLastProofTimestamp(address user) external view returns (uint256) {
        return proofTimestamps[user];
    }

    /**
     * @notice Retrieve stored encrypted values
     * @return val8 Stored euint8 value
     * @return val16 Stored euint16 value
     * @return val32 Stored euint32 value
     * @return val64 Stored euint64 value
     */
    function getAllValues()
        external
        view
        returns (euint8 val8, euint16 val16, euint32 val32, euint64 val64)
    {
        return (
            smallValues[msg.sender],
            mediumValues[msg.sender],
            largeValues[msg.sender],
            veryLargeValues[msg.sender]
        );
    }

    /**
     * @notice Demonstrate proof reuse (same proof for different operation)
     * @param encryptedValue1 First encrypted value
     * @param encryptedValue2 Second value using same proof
     * @param inputProof Proof that should work for both
     * @dev WARNING: Reusing proofs can create security issues
     */
    function demonstrateProofReuse(
        inEuint32 calldata encryptedValue1,
        inEuint32 calldata encryptedValue2,
        bytes calldata inputProof
    ) external {
        // Process first value with proof
        euint32 value1 = FHE.asEuint32(encryptedValue1, inputProof);

        // Try to reuse same proof for different input (DON'T DO THIS in production)
        // This is educational only
        euint32 value2 = FHE.asEuint32(encryptedValue2, inputProof);

        // Add values
        euint32 sum = FHE.add(value1, value2);

        FHE.allowThis(sum);
        FHE.allow(sum, msg.sender);
    }

    /**
     * @notice Demonstrate parameterized processing
     * @param encryptedValue Value to process
     * @param inputProof Proof for value
     * @param operationType Type of operation (1=store, 2=compare, etc)
     */
    function processWithType(
        inEuint32 calldata encryptedValue,
        bytes calldata inputProof,
        uint8 operationType
    ) external {
        require(operationType > 0 && operationType <= 3, "Invalid operation");
        require(encryptedValue.length > 0, "Empty input");
        require(inputProof.length > 0, "Empty proof");

        euint32 value = FHE.asEuint32(encryptedValue, inputProof);

        if (operationType == 1) {
            // Store operation
            largeValues[msg.sender] = value;
        } else if (operationType == 2) {
            // Compare operation (simplified)
            euint32 existing = largeValues[msg.sender];
            // Would perform comparison here
        } else if (operationType == 3) {
            // Aggregate operation (simplified)
            euint32 existing = largeValues[msg.sender];
            // Would aggregate here
        }

        FHE.allowThis(value);
        FHE.allow(value, msg.sender);
        validProofsCount[msg.sender]++;
    }

    /**
     * @notice Common mistake: Forgetting proof validation
     * @param encryptedValue Encrypted value
     * @param inputProof Proof
     * @dev WRONG PATTERN - shown for educational purposes
     */
    function wrongPatternForgotValidation(
        inEuint32 calldata encryptedValue,
        bytes calldata inputProof
    ) external {
        // WRONG: No validation of proof length or input
        // This could fail silently or cause issues

        euint32 value = FHE.asEuint32(encryptedValue, inputProof);
        largeValues[msg.sender] = value;

        // WRONG: Forgot to set permissions
        // Contract is set, but user cannot decrypt
        FHE.allowThis(value);
        // Missing: FHE.allow(value, msg.sender);
    }

    /**
     * @notice Correct pattern: Complete validation
     * @param encryptedValue Encrypted value
     * @param inputProof Proof
     */
    function correctPatternFullValidation(
        inEuint32 calldata encryptedValue,
        bytes calldata inputProof
    ) external {
        // Validate inputs
        require(encryptedValue.length > 0, "Empty encrypted value");
        require(inputProof.length > 0, "Empty proof");
        require(inputProof.length >= 32, "Proof too short");
        require(inputProof.length <= 1024, "Proof too long");

        // Convert with proof
        euint32 value = FHE.asEuint32(encryptedValue, inputProof);

        // Store
        largeValues[msg.sender] = value;

        // Set ALL required permissions
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        // Track success
        validProofsCount[msg.sender]++;
        emit InputProcessed(msg.sender, "euint32", true);
    }
}
