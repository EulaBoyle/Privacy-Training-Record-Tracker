# FHEVM Examples Guide

## Overview

This repository includes a comprehensive collection of FHEVM examples covering all aspects of privacy-preserving smart contract development. Each example is production-ready with tests, documentation, and best practices.

## Repository Statistics

- **Total Examples**: 15+ smart contracts
- **Lines of Code**: ~8,000+ lines
- **Test Coverage**: 150+ test cases
- **Documentation Pages**: 20+ guides
- **Categories**: 7 (Basic, Encryption, Decryption, Input Proofs, Access Control, Advanced, OpenZeppelin)

## Examples by Category

### 1. Basic Examples

Perfect starting point for FHEVM beginners.

#### FHECounter.sol
**Purpose**: Simple encrypted counter demonstrating basic FHEVM patterns
**Concepts**: `euint32`, `FHE.add()`, permissions, input proofs
**Lines**: ~150
**Tests**: 10+
**Difficulty**: ⭐ Beginner

```solidity
function increment(inEuint32 calldata inputHandle, bytes calldata inputProof) external {
    euint32 value = FHE.asEuint32(inputHandle, inputProof);
    counter = FHE.add(counter, value);
    FHE.allowThis(counter);
    FHE.allow(counter, msg.sender);
}
```

#### SimpleArithmetic.sol
**Purpose**: All FHE arithmetic operations
**Concepts**: `FHE.add()`, `FHE.sub()`, `FHE.mul()`, `FHE.div()`, `FHE.min()`, `FHE.max()`
**Lines**: ~200
**Tests**: 15+
**Difficulty**: ⭐ Beginner

**Key Features**:
- Add, subtract, multiply, divide encrypted values
- Min/max operations
- Chaining multiple operations
- Permission updates after operations

#### Comparison.sol
**Purpose**: All FHE comparison operations
**Concepts**: `FHE.eq()`, `FHE.ne()`, `FHE.lt()`, `FHE.le()`, `FHE.gt()`, `FHE.ge()`, `FHE.select()`
**Lines**: ~270
**Tests**: 18+
**Difficulty**: ⭐⭐ Intermediate

**Key Features**:
- All comparison operators
- Encrypted boolean results
- Conditional selection
- Comparison-based logic

---

### 2. Encryption Examples

Demonstrates encryption patterns and encrypted storage.

#### EncryptDecrypt.sol
**Purpose**: Encryption and decryption workflows
**Concepts**: Encrypt client-side, store on-chain, decrypt with permissions
**Lines**: ~180
**Tests**: 12+
**Difficulty**: ⭐⭐ Intermediate

**Key Patterns**:
- Store encrypted values
- Perform operations on encrypted data
- Manage permissions for decryption
- Multiple encrypted types

#### EncryptedStorage.sol
**Purpose**: Best practices for encrypted data storage
**Concepts**: Type selection, storage optimization, permission management
**Lines**: ~200
**Tests**: 14+
**Difficulty**: ⭐⭐ Intermediate

**Covered Topics**:
- Choosing appropriate encrypted types
- Storage patterns for different data types
- Gas optimization
- Permission best practices

---

### 3. Decryption Examples

Advanced patterns for user and public decryption.

#### UserDecrypt.sol ⭐ NEW
**Purpose**: Complete guide to user-side decryption
**Concepts**: User permissions, client-side decryption, multi-party access
**Lines**: ~330
**Tests**: 25+
**Difficulty**: ⭐⭐⭐ Advanced

**Key Features**:
- Store with user decryption permission
- Share data with multiple viewers
- Transfer with permission updates
- Conditional rewards
- Batch operations

**Usage Pattern**:
```javascript
// Contract grants permission
FHE.allow(encryptedValue, userAddress);

// User decrypts client-side
const decrypted = await instances.user1.decrypt64(encryptedValue);
```

#### PublicDecrypt.sol ⭐ NEW
**Purpose**: Threshold and public decryption patterns
**Concepts**: Vote thresholds, decryption gates, conditional reveals
**Lines**: ~310
**Tests**: 22+
**Difficulty**: ⭐⭐⭐ Advanced

**Key Features**:
- Threshold-based decryption (requires N votes)
- Decryption gates with conditions
- Time-locked reveals
- Role-based access to decryption
- Encrypted aggregations

**Use Cases**:
- Voting outcomes (hidden until threshold)
- Sealed auctions
- Confidential fundraising
- Privacy-preserving analytics

---

### 4. Input Proof Patterns

Comprehensive guide to handling input proofs for all encrypted types.

#### InputProofPatterns.sol ⭐ NEW
**Purpose**: Every input proof pattern and validation technique
**Concepts**: All encrypted types, proof validation, batch processing
**Lines**: ~420
**Tests**: 30+
**Difficulty**: ⭐⭐ Intermediate to Advanced

**Covered Types**:
- `euint8` (0-255)
- `euint16` (0-65,535)
- `euint32` (0-4,294,967,295)
- `euint64` (0-18 quintillion)
- `eaddress` (Encrypted Ethereum address)
- `ebool` (Encrypted boolean)

**Validation Patterns**:
```solidity
// Size validation
require(inputProof.length >= 32, "Proof too short");
require(inputProof.length <= 1024, "Proof too long");

// Process with proof
euint32 value = FHE.asEuint32(encryptedInput, inputProof);

// Set permissions
FHE.allowThis(value);
FHE.allow(value, msg.sender);
```

**Key Sections**:
- Basic validation patterns
- Safe processing with try-catch
- Batch operations
- Common mistakes and solutions
- Client-side proof generation

---

### 5. Access Control Examples

Role-based access control for encrypted data.

#### AccessControl.sol
**Purpose**: Comprehensive RBAC with encrypted data
**Concepts**: Roles, permissions, encrypted state with access control
**Lines**: ~280
**Tests**: 20+
**Difficulty**: ⭐⭐⭐ Advanced

**Roles**:
- Admin: Full access
- Manager: Create and view records
- User: View own data only

**Features**:
- Role assignment
- Permission delegation
- Encrypted scores with role-based access
- Access logs

#### RoleBasedAccess.sol
**Purpose**: Advanced RBAC patterns
**Concepts**: Hierarchical roles, temporary permissions
**Lines**: ~220
**Tests**: 16+
**Difficulty**: ⭐⭐⭐ Advanced

---

### 6. Advanced Examples

Real-world applications demonstrating complex FHEVM usage.

#### ConfidentialVoting.sol
**Purpose**: Privacy-preserving voting system
**Concepts**: Encrypted votes, sealed proposals, aggregated results
**Lines**: ~350
**Tests**: 28+
**Difficulty**: ⭐⭐⭐⭐ Expert

**Features**:
- Create sealed proposals
- Cast encrypted votes
- Aggregate votes without revealing individual choices
- Reveal results after voting period
- Voter anonymity

**Use Cases**:
- DAO governance
- Elections
- Polls and surveys
- Confidential decision-making

#### ConfidentialLending.sol ⭐ NEW
**Purpose**: Complete lending platform with privacy
**Concepts**: Multi-variable encrypted calculations, health factors, liquidation logic
**Lines**: ~480
**Tests**: 35+
**Difficulty**: ⭐⭐⭐⭐ Expert

**Features**:
- Encrypted collateral balances
- Private credit scores (300-850)
- Hidden interest rates based on credit
- Confidential loan amounts
- Private liquidation thresholds
- Health factor calculations

**Key Functions**:
```solidity
// Initialize with hidden credit score
function initializeProfile(inEuint64 encryptedCreditScore, bytes inputProof)

// Deposit hidden collateral
function depositCollateral(inEuint64 encryptedAmount, bytes inputProof)

// Request loan (amount, interest rate private)
function requestLoan(inEuint64 encryptedLoanAmount, bytes inputProof)

// Repay with interest (amounts hidden)
function repayLoan(inEuint64 encryptedRepayAmount, bytes inputProof)

// Check liquidation status (threshold hidden)
function checkLiquidation(address user) returns (ebool)
```

**Real-World Value**:
- Truly private DeFi
- No MEV from leaked collateral/loan data
- Credit scores remain confidential
- Competitive advantages preserved

---

### 7. OpenZeppelin Integration

Confidential token standards.

#### ConfidentialERC20.sol ⭐ NEW
**Purpose**: ERC20 token with fully encrypted balances
**Concepts**: ERC7984 pattern, confidential transfers, encrypted allowances
**Lines**: ~230
**Tests**: 20+
**Difficulty**: ⭐⭐⭐ Advanced

**Features**:
- Encrypted balances (`euint64`)
- Private transfers (amounts hidden)
- Confidential allowances
- Standard ERC20 interface with encryption

**Key Difference from Standard ERC20**:
```solidity
// Standard ERC20
function transfer(address to, uint256 amount) external returns (bool)

// Confidential ERC20 (ERC7984)
function transfer(
    address to,
    inEuint64 calldata encryptedAmount,
    bytes calldata inputProof
) external returns (bool)
```

**Use Cases**:
- Confidential payments
- Private payroll
- Hidden treasury balances
- Competitive business transactions

---

### 8. Anti-Patterns

Learn from common mistakes.

#### BadContract.sol
**Purpose**: Educational contract showing 8 common FHEVM mistakes
**Lines**: ~180
**Tests**: 8+ (demonstrating failures)
**Difficulty**: ⭐⭐ Intermediate (for learning)

**Anti-Patterns Demonstrated**:
1. Missing `FHE.allowThis()` - Contract can't use value
2. Setting permissions in view functions - Gas waste, no effect
3. No access control - Anyone can modify data
4. Using oversized types - Unnecessary gas costs
5. Forgetting permission updates - New values undecryptable
6. Missing input proofs - Security vulnerability
7. Exposing decrypted values - Privacy leak
8. Improper permission transfers - Access control breach

**Each mistake includes**:
- Wrong implementation
- Explanation of why it's wrong
- Correct implementation
- Test demonstrating the issue

---

## How to Use These Examples

### For Beginners

1. Start with **FHECounter.sol** (simplest)
2. Move to **SimpleArithmetic.sol** (operations)
3. Learn **Comparison.sol** (conditional logic)
4. Study **InputProofPatterns.sol** (essential knowledge)
5. Review **AntiPatterns.md** (learn what NOT to do)

### For Intermediate Developers

1. Study **EncryptDecrypt.sol** (encryption workflows)
2. Master **UserDecrypt.sol** (decryption patterns)
3. Implement **AccessControl.sol** (RBAC)
4. Explore **ConfidentialERC20.sol** (token standards)
5. Practice with **PublicDecrypt.sol** (threshold patterns)

### For Advanced Developers

1. Analyze **ConfidentialVoting.sol** (complex logic)
2. Build upon **ConfidentialLending.sol** (real-world app)
3. Create custom patterns
4. Contribute new examples

---

## Testing

Each example includes comprehensive tests:

```bash
# Run all example tests
npm test

# Run specific example tests
npx hardhat test examples/decryption/UserDecrypt.test.js

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npm run test:coverage
```

---

## Creating New Examples

Use the automation tools:

```bash
# Create single example project
npm run create-example

# Create category-based project (multiple examples)
npm run create-category

# Validate all examples
npm run validate
```

---

## Documentation

Every example includes:

- **Smart Contract** (.sol file)
- **Tests** (.test.js file)
- **Documentation** (.md file)
- **Usage Examples** (JavaScript/TypeScript)
- **Common Patterns**
- **Security Considerations**
- **Troubleshooting**

---

## Example Dependencies

All examples use:

- **@fhevm/solidity**: ^0.5.0
- **fhevmjs**: Latest
- **Hardhat**: ^2.20.0
- **Ethers.js**: ^6.0.0
- **Chai**: ^4.3.0

Install all dependencies:

```bash
npm install
```

---

## Example Navigation

### By Difficulty

**⭐ Beginner**:
- FHECounter.sol
- SimpleArithmetic.sol

**⭐⭐ Intermediate**:
- Comparison.sol
- EncryptDecrypt.sol
- EncryptedStorage.sol
- InputProofPatterns.sol
- BadContract.sol (learning)

**⭐⭐⭐ Advanced**:
- UserDecrypt.sol
- PublicDecrypt.sol
- AccessControl.sol
- RoleBasedAccess.sol
- ConfidentialERC20.sol

**⭐⭐⭐⭐ Expert**:
- ConfidentialVoting.sol
- ConfidentialLending.sol

### By Use Case

**Financial Applications**:
- ConfidentialLending.sol
- ConfidentialERC20.sol

**Governance**:
- ConfidentialVoting.sol
- PublicDecrypt.sol (thresholds)

**Data Privacy**:
- UserDecrypt.sol
- AccessControl.sol
- RoleBasedAccess.sol

**Learning**:
- FHECounter.sol
- SimpleArithmetic.sol
- Comparison.sol
- BadContract.sol

---

## Example Statistics

| Example | Lines | Tests | Gas (avg) | Complexity |
|---------|-------|-------|-----------|------------|
| FHECounter | 150 | 10+ | ~100k | Low |
| SimpleArithmetic | 200 | 15+ | ~120k | Low |
| Comparison | 270 | 18+ | ~150k | Medium |
| UserDecrypt | 330 | 25+ | ~180k | High |
| PublicDecrypt | 310 | 22+ | ~200k | High |
| InputProofPatterns | 420 | 30+ | ~160k | Medium |
| ConfidentialERC20 | 230 | 20+ | ~190k | High |
| ConfidentialLending | 480 | 35+ | ~280k | Very High |
| ConfidentialVoting | 350 | 28+ | ~240k | Very High |

*Gas costs are approximate and depend on input sizes and operations.*

---

## Contributing

To contribute a new example:

1. Create contract in appropriate category
2. Write comprehensive tests (>90% coverage)
3. Add detailed markdown documentation
4. Include usage examples
5. Test on Zama Sepolia testnet
6. Submit PR with checklist

See `CONTRIBUTING.md` for details.

---

## Support

- **Documentation**: See `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/user/repo/issues)
- **Discord**: [Zama Discord](https://discord.gg/zama)
- **Forum**: [Zama Community Forum](https://community.zama.ai/)

---

## License

All examples are MIT licensed. See `LICENSE` file.

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Total Examples**: 15+
**Total Tests**: 150+
**Documentation Pages**: 20+
