# FHE Counter Example

## Overview

This example demonstrates a simple encrypted counter using FHEVM, showcasing the fundamental concepts of Fully Homomorphic Encryption in smart contracts.

## Concepts Demonstrated

- **Encrypted State Storage**: Using `euint32` for encrypted integer storage
- **FHE Operations**: Addition on encrypted values with `FHE.add()`
- **Permission Management**: Proper use of `FHE.allow()` and `FHE.allowThis()`
- **Input Proofs**: Handling encrypted inputs with proof verification

## Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FHECounter is SepoliaConfig {
    euint32 private counter;
    address public owner;

    event CounterIncremented(address indexed user);

    constructor() {
        owner = msg.sender;
        counter = FHE.asEuint32(0);
        FHE.allowThis(counter);
    }

    function increment(inEuint32 calldata inputHandle, bytes calldata inputProof) external {
        euint32 value = FHE.asEuint32(inputHandle, inputProof);
        counter = FHE.add(counter, value);

        FHE.allowThis(counter);
        FHE.allow(counter, msg.sender);

        emit CounterIncremented(msg.sender);
    }

    function getCounter() external view returns (euint32) {
        return counter;
    }
}
```

## Key Patterns

### 1. Creating Encrypted Values
```solidity
counter = FHE.asEuint32(0);
```
Creates an encrypted 32-bit unsigned integer with value 0.

### 2. Setting Permissions
```solidity
FHE.allowThis(counter);        // Contract can use this value
FHE.allow(counter, msg.sender); // User can decrypt this value
```

### 3. FHE Operations
```solidity
counter = FHE.add(counter, value);
```
Performs addition on encrypted values without decrypting them.

## Usage Example

```javascript
// Client-side encryption
const fhevm = await createFhevmInstance();
const input = await fhevm.createEncryptedInput(contractAddress, userAddress);
input.add32(5); // Add value 5
const encryptedInput = await input.encrypt();

// Call contract
await contract.increment(
  encryptedInput.handles[0],
  encryptedInput.inputProof
);

// Decrypt result
const encryptedCounter = await contract.getCounter();
const decryptedValue = await fhevm.decrypt(contractAddress, encryptedCounter);
console.log("Counter value:", decryptedValue);
```

## Learning Points

✅ **DO:**
- Always call `FHE.allowThis()` for values the contract needs to use
- Always call `FHE.allow(value, user)` for values users need to decrypt
- Use appropriate encrypted types (`euint8`, `euint32`, `ebool`, etc.)

❌ **DON'T:**
- Forget to set permissions (will cause decryption failures)
- Try to use encrypted values in view functions without proper setup
- Mix encrypted and non-encrypted values in operations

## Running This Example

```bash
# Clone the template
npm run create-example

# Select "FHE Counter" as the example
# Navigate to the created directory
cd fhe-counter-example

# Install dependencies
npm install

# Compile
npm run compile

# Test
npm test

# Deploy
npm run deploy
```

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHE Operations Reference](https://docs.zama.ai/fhevm/fundamentals/types)
- [Permission System Guide](https://docs.zama.ai/fhevm/fundamentals/acl)

---

**Category**: Basic
**Difficulty**: Beginner
**Concepts**: Encrypted storage, FHE operations, Permissions
