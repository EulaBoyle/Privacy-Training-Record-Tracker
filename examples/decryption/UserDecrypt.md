# User Decryption Example

## Overview

This example demonstrates how users can decrypt their own encrypted data client-side in FHEVM applications. User decryption is the most common pattern where data owners decrypt values they have permission for.

## Key Concepts

### 1. Permission Management for Decryption

When storing encrypted data, you must set two permissions:

```solidity
// 1. Allow the contract to perform operations
FHE.allowThis(encryptedValue);

// 2. Allow the user to decrypt client-side
FHE.allow(encryptedValue, msg.sender);
```

Without `FHE.allow(value, user)`, the user cannot decrypt the data even if they stored it.

### 2. Decryption Flow

```
User encrypts data locally
         ↓
User sends encrypted data to contract
         ↓
Contract stores encrypted data with user permission
         ↓
User retrieves encrypted data from contract
         ↓
User decrypts data locally using fhevmjs
```

### 3. Permission Updates After Operations

When encrypted values are modified through operations, new permissions must be set:

```solidity
// Store initial value
euint64 balance = FHE.asEuint64(encryptedInput, inputProof);
userBalances[msg.sender] = balance;
FHE.allow(balance, msg.sender);

// Later: modify the value
euint64 newBalance = FHE.add(userBalances[msg.sender], amount);
userBalances[msg.sender] = newBalance;

// IMPORTANT: Update permissions for new value
FHE.allow(newBalance, msg.sender);
```

## Smart Contract Functions

### Store Balance
```solidity
function storeBalance(
    inEuint64 calldata encryptedBalance,
    bytes calldata inputProof
) external
```
- Stores encrypted balance with user decryption permission
- User can later decrypt their balance client-side

### Add to Balance
```solidity
function addToBalance(
    inEuint64 calldata encryptedAmount,
    bytes calldata inputProof
) external
```
- Adds encrypted amount to stored balance
- Returns updated encrypted balance
- User can decrypt new balance

### Share Data with Viewer
```solidity
function shareData(
    bytes32 dataId,
    inEuint32 calldata encryptedValue,
    address viewer,
    bytes calldata inputProof
) external
```
- Shares encrypted data with specific viewer
- Both owner and viewer can decrypt
- Owner retains full control

### Transfer Balance
```solidity
function transferBalance(
    address to,
    inEuint64 calldata encryptedAmount,
    bytes calldata inputProof
) external
```
- Transfers balance between users
- Both parties get decryption permission for their new balances
- Encrypted, so amounts remain private

### Conditional Reward
```solidity
function conditionalReward(
    inEuint32 calldata encThreshold,
    inEuint64 calldata encHighValue,
    inEuint64 calldata encLowValue,
    bytes calldata thresholdProof,
    bytes calldata highProof,
    bytes calldata lowProof
) external view returns (euint64)
```
- Returns encrypted reward based on hidden condition
- User can decrypt reward without revealing comparison result

## Usage Example (JavaScript/TypeScript)

### 1. Store Data

```javascript
import { createInstances } from 'fhevmjs';
import { ethers } from 'ethers';

// Initialize instances
const instances = await createInstances(contractAddress, ethers);

// Create encrypted input
const input = instances.user1.createEncryptedInput(contractAddress, userAddress);
const encryptedBalance = input.add64(1000); // 1000 tokens
const encrypted = encryptedBalance.encrypt();

// Send to contract
const tx = await contract.connect(signer).storeBalance(
  encrypted.handles[0],
  encrypted.inputProof
);
await tx.wait();
```

### 2. Retrieve and Decrypt Data

```javascript
// Retrieve encrypted balance
const encryptedResult = await contract.connect(signer).getBalance();

// Decrypt client-side using user's private key
const decryptedBalance = await instances.user1.decrypt64(encryptedResult);
console.log("Your balance:", decryptedBalance);
```

### 3. Add to Balance and Decrypt

```javascript
// Create encrypted amount to add
const input = instances.user1.createEncryptedInput(contractAddress, userAddress);
const encryptedAmount = input.add64(500); // Add 500 tokens
const encrypted = encryptedAmount.encrypt();

// Add to balance
const tx = await contract.connect(signer).addToBalance(
  encrypted.handles[0],
  encrypted.inputProof
);
await tx.wait();

// Retrieve and decrypt new balance
const newEncrypted = await contract.connect(signer).getBalance();
const newBalance = await instances.user1.decrypt64(newEncrypted);
console.log("New balance:", newBalance); // Should be 1500
```

### 4. Share Data with Viewer

```javascript
// Owner encrypts and shares data
const input = instances.owner.createEncryptedInput(contractAddress, ownerAddress);
const encryptedData = input.add32(secretValue);
const encrypted = encryptedData.encrypt();

const dataId = ethers.id("shared_secret");
await contract.connect(ownerSigner).shareData(
  dataId,
  encrypted.handles[0],
  viewerAddress,
  encrypted.inputProof
);

// Viewer can decrypt
const sharedData = await contract.connect(viewerSigner).getSharedData(dataId);
const decryptedData = await instances.viewer.decrypt32(sharedData);
console.log("Shared data:", decryptedData);
```

### 5. Transfer Balance

```javascript
// Sender encrypts transfer amount
const input = instances.sender.createEncryptedInput(contractAddress, senderAddress);
const encryptedAmount = input.add64(200); // Transfer 200
const encrypted = encryptedAmount.encrypt();

// Execute transfer
const tx = await contract.connect(senderSigner).transferBalance(
  recipientAddress,
  encrypted.handles[0],
  encrypted.inputProof
);
await tx.wait();

// Both can decrypt their new balances
const senderBalance = await contract.connect(senderSigner).getBalance();
const decryptedSenderBalance = await instances.sender.decrypt64(senderBalance);

const recipientBalance = await contract.connect(recipientSigner).getBalance();
const decryptedRecipientBalance = await instances.recipient.decrypt64(recipientBalance);

console.log("Sender new balance:", decryptedSenderBalance);
console.log("Recipient new balance:", decryptedRecipientBalance);
```

## Common Patterns

### Pattern 1: User Storage and Decryption
```solidity
// Store
euint64 value = FHE.asEuint64(encryptedInput, inputProof);
userValues[msg.sender] = value;
FHE.allowThis(value);
FHE.allow(value, msg.sender); // User can decrypt

// Retrieve
function getValue() external view returns (euint64) {
    return userValues[msg.sender];
}
```

Client decrypts the returned value.

### Pattern 2: Shared Access with Multiple Viewers
```solidity
mapping(address => euint64) private secret;
mapping(address => address[]) private viewers;

function shareWith(address viewer, inEuint64 calldata encryptedSecret, bytes calldata proof) external {
    euint64 value = FHE.asEuint64(encryptedSecret, proof);
    secret[msg.sender] = value;

    FHE.allow(value, msg.sender);    // Owner
    FHE.allow(value, viewer);        // Viewer
}
```

### Pattern 3: Chained Operations with Permission Updates
```solidity
function chainOperations(
    inEuint64 calldata encryptedAmount,
    bytes calldata inputProof
) external {
    euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

    // Step 1: Add
    euint64 temp = FHE.add(userBalance[msg.sender], amount);
    // IMPORTANT: Don't save yet, permissions not updated

    // Step 2: Multiply
    euint64 result = FHE.mul(temp, 2);

    // Save final result with new permissions
    userBalance[msg.sender] = result;
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);
}
```

### Pattern 4: Conditional Operations
```solidity
function conditionalValue(
    inEuint32 calldata encryptedThreshold,
    inEuint64 calldata encryptedHigh,
    inEuint64 calldata encryptedLow,
    bytes calldata thresholdProof,
    bytes calldata highProof,
    bytes calldata lowProof
) external view returns (euint64) {
    euint32 threshold = FHE.asEuint32(encryptedThreshold, thresholdProof);
    euint64 high = FHE.asEuint64(encryptedHigh, highProof);
    euint64 low = FHE.asEuint64(encryptedLow, lowProof);

    // All comparisons return encrypted booleans
    ebool isHigh = FHE.gte(userScore[msg.sender], threshold);

    // Select based on condition - result is encrypted
    return FHE.select(isHigh, high, low);
}
```

User can decrypt to see selected value without revealing comparison.

## Security Best Practices

### 1. Always Set User Permission
```solidity
// CORRECT
FHE.allow(value, msg.sender); // User can decrypt

// WRONG - User cannot decrypt
// FHE.allowThis(value); // Missing user permission
```

### 2. Update Permissions After Operations
```solidity
// CORRECT
euint64 newValue = FHE.add(oldValue, amount);
userValues[msg.sender] = newValue;
FHE.allow(newValue, msg.sender); // Update permissions

// WRONG - New value has no user permission
// userValues[msg.sender] = newValue; // Missing permission update
```

### 3. Handle Multiple Data Types
```solidity
// Different types need different decryption in JavaScript
euint32 score = ...;    // Decrypt with decrypt32
euint64 balance = ...;  // Decrypt with decrypt64
ebool status = ...;     // Decrypt with decryptBool
eaddress addr = ...;    // Decrypt with decryptAddress
```

### 4. Batch Operations
```solidity
// When doing multiple operations, track permissions carefully
function batchUpdate(inEuint64[] calldata values, bytes[] calldata proofs) external {
    for (uint i = 0; i < values.length; i++) {
        euint64 val = FHE.asEuint64(values[i], proofs[i]);
        userValues[msg.sender] = FHE.add(userValues[msg.sender], val);
        // Update permissions after EACH operation
        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);
    }
}
```

## Testing

See `UserDecrypt.test.js` for comprehensive test examples covering:
- Storing and retrieving encrypted values
- Adding to balances
- Shared data access
- Balance transfers
- Multiple data types
- Conditional operations

## Troubleshooting

### Problem: User Cannot Decrypt Value
**Solution:** Ensure `FHE.allow(value, userAddress)` was called

### Problem: New Balance Undecryptable After Operation
**Solution:** Remember to update permissions after FHE operations like `FHE.add`, `FHE.mul`, etc.

### Problem: Multiple Viewers Cannot Decrypt Shared Data
**Solution:** Call `FHE.allow(value, viewerAddress)` for each viewer

### Problem: Transfer Creates Undecryptable Balances
**Solution:** Set permissions for both sender and recipient after transfer

## Advanced: Custom Permission Logic

```solidity
// Time-based permission
function grantTemporaryAccess(
    address user,
    euint64 value,
    uint256 durationSeconds
) internal {
    FHE.allow(value, user);
    // Note: FHEVM doesn't support time-based revocation
    // Implement externally if needed
}

// Role-based permission
modifier onlyAllowed(bytes32 role) {
    require(hasRole(role, msg.sender), "Not authorized");
    _;
}

function shareIfAuthorized(
    bytes32 role,
    euint64 value,
    address viewer
) external onlyAllowed(role) {
    FHE.allow(value, viewer);
}
```

## Related Examples

- **PublicDecrypt.sol**: Public decryption with threshold gates
- **InputProofPatterns.sol**: Detailed input proof handling
- **ConfidentialERC20.sol**: Real-world decryption patterns in token transfers
- **Comparison.sol**: Conditional logic with encrypted booleans

## Summary

User decryption is the fundamental pattern in FHEVM:

1. **Store** encrypted data with user permission
2. **Operate** on encrypted data in contract
3. **Update** permissions after operations
4. **Retrieve** encrypted data from contract
5. **Decrypt** data client-side using fhevmjs

Always remember: **permissions are critical to security and functionality**.
