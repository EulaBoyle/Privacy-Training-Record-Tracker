// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title BadContract - ANTI-PATTERN EXAMPLES
 * @notice THIS CONTRACT DEMONSTRATES COMMON MISTAKES - DO NOT USE IN PRODUCTION
 * @dev Shows what NOT to do with FHEVM
 *
 * WARNING: This contract contains intentional bugs and anti-patterns
 * for educational purposes. Each function demonstrates a specific mistake.
 */
contract BadContract is SepoliaConfig {
    euint32 private encryptedValue;
    ebool private encryptedFlag;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // ❌ ANTI-PATTERN 1: Missing FHE.allowThis()
    /**
     * @notice WRONG: Creates encrypted value but forgets FHE.allowThis()
     * @dev This will cause issues when contract tries to use the value later
     */
    function antiPattern1_MissingAllowThis(uint32 value) external {
        encryptedValue = FHE.asEuint32(value);
        // ❌ MISSING: FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);
    }

    // ✅ CORRECT PATTERN:
    /**
     * @notice CORRECT: Properly sets both permissions
     */
    function correctPattern1(uint32 value) external {
        encryptedValue = FHE.asEuint32(value);
        FHE.allowThis(encryptedValue);  // ✅ Contract can use
        FHE.allow(encryptedValue, msg.sender);  // ✅ User can decrypt
    }

    // ❌ ANTI-PATTERN 2: View function with encrypted state change attempt
    /**
     * @notice WRONG: Tries to set permissions in view function
     * @dev View functions cannot modify state, including FHE permissions
     */
    function antiPattern2_ViewFunctionWithPermission()
        external
        view
        returns (euint32)
    {
        // ❌ WRONG: Cannot call FHE.allow in view function
        // FHE.allow(encryptedValue, msg.sender);  // This would fail
        return encryptedValue;
    }

    // ✅ CORRECT PATTERN:
    /**
     * @notice CORRECT: Set permissions when creating value
     */
    function correctPattern2_SetPermissionsOnCreate(uint32 value) external {
        encryptedValue = FHE.asEuint32(value);
        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);  // ✅ Set during creation
    }

    // ❌ ANTI-PATTERN 3: No access control on encrypted data
    /**
     * @notice WRONG: Returns encrypted data without checking authorization
     * @dev Anyone can call this and get the encrypted value
     */
    function antiPattern3_NoAccessControl() external view returns (euint32) {
        // ❌ MISSING: Authorization check
        return encryptedValue;
    }

    // ✅ CORRECT PATTERN:
    /**
     * @notice CORRECT: Check authorization before returning encrypted data
     */
    function correctPattern3() external view returns (euint32) {
        require(msg.sender == owner, "Not authorized");  // ✅ Check access
        return encryptedValue;
    }

    // ❌ ANTI-PATTERN 4: Using oversized encrypted types
    /**
     * @notice WRONG: Uses euint32 for boolean value
     * @dev Wastes gas by using larger type than needed
     */
    function antiPattern4_OversizedType(uint32 value) external {
        // ❌ WRONG: Should use ebool for true/false
        encryptedValue = FHE.asEuint32(value);  // Value is only 0 or 1
        FHE.allowThis(encryptedValue);
    }

    // ✅ CORRECT PATTERN:
    /**
     * @notice CORRECT: Use appropriately sized encrypted type
     */
    function correctPattern4(bool value) external {
        encryptedFlag = FHE.asEbool(value);  // ✅ Use ebool for boolean
        FHE.allowThis(encryptedFlag);
    }

    // ❌ ANTI-PATTERN 5: Forgetting to update permissions after operations
    /**
     * @notice WRONG: Performs operation but doesn't update permissions
     * @dev After operations, need to reset permissions for the new value
     */
    function antiPattern5_ForgottenPermissionUpdate(uint32 addValue)
        external
    {
        euint32 toAdd = FHE.asEuint32(addValue);
        FHE.allowThis(toAdd);

        encryptedValue = FHE.add(encryptedValue, toAdd);
        // ❌ MISSING: Should update permissions for new encryptedValue
    }

    // ✅ CORRECT PATTERN:
    /**
     * @notice CORRECT: Update permissions after operations
     */
    function correctPattern5(uint32 addValue) external {
        euint32 toAdd = FHE.asEuint32(addValue);
        FHE.allowThis(toAdd);

        encryptedValue = FHE.add(encryptedValue, toAdd);

        // ✅ Update permissions for result
        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);
    }

    // ❌ ANTI-PATTERN 6: Missing input proof verification
    /**
     * @notice WRONG: Creates encrypted value without proof
     * @dev Input proofs are essential for security
     */
    function antiPattern6_NoInputProof(uint32 value) external {
        // ❌ WRONG: Direct conversion without proof
        encryptedValue = FHE.asEuint32(value);
        FHE.allowThis(encryptedValue);
    }

    // ✅ CORRECT PATTERN: (Would need inEuint32 and inputProof params)
    /**
     * @notice CORRECT: Use input proofs for user-provided encrypted values
     * @dev This is just a comment showing correct signature
     *
     * function correctPattern6(
     *     inEuint32 calldata inputHandle,
     *     bytes calldata inputProof
     * ) external {
     *     euint32 value = FHE.asEuint32(inputHandle, inputProof);
     *     FHE.allowThis(value);
     * }
     */

    // ❌ ANTI-PATTERN 7: Exposing decrypted values on-chain
    /**
     * @notice WRONG: Event emits decrypted value
     * @dev Should never emit decrypted sensitive values
     */
    event ValueDecrypted(uint32 value);  // ❌ WRONG: Exposes value

    function antiPattern7_ExposingDecryptedValue() external {
        // ❌ WRONG: This pattern would decrypt and emit
        // In real code: uint32 decrypted = decrypt(encryptedValue);
        // emit ValueDecrypted(decrypted);  // ❌ Exposes to everyone
    }

    // ✅ CORRECT PATTERN:
    /**
     * @notice CORRECT: Only emit non-sensitive data or keep encrypted
     */
    event ValueUpdated(address indexed user);  // ✅ No sensitive data

    function correctPattern7() external {
        // Update value...
        emit ValueUpdated(msg.sender);  // ✅ Only emit public info
    }

    // ❌ ANTI-PATTERN 8: Reusing same encrypted value without fresh permissions
    /**
     * @notice WRONG: Assigns old encrypted value to new storage
     * @dev Each storage location needs its own permissions
     */
    mapping(address => euint32) public userValues;

    function antiPattern8_ReusingEncryptedValue(address user) external {
        // ❌ WRONG: Just copies reference, permissions may not transfer
        userValues[user] = encryptedValue;
        // Missing permission setup for userValues[user]
    }

    // ✅ CORRECT PATTERN:
    /**
     * @notice CORRECT: Set permissions for each storage location
     */
    function correctPattern8(address user, uint32 value) external {
        euint32 newValue = FHE.asEuint32(value);
        userValues[user] = newValue;

        // ✅ Set permissions for the specific storage slot
        FHE.allowThis(newValue);
        FHE.allow(newValue, user);
    }

    // Summary getter
    function getEncryptedValue() external view returns (euint32) {
        return encryptedValue;
    }
}
