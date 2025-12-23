// Content continues with comprehensive Input Proof Patterns documentation
# Input Proof Patterns Guide

## Overview

This guide provides comprehensive patterns for handling input proofs in FHEVM. Input proofs are cryptographic proofs that validate encrypted inputs sent from clients to smart contracts. Proper handling ensures security and functionality.

## What Are Input Proofs?

Input proofs are zero-knowledge proofs that verify:
1. The encrypted input is properly formed
2. The sender knows the plaintext value
3. The encryption was performed correctly
4. The value hasn't been tampered with

```
Plaintext Value
      ↓
   Encrypt
      ↓
Encrypted Value + Input Proof
      ↓
Send to Contract
      ↓
Contract Validates Proof
      ↓
Convert to euintX Type
```

## All Encrypted Types

### euint8 (8-bit unsigned integer, 0-255)
```solidity
function storeEuint8(
    inEuint8 calldata encryptedInput,
    bytes calldata inputProof
) external {
    require(inputProof.length > 0, "Proof cannot be empty");
    euint8 value = FHE.asEuint8(encryptedInput, inputProof);

    smallValues[msg.sender] = value;
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
}
```

**Use Cases:** Status codes, small enumerations, flags

### euint16 (16-bit unsigned integer, 0-65535)
```solidity
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
}
```

**Use Cases:** Scores, ratings, small quantities

### euint32 (32-bit unsigned integer, 0-4,294,967,295)
```solidity
function storeEuint32(
    inEuint32 calldata encryptedInput,
    bytes calldata inputProof
) external {
    require(encryptedInput.length > 0, "Input cannot be empty");
    require(inputProof.length >= 32, "Proof too short");
    require(inputProof.length <= 1024, "Proof too long");

    euint32 value = FHE.asEuint32(encryptedInput, inputProof);
    largeValues[msg.sender] = value;

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
}
```

**Use Cases:** Prices, timestamps, quantities, balances (most common)

### euint64 (64-bit unsigned integer, 0-18,446,744,073,709,551,615)
```solidity
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
}
```

**Use Cases:** Large balances, timestamps, scientific values

### eaddress (Encrypted Ethereum address)
```solidity
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
}
```

**Use Cases:** Private recipients, hidden ownership, confidential routing

### ebool (Encrypted boolean)
```solidity
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
}
```

**Use Cases:** Status flags, voting outcomes, conditional triggers

## Input Proof Validation Patterns

### Pattern 1: Basic Validation
```solidity
function storeWithBasicValidation(
    inEuint32 calldata encryptedValue,
    bytes calldata inputProof
) external {
    // Check inputs exist
    require(encryptedValue.length > 0, "Empty encrypted value");
    require(inputProof.length > 0, "Empty proof");

    // Process
    euint32 value = FHE.asEuint32(encryptedValue, inputProof);

    // Store
    largeValues[msg.sender] = value;
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
}
```

### Pattern 2: Size Validation
```solidity
function storeWithSizeValidation(
    inEuint32 calldata encryptedValue,
    bytes calldata inputProof
) external {
    // Validate sizes
    require(encryptedValue.length > 0, "Empty input");
    require(inputProof.length >= 32, "Proof too short");
    require(inputProof.length <= 1024, "Proof too long (potential DoS)");

    // Process
    euint32 value = FHE.asEuint32(encryptedValue, inputProof);
    largeValues[msg.sender] = value;

    // Permissions
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
}
```

### Pattern 3: Safe Processing with Try-Catch
```solidity
function safeProcess(
    inEuint32 calldata encryptedValue,
    bytes calldata inputProof
) external returns (bool success) {
    try this.storeEuint32(encryptedValue, inputProof) {
        validProofsCount[msg.sender]++;
        return true;
    } catch {
        invalidProofsCount[msg.sender]++;
        emit ProofRejected(msg.sender, "Processing failed");
        return false;
    }
}
```

### Pattern 4: Proof Metadata Tracking
```solidity
mapping(address => bytes) public lastProofUsed;
mapping(address => uint256) public proofTimestamps;
mapping(address => uint256) public validProofsCount;

function storeWithMetadata(
    inEuint32 calldata encryptedValue,
    bytes calldata inputProof
) external {
    euint32 value = FHE.asEuint32(encryptedValue, inputProof);

    largeValues[msg.sender] = value;
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    // Track proof metadata
    lastProofUsed[msg.sender] = inputProof;
    proofTimestamps[msg.sender] = block.timestamp;
    validProofsCount[msg.sender]++;

    emit ProofValidated(msg.sender, keccak256(inputProof));
}
```

## Batch Operations with Proofs

### Pattern 1: Multiple Values, Multiple Proofs
```solidity
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
    FHE.allowThis(enc1);
    FHE.allow(enc1, msg.sender);

    // Process second value
    euint32 enc2 = FHE.asEuint32(value2, proof2);
    FHE.allowThis(enc2);
    FHE.allow(enc2, msg.sender);

    // Combine
    euint32 sum = FHE.add(enc1, enc2);
    FHE.allowThis(sum);
    FHE.allow(sum, msg.sender);

    validProofsCount[msg.sender] += 2;
}
```

### Pattern 2: Dynamic Batch Processing
```solidity
function processBatchDynamic(
    inEuint32[] calldata values,
    bytes[] calldata proofs
) external {
    require(values.length == proofs.length, "Length mismatch");
    require(values.length > 0 && values.length <= 10, "Invalid batch size");

    for (uint256 i = 0; i < values.length; i++) {
        require(values[i].length > 0, "Empty value");
        require(proofs[i].length > 0, "Empty proof");

        euint32 value = FHE.asEuint32(values[i], proofs[i]);

        // Store or aggregate
        if (i == 0) {
            largeValues[msg.sender] = value;
        } else {
            largeValues[msg.sender] = FHE.add(largeValues[msg.sender], value);
        }

        // Update permissions each iteration
        FHE.allowThis(largeValues[msg.sender]);
        FHE.allow(largeValues[msg.sender], msg.sender);
    }

    validProofsCount[msg.sender] += values.length;
}
```

## Common Mistakes and Solutions

### Mistake 1: Forgetting Proof Validation
```solidity
// ❌ WRONG
function wrongPatternNoValidation(
    inEuint32 calldata encryptedValue,
    bytes calldata inputProof
) external {
    euint32 value = FHE.asEuint32(encryptedValue, inputProof);
    largeValues[msg.sender] = value;
    FHE.allowThis(value);
    // Missing: validation, user permission
}

// ✅ CORRECT
function correctPattern(
    inEuint32 calldata encryptedValue,
    bytes calldata inputProof
) external {
    require(encryptedValue.length > 0, "Empty input");
    require(inputProof.length >= 32, "Proof too short");

    euint32 value = FHE.asEuint32(encryptedValue, inputProof);
    largeValues[msg.sender] = value;

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    validProofsCount[msg.sender]++;
}
```

### Mistake 2: Not Setting User Permissions
```solidity
// ❌ WRONG
FHE.allowThis(value); // Only contract can use
// Missing: FHE.allow(value, msg.sender);

// ✅ CORRECT
FHE.allowThis(value);
FHE.allow(value, msg.sender); // User can decrypt
```

### Mistake 3: Reusing Proofs Incorrectly
```solidity
// ⚠️ SECURITY ISSUE
function reuseProof(
    inEuint32 calldata value1,
    inEuint32 calldata value2,
    bytes calldata sharedProof // Same proof for both
) external {
    // This may work but creates security concerns
    euint32 enc1 = FHE.asEuint32(value1, sharedProof);
    euint32 enc2 = FHE.asEuint32(value2, sharedProof);
    // ⚠️ Each input should have its own proof
}

// ✅ CORRECT
function separateProofs(
    inEuint32 calldata value1,
    inEuint32 calldata value2,
    bytes calldata proof1,
    bytes calldata proof2
) external {
    euint32 enc1 = FHE.asEuint32(value1, proof1);
    euint32 enc2 = FHE.asEuint32(value2, proof2);
    // ✅ Each input has unique proof
}
```

### Mistake 4: Missing Size Checks (DoS Risk)
```solidity
// ❌ WRONG - No size limit
function vulnerable(
    inEuint32 calldata encryptedValue,
    bytes calldata inputProof
) external {
    // Attacker could send huge proof, consuming gas
    euint32 value = FHE.asEuint32(encryptedValue, inputProof);
}

// ✅ CORRECT - Size limits
function protected(
    inEuint32 calldata encryptedValue,
    bytes calldata inputProof
) external {
    require(inputProof.length >= 32, "Too short");
    require(inputProof.length <= 1024, "Too long");
    euint32 value = FHE.asEuint32(encryptedValue, inputProof);
}
```

## Client-Side Usage (JavaScript/TypeScript)

### Creating Encrypted Inputs with Proofs

```javascript
import { createInstances } from 'fhevmjs';
import { ethers } from 'ethers';

// Initialize instances
const instances = await createInstances(contractAddress, ethers);

// Create input for euint8
const input8 = instances.user1.createEncryptedInput(contractAddress, userAddress);
const encrypted8 = input8.add8(42);
const result8 = encrypted8.encrypt();

await contract.storeEuint8(
  result8.handles[0],
  result8.inputProof
);

// Create input for euint16
const input16 = instances.user1.createEncryptedInput(contractAddress, userAddress);
const encrypted16 = input16.add16(30000);
const result16 = encrypted16.encrypt();

await contract.storeEuint16(
  result16.handles[0],
  result16.inputProof
);

// Create input for euint32
const input32 = instances.user1.createEncryptedInput(contractAddress, userAddress);
const encrypted32 = input32.add32(1234567);
const result32 = encrypted32.encrypt();

await contract.storeEuint32(
  result32.handles[0],
  result32.inputProof
);

// Create input for euint64
const input64 = instances.user1.createEncryptedInput(contractAddress, userAddress);
const encrypted64 = input64.add64(9999999999n);
const result64 = encrypted64.encrypt();

await contract.storeEuint64(
  result64.handles[0],
  result64.inputProof
);

// Create input for eaddress
const inputAddr = instances.user1.createEncryptedInput(contractAddress, userAddress);
const encryptedAddr = inputAddr.addAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
const resultAddr = encryptedAddr.encrypt();

await contract.storeEaddress(
  resultAddr.handles[0],
  resultAddr.inputProof
);

// Create input for ebool
const inputBool = instances.user1.createEncryptedInput(contractAddress, userAddress);
const encryptedBool = inputBool.addBool(true);
const resultBool = encryptedBool.encrypt();

await contract.storeEbool(
  resultBool.handles[0],
  resultBool.inputProof
);
```

### Batch Operations
```javascript
// Create multiple inputs
const input1 = instances.user1.createEncryptedInput(contractAddress, userAddress);
const enc1 = input1.add32(100);
const result1 = enc1.encrypt();

const input2 = instances.user1.createEncryptedInput(contractAddress, userAddress);
const enc2 = input2.add32(200);
const result2 = enc2.encrypt();

// Send batch
await contract.processBatch(
  result1.handles[0],
  result2.handles[0],
  result1.inputProof,
  result2.inputProof
);
```

## Testing Input Proofs

### Test 1: Valid Proof Processing
```javascript
it("Should process valid euint32 with proof", async function () {
  const input = instances.user1.createEncryptedInput(contractAddress, user1.address);
  const encrypted = input.add32(1234567);
  const result = encrypted.encrypt();

  const tx = await contract.connect(user1).storeEuint32(
    result.handles[0],
    result.inputProof
  );
  await tx.wait();

  const [validCount] = await contract.getProofStats(user1.address);
  expect(validCount).to.equal(1);
});
```

### Test 2: Empty Proof Rejection
```javascript
it("Should reject empty proof", async function () {
  const input = instances.user1.createEncryptedInput(contractAddress, user1.address);
  const encrypted = input.add32(1234567);
  const result = encrypted.encrypt();

  await expect(
    contract.connect(user1).storeEuint32(result.handles[0], "0x")
  ).to.be.revertedWith("Proof cannot be empty");
});
```

### Test 3: Proof Size Validation
```javascript
it("Should reject oversized proof", async function () {
  const input = instances.user1.createEncryptedInput(contractAddress, user1.address);
  const encrypted = input.add32(500);
  const result = encrypted.encrypt();

  const oversizedProof = "0x" + "FF".repeat(2000);
  const isValid = await contract.validateProofSize(result.handles[0], oversizedProof);

  expect(isValid).to.equal(false);
});
```

### Test 4: Batch Processing
```javascript
it("Should process batch with multiple proofs", async function () {
  const input1 = instances.user1.createEncryptedInput(contractAddress, user1.address);
  const enc1 = input1.add32(100);
  const result1 = enc1.encrypt();

  const input2 = instances.user1.createEncryptedInput(contractAddress, user1.address);
  const enc2 = input2.add32(200);
  const result2 = enc2.encrypt();

  await contract.connect(user1).processBatch(
    result1.handles[0],
    result2.handles[0],
    result1.inputProof,
    result2.inputProof
  );

  const [validCount] = await contract.getProofStats(user1.address);
  expect(validCount).to.equal(2);
});
```

## Proof Size Guidelines

| Type | Typical Proof Size | Recommended Max |
|------|-------------------|-----------------|
| euint8 | 128-256 bytes | 512 bytes |
| euint16 | 128-256 bytes | 512 bytes |
| euint32 | 128-256 bytes | 512 bytes |
| euint64 | 256-512 bytes | 1024 bytes |
| eaddress | 256-512 bytes | 1024 bytes |
| ebool | 128-256 bytes | 512 bytes |

**Note:** Actual sizes depend on the proof system. Always validate to prevent DoS attacks.

## Performance Considerations

### Gas Costs
- **Smaller proofs**: Lower gas costs
- **Larger proofs**: Higher gas costs
- **Batch operations**: Amortized cost per item

### Optimization Tips
1. **Use smallest type possible**: euint8 < euint16 < euint32 < euint64
2. **Batch when possible**: Reduces per-item overhead
3. **Validate sizes**: Prevents gas DoS
4. **Reuse instances**: Don't recreate encrypted inputs unnecessarily

## Related Examples

- **UserDecrypt.sol**: Using proofs with user decryption
- **PublicDecrypt.sol**: Proofs in public decryption scenarios
- **ConfidentialERC20.sol**: Proofs in token transfers
- **SimpleArithmetic.sol**: Basic proof usage patterns

## Security Checklist

- [ ] Validate proof is not empty
- [ ] Check proof size (min and max)
- [ ] Verify encrypted input is not empty
- [ ] Set `FHE.allowThis()` for contract operations
- [ ] Set `FHE.allow(value, user)` for user decryption
- [ ] Track proof metadata if needed
- [ ] Handle errors gracefully
- [ ] Prevent proof reuse if security-critical
- [ ] Limit batch sizes to prevent DoS
- [ ] Emit events for proof processing

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Proof cannot be empty" | Ensure inputProof has data |
| "Proof too short" | Check minimum proof length (≥32 bytes) |
| Gas exceeded | Reduce proof size or batch size |
| User cannot decrypt | Missing `FHE.allow(value, user)` |
| Invalid proof error | Verify proof matches encrypted input |
| Batch processing fails | Check all proofs are valid |

## Summary

Input proofs are essential for FHEVM security:

1. **Always validate** proof size and input presence
2. **Set permissions** correctly for both contract and user
3. **Track metadata** for debugging and analytics
4. **Use appropriate types** to minimize gas costs
5. **Test thoroughly** with various proof scenarios
6. **Handle errors** gracefully to prevent failures

Proper input proof handling ensures both security and functionality in FHEVM applications.
