# What is FHEVM?

## Introduction

FHEVM (Fully Homomorphic Encryption Virtual Machine) is a revolutionary blockchain technology that enables smart contracts to perform computations on encrypted data without ever decrypting it.

## The Privacy Problem in Blockchain

Traditional blockchains like Ethereum have a fundamental privacy limitation:

```solidity
// Traditional contract - ALL DATA IS PUBLIC
contract TraditionalBank {
    mapping(address => uint256) public balances;  // ❌ Everyone can see balances

    function transfer(address to, uint256 amount) public {
        balances[msg.sender] -= amount;  // ❌ Transaction amounts visible
        balances[to] += amount;
    }
}
```

**Problems:**
- ❌ All balances are publicly visible
- ❌ All transaction amounts are public
- ❌ No financial privacy
- ❌ Sensitive data exposed to everyone

## The FHEVM Solution

FHEVM allows contracts to work with **encrypted data directly**:

```solidity
// FHEVM contract - DATA STAYS ENCRYPTED
import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";

contract PrivateBank is SepoliaConfig {
    mapping(address => euint32) private balances;  // ✅ Encrypted balances

    function transfer(address to, inEuint32 calldata amount, bytes calldata proof) public {
        euint32 encAmount = FHE.asEuint32(amount, proof);

        // ✅ Operations on encrypted data
        balances[msg.sender] = FHE.sub(balances[msg.sender], encAmount);
        balances[to] = FHE.add(balances[to], encAmount);

        // ✅ Data never decrypted!
    }
}
```

**Benefits:**
- ✅ Balances stay encrypted on-chain
- ✅ Operations happen on encrypted data
- ✅ Complete financial privacy
- ✅ Only authorized users can decrypt

## How It Works

### 1. Encryption
Data is encrypted on the client side before sending to the blockchain:

```javascript
// Client-side with fhevmjs
const fhevm = await createFhevmInstance();
const input = await fhevm.createEncryptedInput(contractAddress, userAddress);
input.add32(1000);  // Encrypt value 1000
const encrypted = await input.encrypt();

// Send encrypted data to contract
await contract.transfer(recipient, encrypted.handles[0], encrypted.inputProof);
```

### 2. On-Chain Computation
Smart contracts perform operations without decrypting:

```solidity
// Contract operates on encrypted values
euint32 newBalance = FHE.add(currentBalance, deposit);
// newBalance is still encrypted!
```

### 3. Selective Decryption
Only authorized parties can decrypt:

```solidity
// Grant permission to decrypt
FHE.allow(encryptedBalance, owner);

// Owner can now decrypt client-side
const decrypted = await fhevm.decrypt(contractAddress, encryptedBalance);
console.log("Balance:", decrypted);
```

## Key Concepts

### Encrypted Types

FHEVM provides encrypted equivalents of standard types:

| Standard Type | Encrypted Type | Description |
|--------------|----------------|-------------|
| `bool` | `ebool` | Encrypted boolean |
| `uint8` | `euint8` | Encrypted 8-bit integer |
| `uint16` | `euint16` | Encrypted 16-bit integer |
| `uint32` | `euint32` | Encrypted 32-bit integer |
| `uint64` | `euint64` | Encrypted 64-bit integer |
| `address` | `eaddress` | Encrypted address |

### FHE Operations

You can perform operations on encrypted data:

```solidity
// Arithmetic
euint32 sum = FHE.add(a, b);
euint32 diff = FHE.sub(a, b);
euint32 product = FHE.mul(a, b);

// Comparison
ebool isEqual = FHE.eq(a, b);
ebool isGreater = FHE.gt(a, b);

// Conditional
euint32 result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

### Permission System

FHEVM uses a permission system to control who can decrypt data:

```solidity
// Contract needs permission to use the value
FHE.allowThis(encryptedValue);

// User needs permission to decrypt
FHE.allow(encryptedValue, userAddress);
```

## Real-World Use Cases

### 1. Private DeFi
- Confidential trading
- Hidden order books
- Private lending
- Anonymous voting

```solidity
// Private voting
function vote(uint256 proposalId, inEuint32 calldata encryptedChoice, bytes calldata proof) external {
    ebool choice = FHE.asEbool(encryptedChoice, proof);
    votes[proposalId][msg.sender] = choice;  // Vote stays private!
}
```

### 2. Confidential Data Management
- Private medical records
- Encrypted employee data
- Confidential business information
- Personal identity data

```solidity
// Private medical records
struct MedicalRecord {
    ebool hasCondition;      // Encrypted
    euint32 treatmentCode;   // Encrypted
    address patient;         // Public
}
```

### 3. Blind Auctions
- Sealed-bid auctions
- Hidden bids until reveal
- Fair price discovery

```solidity
function submitBid(inEuint32 calldata encryptedBid, bytes calldata proof) external {
    euint32 bid = FHE.asEuint32(encryptedBid, proof);
    bids[msg.sender] = bid;  // Bid amount hidden from other bidders
}
```

## Advantages of FHEVM

### Privacy by Default
- Data encrypted at rest and in computation
- No trusted parties needed
- Users control their data

### Smart Contract Compatibility
- Uses familiar Solidity syntax
- Similar to regular smart contracts
- Easy migration path

### Composability
- Works with other contracts
- Can be integrated into existing dApps
- Supports complex workflows

### Security
- Cryptographically secure
- No data leakage
- Verifiable computations

## Limitations

### Computational Cost
- FHE operations cost more gas than plain operations
- Performance trade-off for privacy

### Learning Curve
- New concepts to learn (encrypted types, permissions)
- Different patterns than traditional contracts

### Current Maturity
- Newer technology
- Evolving best practices
- Growing ecosystem

## FHEVM vs Other Privacy Solutions

| Solution | How It Works | Pros | Cons |
|----------|-------------|------|------|
| **FHEVM** | Encrypted computation | Full privacy, composable | Higher gas costs |
| **Zero-Knowledge Proofs** | Prove without revealing | Efficient verification | Complex circuits |
| **Secure Enclaves** | Trusted hardware | Fast computation | Requires trust |
| **Mix Networks** | Transaction mixing | Simple | Limited privacy |

## Getting Started

### 1. Learn the Basics
- Understand encrypted types
- Learn FHE operations
- Study permission system

### 2. Try Examples
- Start with simple counter
- Progress to access control
- Build real applications

### 3. Use the Tools
- Hardhat for development
- fhevmjs for client integration
- Zama testnet for deployment

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  ┌──────────────┐                                   │
│  │   fhevmjs    │ ← Encrypt/Decrypt                │
│  └──────────────┘                                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓ Encrypted Data + Proof
┌─────────────────────────────────────────────────────┐
│              Blockchain (FHEVM)                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Smart Contract                        │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  euint32 balance                        │  │  │
│  │  │  FHE.add(balance, deposit)              │  │  │
│  │  │  FHE.allow(balance, user)              │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                     ↑
                     │ Encrypted Storage
┌─────────────────────────────────────────────────────┐
│              Blockchain State                        │
│          (All data encrypted)                        │
└─────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Encryption Binding
Values are bound to specific `[contract, user]` pairs:
- Prevents unauthorized access
- Ensures proper ownership
- Maintains security

### 2. Input Proofs
Zero-knowledge proofs verify encrypted inputs:
- Proves correct encryption
- Prevents manipulation
- Maintains integrity

### 3. Permission Management
Explicit permission grants for decryption:
- Fine-grained control
- User privacy
- Access transparency

## Next Steps

1. **Quick Start**: [5-minute tutorial](quick-start.md)
2. **Basic Examples**: [Simple contracts](basic/fhe-counter.md)
3. **Advanced Patterns**: [Production examples](advanced/privacy-training-record.md)
4. **API Reference**: [Complete API](api/fhevm-solidity.md)

## Resources

- **Documentation**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **GitHub**: [https://github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)
- **Discord**: [https://discord.gg/zama](https://discord.gg/zama)
- **Examples**: [https://github.com/zama-ai/fhevm-examples](https://github.com/zama-ai/fhevm-examples)

---

**FHEVM makes privacy-preserving smart contracts a reality. Start building confidential dApps today!**
