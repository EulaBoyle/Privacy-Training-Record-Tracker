# Encrypted Storage Example

## Overview

This example demonstrates how to store and manage multiple encrypted values in a smart contract, showcasing different encrypted data types and their usage.

## Concepts Demonstrated

- **Multiple Encrypted Types**: `ebool`, `euint8`, `euint32`, `euint64`
- **Encrypted Structs**: Storing encrypted data in structures
- **Access Control**: Role-based access to encrypted data
- **Batch Operations**: Working with multiple encrypted values

## Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint8, euint32, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedStorage is SepoliaConfig {
    struct EncryptedData {
        ebool isActive;
        euint8 level;
        euint32 score;
        euint64 timestamp;
    }

    mapping(address => EncryptedData) private userData;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function storeData(
        bool _isActive,
        uint8 _level,
        uint32 _score,
        uint64 _timestamp
    ) external {
        EncryptedData storage data = userData[msg.sender];

        data.isActive = FHE.asEbool(_isActive);
        data.level = FHE.asEuint8(_level);
        data.score = FHE.asEuint32(_score);
        data.timestamp = FHE.asEuint64(_timestamp);

        // Set permissions for all fields
        FHE.allowThis(data.isActive);
        FHE.allowThis(data.level);
        FHE.allowThis(data.score);
        FHE.allowThis(data.timestamp);

        FHE.allow(data.isActive, msg.sender);
        FHE.allow(data.level, msg.sender);
        FHE.allow(data.score, msg.sender);
        FHE.allow(data.timestamp, msg.sender);
    }

    function getIsActive() external view returns (ebool) {
        return userData[msg.sender].isActive;
    }

    function getLevel() external view returns (euint8) {
        return userData[msg.sender].level;
    }

    function getScore() external view returns (euint32) {
        return userData[msg.sender].score;
    }

    function getTimestamp() external view returns (euint64) {
        return userData[msg.sender].timestamp;
    }
}
```

## Key Patterns

### 1. Different Encrypted Types
```solidity
ebool isActive;      // Encrypted boolean
euint8 level;        // Encrypted 8-bit integer (0-255)
euint32 score;       // Encrypted 32-bit integer
euint64 timestamp;   // Encrypted 64-bit integer
```

### 2. Encrypted Structs
```solidity
struct EncryptedData {
    ebool isActive;
    euint8 level;
    euint32 score;
    euint64 timestamp;
}
```

### 3. Batch Permission Setting
```solidity
// Set permissions for multiple fields
FHE.allowThis(data.isActive);
FHE.allowThis(data.level);
FHE.allow(data.isActive, user);
FHE.allow(data.level, user);
```

## Usage Example

```javascript
// Store encrypted data
await contract.storeData(
  true,      // isActive
  5,         // level
  1000,      // score
  Date.now() // timestamp
);

// Retrieve and decrypt
const encryptedScore = await contract.getScore();
const score = await fhevm.decrypt(contractAddress, encryptedScore);
console.log("Score:", score);
```

## Type Selection Guide

| Type | Range | Use Case |
|------|-------|----------|
| `ebool` | true/false | Flags, status |
| `euint8` | 0-255 | Small numbers, levels |
| `euint16` | 0-65535 | Medium numbers |
| `euint32` | 0-4B | Large numbers, scores |
| `euint64` | 0-18E | Very large numbers, timestamps |

## Learning Points

✅ **DO:**
- Choose the smallest type that fits your data range
- Set permissions for ALL encrypted fields
- Use structs to organize related encrypted data

❌ **DON'T:**
- Use larger types than necessary (wastes gas)
- Forget permissions on any encrypted field
- Mix encrypted and non-encrypted data carelessly

## Running This Example

```bash
npm run create-example
# Select "Encrypted Storage"
cd encrypted-storage-example
npm install && npm test
```

---

**Category**: Encryption
**Difficulty**: Intermediate
**Concepts**: Multiple types, Structs, Batch operations
