# FHEVM Anti-Patterns - Common Mistakes and How to Avoid Them

## Overview

This guide documents common mistakes when working with FHEVM and shows you the correct patterns to use instead.

## Anti-Pattern #1: Missing FHE.allowThis()

### ❌ WRONG
```solidity
function storeValue(uint32 value) external {
    euint32 encrypted = FHE.asEuint32(value);
    FHE.allow(encrypted, msg.sender);
    // ❌ Missing FHE.allowThis()!
}
```

### Why It's Wrong
The contract itself needs permission to use the encrypted value in future operations. Without `FHE.allowThis()`, any contract function trying to use this value will fail.

### ✅ CORRECT
```solidity
function storeValue(uint32 value) external {
    euint32 encrypted = FHE.asEuint32(value);
    FHE.allowThis(encrypted);          // ✅ Contract can use
    FHE.allow(encrypted, msg.sender);  // ✅ User can decrypt
}
```

### Rule
**Always call both `FHE.allowThis()` and `FHE.allow()`** for every encrypted value.

---

## Anti-Pattern #2: View Functions with Permissions

### ❌ WRONG
```solidity
function getValue() external view returns (euint32) {
    FHE.allow(encryptedValue, msg.sender);  // ❌ Can't modify in view!
    return encryptedValue;
}
```

### Why It's Wrong
View functions cannot modify state, including FHE permissions. Attempting to call `FHE.allow()` in a view function will fail.

### ✅ CORRECT
```solidity
// Set permissions when creating/updating the value
function setValue(uint32 value) external {
    encryptedValue = FHE.asEuint32(value);
    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);  // ✅ Set during creation
}

// View function only reads
function getValue() external view returns (euint32) {
    return encryptedValue;  // ✅ Permissions already set
}
```

### Rule
**Set permissions in non-view functions** when creating or updating encrypted values.

---

## Anti-Pattern #3: No Access Control

### ❌ WRONG
```solidity
function getEncryptedData(uint256 id) external view returns (euint32) {
    return encryptedData[id];  // ❌ Anyone can access!
}
```

### Why It's Wrong
Without authorization checks, any address can call the function and receive the encrypted value. While they can't decrypt it without permissions, this still leaks information about data existence and structure.

### ✅ CORRECT
```solidity
function getEncryptedData(uint256 id) external view returns (euint32) {
    require(
        msg.sender == dataOwner[id] ||
        isAuthorized[msg.sender],
        "Not authorized"
    );
    return encryptedData[id];  // ✅ Only authorized access
}
```

### Rule
**Always implement access control** before returning encrypted data.

---

## Anti-Pattern #4: Oversized Encrypted Types

### ❌ WRONG
```solidity
ebool isActive;
euint64 level;    // ❌ Level is 0-100, euint8 would suffice

function setLevel(uint64 value) external {
    level = FHE.asEuint64(value);  // ❌ Wastes gas
}
```

### Why It's Wrong
Larger encrypted types cost more gas. Using `euint64` for a value that fits in `euint8` (0-255) wastes resources.

### ✅ CORRECT
```solidity
ebool isActive;
euint8 level;     // ✅ Appropriate size for 0-100

function setLevel(uint8 value) external {
    level = FHE.asEuint8(value);  // ✅ Efficient
}
```

### Type Selection Guide

| Range | Use | Don't Use |
|-------|-----|-----------|
| true/false | `ebool` | `euint8` |
| 0-255 | `euint8` | `euint32` |
| 0-65535 | `euint16` | `euint32` |
| 0-4B | `euint32` | `euint64` |
| >4B | `euint64` | |

### Rule
**Use the smallest type** that fits your data range.

---

## Anti-Pattern #5: Forgetting Permission Updates After Operations

### ❌ WRONG
```solidity
function addValue(uint32 toAdd) external {
    euint32 addend = FHE.asEuint32(toAdd);
    FHE.allowThis(addend);

    storedValue = FHE.add(storedValue, addend);
    // ❌ Missing: Permission updates for new storedValue
}
```

### Why It's Wrong
After FHE operations, the result is a new encrypted value that needs fresh permissions set.

### ✅ CORRECT
```solidity
function addValue(uint32 toAdd) external {
    euint32 addend = FHE.asEuint32(toAdd);
    FHE.allowThis(addend);

    storedValue = FHE.add(storedValue, addend);

    // ✅ Update permissions for result
    FHE.allowThis(storedValue);
    FHE.allow(storedValue, msg.sender);
}
```

### Rule
**Always update permissions** after FHE operations (add, sub, mul, etc.).

---

## Anti-Pattern #6: Missing Input Proofs

### ❌ WRONG
```solidity
function submitValue(uint32 value) external {
    euint32 encrypted = FHE.asEuint32(value);  // ❌ No proof!
    FHE.allowThis(encrypted);
}
```

### Why It's Wrong
Without input proofs, there's no verification that the encrypted value is properly bound to the contract and user.

### ✅ CORRECT
```solidity
function submitValue(
    inEuint32 calldata inputHandle,
    bytes calldata inputProof
) external {
    euint32 encrypted = FHE.asEuint32(inputHandle, inputProof);  // ✅ With proof
    FHE.allowThis(encrypted);
    FHE.allow(encrypted, msg.sender);
}
```

### Rule
**Always use input proofs** for user-provided encrypted values.

---

## Anti-Pattern #7: Exposing Decrypted Values

### ❌ WRONG
```solidity
event ValueRevealed(uint32 decryptedValue);  // ❌ Exposes value!

function revealValue() external {
    uint32 value = decrypt(encryptedValue);
    emit ValueRevealed(value);  // ❌ Everyone can see!
}
```

### Why It's Wrong
Emitting decrypted values in events defeats the purpose of encryption. Events are publicly visible on-chain.

### ✅ CORRECT
```solidity
event ValueUpdated(address indexed user);  // ✅ No sensitive data

function updateValue(uint32 newValue) external {
    encryptedValue = FHE.asEuint32(newValue);
    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);

    emit ValueUpdated(msg.sender);  // ✅ Only public info
}
```

### Rule
**Never emit or store decrypted sensitive data** on-chain.

---

## Anti-Pattern #8: Improper Permission Transfer

### ❌ WRONG
```solidity
mapping(address => euint32) public userValues;

function copyValue(address toUser) external {
    userValues[toUser] = userValues[msg.sender];
    // ❌ Missing: Permission setup for new storage slot
}
```

### Why It's Wrong
Each storage location needs its own permissions. Simply copying an encrypted value doesn't transfer permissions.

### ✅ CORRECT
```solidity
function copyValue(address toUser, uint32 value) external {
    euint32 newValue = FHE.asEuint32(value);
    userValues[toUser] = newValue;

    // ✅ Set permissions for new storage location
    FHE.allowThis(newValue);
    FHE.allow(newValue, toUser);
}
```

### Rule
**Set permissions for each unique storage location** with encrypted data.

---

## Summary Checklist

Before deploying your FHEVM contract, verify:

- [ ] Every encrypted value has `FHE.allowThis()` called
- [ ] Every encrypted value has `FHE.allow()` called for authorized users
- [ ] No `FHE.allow()` calls in view functions
- [ ] Access control implemented for all encrypted data getters
- [ ] Smallest appropriate encrypted types used
- [ ] Permissions updated after FHE operations
- [ ] Input proofs used for user-provided encrypted values
- [ ] No decrypted sensitive data in events or storage
- [ ] Permissions set for each storage location
- [ ] Authorization checks before returning encrypted values

## Testing Anti-Patterns

Include tests that verify proper handling:

```javascript
describe("Anti-Pattern Prevention", function() {
    it("Should revert when unauthorized user accesses data", async function() {
        await expect(
            contract.connect(unauthorized).getEncryptedData(0)
        ).to.be.revertedWith("Not authorized");
    });

    it("Should allow contract to use encrypted values", async function() {
        // Verify FHE.allowThis() was called
        await contract.performOperation();
        // Should not revert
    });
});
```

## Resources

- [FHEVM Security Best Practices](https://docs.zama.ai/fhevm/guides/security)
- [Permission System Guide](https://docs.zama.ai/fhevm/fundamentals/acl)
- [BadContract.sol](BadContract.sol) - Example contract with anti-patterns

---

**Remember**: Following these patterns ensures your FHEVM contracts are secure, efficient, and maintainable!
