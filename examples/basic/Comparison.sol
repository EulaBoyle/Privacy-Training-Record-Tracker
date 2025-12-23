// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Comparison
 * @notice Demonstrates FHE comparison operations
 * @dev Shows eq, ne, lt, le, gt, ge operations on encrypted values
 *
 * Learning objectives:
 * - Understand FHE comparison operations
 * - Learn how comparisons return encrypted booleans
 * - See how to use comparison results in conditional logic
 */
contract Comparison is SepoliaConfig {
    // Stored encrypted values
    mapping(address => euint32) public userValues;

    // Stored comparison results
    mapping(address => ebool) public lastComparisonResult;

    // Events
    event ComparisonPerformed(address indexed user, string operation);

    /**
     * @notice Store a value for comparison
     * @param encryptedValue Encrypted value
     * @param inputProof Input proof
     */
    function storeValue(
        inEuint32 calldata encryptedValue,
        bytes calldata inputProof
    ) external {
        euint32 value = FHE.asEuint32(encryptedValue, inputProof);
        userValues[msg.sender] = value;

        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);
    }

    /**
     * @notice Check if stored value equals another value
     * @param encryptedOther Value to compare against
     * @param inputProof Input proof
     * @return Encrypted boolean result
     */
    function isEqual(
        inEuint32 calldata encryptedOther,
        bytes calldata inputProof
    ) external returns (ebool) {
        euint32 other = FHE.asEuint32(encryptedOther, inputProof);

        // Perform encrypted equality check
        ebool result = FHE.eq(userValues[msg.sender], other);

        // Store result
        lastComparisonResult[msg.sender] = result;

        // Set permissions
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        emit ComparisonPerformed(msg.sender, "equal");
        return result;
    }

    /**
     * @notice Check if stored value is not equal to another value
     * @param encryptedOther Value to compare against
     * @param inputProof Input proof
     * @return Encrypted boolean result
     */
    function isNotEqual(
        inEuint32 calldata encryptedOther,
        bytes calldata inputProof
    ) external returns (ebool) {
        euint32 other = FHE.asEuint32(encryptedOther, inputProof);

        ebool result = FHE.ne(userValues[msg.sender], other);

        lastComparisonResult[msg.sender] = result;

        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        emit ComparisonPerformed(msg.sender, "notEqual");
        return result;
    }

    /**
     * @notice Check if stored value is less than another value
     * @param encryptedOther Value to compare against
     * @param inputProof Input proof
     * @return Encrypted boolean result
     */
    function isLessThan(
        inEuint32 calldata encryptedOther,
        bytes calldata inputProof
    ) external returns (ebool) {
        euint32 other = FHE.asEuint32(encryptedOther, inputProof);

        ebool result = FHE.lt(userValues[msg.sender], other);

        lastComparisonResult[msg.sender] = result;

        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        emit ComparisonPerformed(msg.sender, "lessThan");
        return result;
    }

    /**
     * @notice Check if stored value is less than or equal
     * @param encryptedOther Value to compare against
     * @param inputProof Input proof
     * @return Encrypted boolean result
     */
    function isLessThanOrEqual(
        inEuint32 calldata encryptedOther,
        bytes calldata inputProof
    ) external returns (ebool) {
        euint32 other = FHE.asEuint32(encryptedOther, inputProof);

        ebool result = FHE.le(userValues[msg.sender], other);

        lastComparisonResult[msg.sender] = result;

        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        emit ComparisonPerformed(msg.sender, "lessThanOrEqual");
        return result;
    }

    /**
     * @notice Check if stored value is greater than another value
     * @param encryptedOther Value to compare against
     * @param inputProof Input proof
     * @return Encrypted boolean result
     */
    function isGreaterThan(
        inEuint32 calldata encryptedOther,
        bytes calldata inputProof
    ) external returns (ebool) {
        euint32 other = FHE.asEuint32(encryptedOther, inputProof);

        ebool result = FHE.gt(userValues[msg.sender], other);

        lastComparisonResult[msg.sender] = result;

        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        emit ComparisonPerformed(msg.sender, "greaterThan");
        return result;
    }

    /**
     * @notice Check if stored value is greater than or equal
     * @param encryptedOther Value to compare against
     * @param inputProof Input proof
     * @return Encrypted boolean result
     */
    function isGreaterThanOrEqual(
        inEuint32 calldata encryptedOther,
        bytes calldata inputProof
    ) external returns (ebool) {
        euint32 other = FHE.asEuint32(encryptedOther, inputProof);

        ebool result = FHE.ge(userValues[msg.sender], other);

        lastComparisonResult[msg.sender] = result;

        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        emit ComparisonPerformed(msg.sender, "greaterThanOrEqual");
        return result;
    }

    /**
     * @notice Conditional value selection based on comparison
     * @param encryptedThreshold Threshold value
     * @param encryptedValueIfAbove Value if above threshold
     * @param encryptedValueIfBelow Value if below threshold
     * @param thresholdProof Proof for threshold
     * @param aboveProof Proof for above value
     * @param belowProof Proof for below value
     * @return Selected value based on comparison
     */
    function conditionalSelect(
        inEuint32 calldata encryptedThreshold,
        inEuint32 calldata encryptedValueIfAbove,
        inEuint32 calldata encryptedValueIfBelow,
        bytes calldata thresholdProof,
        bytes calldata aboveProof,
        bytes calldata belowProof
    ) external view returns (euint32) {
        euint32 threshold = FHE.asEuint32(encryptedThreshold, thresholdProof);
        euint32 valueIfAbove = FHE.asEuint32(encryptedValueIfAbove, aboveProof);
        euint32 valueIfBelow = FHE.asEuint32(encryptedValueIfBelow, belowProof);

        // Check if user value is greater than threshold
        ebool isAbove = FHE.gt(userValues[msg.sender], threshold);

        // Select value based on condition
        euint32 result = FHE.select(isAbove, valueIfAbove, valueIfBelow);

        return result;
    }

    /**
     * @notice Get last comparison result
     * @return Encrypted boolean result
     */
    function getLastResult() external view returns (ebool) {
        return lastComparisonResult[msg.sender];
    }

    /**
     * @notice Get stored value
     * @return Encrypted value
     */
    function getValue() external view returns (euint32) {
        return userValues[msg.sender];
    }

    /**
     * @notice Demonstrate all comparison operations at once
     * @param encryptedOther Value to compare against
     * @param inputProof Input proof
     * @return eq Equal result
     * @return ne Not equal result
     * @return lt Less than result
     * @return le Less than or equal result
     * @return gt Greater than result
     * @return ge Greater than or equal result
     */
    function compareAll(
        inEuint32 calldata encryptedOther,
        bytes calldata inputProof
    ) external view returns (
        ebool eq,
        ebool ne,
        ebool lt,
        ebool le,
        ebool gt,
        ebool ge
    ) {
        euint32 other = FHE.asEuint32(encryptedOther, inputProof);
        euint32 value = userValues[msg.sender];

        eq = FHE.eq(value, other);
        ne = FHE.ne(value, other);
        lt = FHE.lt(value, other);
        le = FHE.le(value, other);
        gt = FHE.gt(value, other);
        ge = FHE.ge(value, other);

        return (eq, ne, lt, le, gt, ge);
    }
}
