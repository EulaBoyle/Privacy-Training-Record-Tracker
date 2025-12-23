// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title SimpleArithmetic
 * @notice Demonstrates basic FHE arithmetic operations
 * @dev Shows add, sub, mul operations on encrypted values
 *
 * Learning objectives:
 * - Understand FHE arithmetic operations
 * - Learn proper permission management after operations
 * - See how to chain multiple operations
 */
contract SimpleArithmetic is SepoliaConfig {
    // Stored encrypted values for demonstration
    mapping(address => euint32) public userValues;

    // Events
    event OperationPerformed(address indexed user, string operation);

    /**
     * @notice Store an encrypted value
     * @param encryptedValue Encrypted input
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

        emit OperationPerformed(msg.sender, "store");
    }

    /**
     * @notice Add to stored value
     * @param encryptedAddend Encrypted value to add
     * @param inputProof Input proof
     */
    function addToValue(
        inEuint32 calldata encryptedAddend,
        bytes calldata inputProof
    ) external {
        euint32 addend = FHE.asEuint32(encryptedAddend, inputProof);

        // Perform encrypted addition
        userValues[msg.sender] = FHE.add(userValues[msg.sender], addend);

        // IMPORTANT: Update permissions after operation
        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);

        emit OperationPerformed(msg.sender, "add");
    }

    /**
     * @notice Subtract from stored value
     * @param encryptedSubtrahend Encrypted value to subtract
     * @param inputProof Input proof
     */
    function subtractFromValue(
        inEuint32 calldata encryptedSubtrahend,
        bytes calldata inputProof
    ) external {
        euint32 subtrahend = FHE.asEuint32(encryptedSubtrahend, inputProof);

        // Perform encrypted subtraction
        userValues[msg.sender] = FHE.sub(userValues[msg.sender], subtrahend);

        // Update permissions
        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);

        emit OperationPerformed(msg.sender, "subtract");
    }

    /**
     * @notice Multiply stored value
     * @param encryptedMultiplier Encrypted multiplier
     * @param inputProof Input proof
     */
    function multiplyValue(
        inEuint32 calldata encryptedMultiplier,
        bytes calldata inputProof
    ) external {
        euint32 multiplier = FHE.asEuint32(encryptedMultiplier, inputProof);

        // Perform encrypted multiplication
        userValues[msg.sender] = FHE.mul(userValues[msg.sender], multiplier);

        // Update permissions
        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);

        emit OperationPerformed(msg.sender, "multiply");
    }

    /**
     * @notice Divide stored value
     * @param encryptedDivisor Encrypted divisor
     * @param inputProof Input proof
     */
    function divideValue(
        inEuint32 calldata encryptedDivisor,
        bytes calldata inputProof
    ) external {
        euint32 divisor = FHE.asEuint32(encryptedDivisor, inputProof);

        // Perform encrypted division
        userValues[msg.sender] = FHE.div(userValues[msg.sender], divisor);

        // Update permissions
        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);

        emit OperationPerformed(msg.sender, "divide");
    }

    /**
     * @notice Perform multiple operations in sequence
     * @param encryptedAdd Value to add
     * @param encryptedMul Value to multiply by
     * @param addProof Proof for add
     * @param mulProof Proof for multiply
     * @dev Demonstrates chaining operations
     */
    function chainedOperations(
        inEuint32 calldata encryptedAdd,
        inEuint32 calldata encryptedMul,
        bytes calldata addProof,
        bytes calldata mulProof
    ) external {
        euint32 addValue = FHE.asEuint32(encryptedAdd, addProof);
        euint32 mulValue = FHE.asEuint32(encryptedMul, mulProof);

        // Chain: (value + addValue) * mulValue
        euint32 temp = FHE.add(userValues[msg.sender], addValue);
        userValues[msg.sender] = FHE.mul(temp, mulValue);

        // Update permissions for final result
        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);

        emit OperationPerformed(msg.sender, "chained");
    }

    /**
     * @notice Get user's encrypted value
     * @return User's encrypted value
     */
    function getValue() external view returns (euint32) {
        return userValues[msg.sender];
    }

    /**
     * @notice Reset value to zero
     */
    function resetValue() external {
        userValues[msg.sender] = FHE.asEuint32(0);

        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);

        emit OperationPerformed(msg.sender, "reset");
    }

    /**
     * @notice Demonstrate min/max operations
     * @param encryptedValue1 First value
     * @param encryptedValue2 Second value
     * @param proof1 Proof for first value
     * @param proof2 Proof for second value
     * @return min The minimum value
     * @return max The maximum value
     */
    function minMaxDemo(
        inEuint32 calldata encryptedValue1,
        inEuint32 calldata encryptedValue2,
        bytes calldata proof1,
        bytes calldata proof2
    ) external view returns (euint32 min, euint32 max) {
        euint32 val1 = FHE.asEuint32(encryptedValue1, proof1);
        euint32 val2 = FHE.asEuint32(encryptedValue2, proof2);

        min = FHE.min(val1, val2);
        max = FHE.max(val1, val2);

        return (min, max);
    }
}
