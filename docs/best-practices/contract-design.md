# Smart Contract Design Best Practices

## Overview

This guide covers best practices for designing FHEVM smart contracts, including patterns, anti-patterns, and security considerations.

## FHEVM-Specific Patterns

### 1. Always Set Permissions

**Rule**: Every encrypted value must have permissions set for both the contract and authorized users.

```solidity
// ✅ CORRECT
function createEncryptedValue(uint32 value) external {
    euint32 encrypted = FHE.asEuint32(value);

    // Contract needs to use this value
    FHE.allowThis(encrypted);

    // User needs to decrypt this value
    FHE.allow(encrypted, msg.sender);
}

// ❌ WRONG - Missing permissions
function createEncryptedValue(uint32 value) external {
    euint32 encrypted = FHE.asEuint32(value);
    // Missing FHE.allowThis() and FHE.allow()
}
```

### 2. Choose Appropriate Types

**Rule**: Use the smallest encrypted type that fits your data range.

```solidity
// ✅ CORRECT - Type matches data range
ebool isActive;           // For boolean values
euint8 level;            // For 0-255 (levels, percentages)
euint32 balance;         // For larger numbers (balances, IDs)
euint64 timestamp;       // For very large numbers

// ❌ WRONG - Unnecessarily large types
euint64 isActive;        // Waste of gas for boolean
euint256 level;          // Too large for level 0-100
```

**Type Selection Guide:**

| Type | Range | Gas Cost | Use Cases |
|------|-------|----------|-----------|
| `ebool` | true/false | Lowest | Flags, status |
| `euint8` | 0-255 | Low | Small numbers, levels |
| `euint16` | 0-65,535 | Medium | IDs, counts |
| `euint32` | 0-4.2B | Medium-High | Balances, scores |
| `euint64` | 0-18E | High | Timestamps, large values |

### 3. Implement Access Control

**Rule**: Always check authorization before returning encrypted data.

```solidity
// ✅ CORRECT - Authorization check
function getEncryptedData(uint256 id) external view returns (euint32) {
    require(
        msg.sender == dataOwner[id] ||
        isAuthorized[msg.sender],
        "Not authorized"
    );
    return encryptedData[id];
}

// ❌ WRONG - No authorization check
function getEncryptedData(uint256 id) external view returns (euint32) {
    return encryptedData[id];  // Anyone can call this!
}
```

### 4. Handle Input Proofs Correctly

**Rule**: Always use input proofs for user-provided encrypted values.

```solidity
// ✅ CORRECT - With input proof
function submitEncryptedValue(
    inEuint32 calldata inputHandle,
    bytes calldata inputProof
) external {
    euint32 value = FHE.asEuint32(inputHandle, inputProof);
    // Use value...
}

// ❌ WRONG - No input proof verification
function submitValue(uint32 value) external {
    euint32 encrypted = FHE.asEuint32(value);
    // Missing input proof - not secure!
}
```

## General Smart Contract Patterns

### 5. Use Modifiers for Access Control

```solidity
// ✅ CORRECT - Clean modifier pattern
modifier onlyOwner() {
    require(msg.sender == owner, "Only owner");
    _;
}

modifier onlyAuthorized(uint256 id) {
    require(isAuthorized(msg.sender, id), "Not authorized");
    _;
}

function sensitiveOperation(uint256 id)
    external
    onlyOwner
    onlyAuthorized(id)
{
    // Implementation
}
```

### 6. Emit Events for Important Actions

```solidity
// ✅ CORRECT - Events for indexing
event DataCreated(
    uint256 indexed id,
    address indexed owner,
    uint256 timestamp
);

event AccessGranted(
    uint256 indexed id,
    address indexed user,
    uint256 timestamp
);

function createData() external {
    // ... create data ...
    emit DataCreated(id, msg.sender, block.timestamp);
}
```

### 7. Validate Inputs

```solidity
// ✅ CORRECT - Input validation
function createRecord(
    address user,
    string calldata name,
    uint32 value
) external {
    require(user != address(0), "Invalid address");
    require(bytes(name).length > 0, "Empty name");
    require(bytes(name).length <= 100, "Name too long");
    require(value > 0, "Value must be positive");

    // Implementation
}
```

### 8. Use Checks-Effects-Interactions Pattern

```solidity
// ✅ CORRECT - CEI pattern
function withdraw(uint256 amount) external {
    // Checks
    require(balances[msg.sender] >= amount, "Insufficient balance");

    // Effects
    balances[msg.sender] -= amount;

    // Interactions
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
```

## Storage Patterns

### 9. Organize Encrypted State

```solidity
// ✅ CORRECT - Organized struct
struct EncryptedRecord {
    address owner;
    ebool isActive;          // Encrypted
    euint32 encryptedValue;  // Encrypted
    uint256 timestamp;       // Public
    string metadata;         // Public
}

mapping(uint256 => EncryptedRecord) public records;
```

### 10. Separate Public and Private Data

```solidity
// ✅ CORRECT - Clear separation
struct Record {
    // Public data
    address owner;
    uint256 createdAt;
    bool isActive;

    // Encrypted data (separate)
    euint32 encryptedBalance;
    ebool encryptedStatus;
}
```

## Security Patterns

### 11. Implement Reentrancy Protection

```solidity
// ✅ CORRECT - Reentrancy guard
bool private locked;

modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}

function sensitiveFunction() external nonReentrant {
    // Implementation
}
```

### 12. Use Pull Over Push for Payments

```solidity
// ✅ CORRECT - Pull pattern
mapping(address => uint256) public pendingWithdrawals;

function withdraw() external {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount > 0, "No funds");

    pendingWithdrawals[msg.sender] = 0;

    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}

// ❌ WRONG - Push pattern (can fail)
function distribute(address[] calldata recipients) external {
    for (uint i = 0; i < recipients.length; i++) {
        recipients[i].call{value: amount}("");  // Can fail
    }
}
```

## Documentation Patterns

### 13. Use NatSpec Comments

```solidity
// ✅ CORRECT - Comprehensive documentation
/// @title Encrypted Storage Contract
/// @notice Stores encrypted user data with role-based access
/// @dev Uses FHEVM for encryption, implements access control
contract EncryptedStorage {
    /// @notice Creates a new encrypted record
    /// @dev Sets permissions for contract and user
    /// @param _value The value to encrypt and store
    /// @param _metadata Public metadata for the record
    /// @return recordId The ID of the created record
    function createRecord(
        uint32 _value,
        string calldata _metadata
    ) external returns (uint256 recordId) {
        // Implementation
    }
}
```

## Gas Optimization

### 14. Cache Storage Variables

```solidity
// ✅ CORRECT - Cache in memory
function processRecords(uint256[] calldata ids) external {
    uint256 length = ids.length;  // Cache array length
    address currentOwner = owner;  // Cache storage variable

    for (uint256 i = 0; i < length; i++) {
        // Use cached values
    }
}

// ❌ WRONG - Repeated storage reads
function processRecords(uint256[] calldata ids) external {
    for (uint256 i = 0; i < ids.length; i++) {
        if (msg.sender == owner) {  // Reads storage each iteration
            // Implementation
        }
    }
}
```

### 15. Use Calldata for Read-Only Parameters

```solidity
// ✅ CORRECT - Use calldata
function processData(
    uint256[] calldata ids,
    string calldata name
) external {
    // Implementation
}

// ❌ WRONG - Uses memory (more expensive)
function processData(
    uint256[] memory ids,
    string memory name
) external {
    // Implementation
}
```

## Testing Patterns

### 16. Test Both Success and Failure Cases

```javascript
// ✅ CORRECT - Test both paths
describe("createRecord", function () {
    it("Should create record successfully", async function () {
        await expect(contract.createRecord(user, "Test", 100))
            .to.not.be.reverted;
    });

    it("Should revert with invalid address", async function () {
        await expect(
            contract.createRecord(ZERO_ADDRESS, "Test", 100)
        ).to.be.revertedWith("Invalid address");
    });

    it("Should revert with empty name", async function () {
        await expect(
            contract.createRecord(user, "", 100)
        ).to.be.revertedWith("Empty name");
    });
});
```

## Summary Checklist

Before deploying your FHEVM contract:

**Permissions:**
- [ ] All encrypted values have `FHE.allowThis()` set
- [ ] All encrypted values have `FHE.allow()` set for authorized users
- [ ] Permission updates maintain consistency

**Access Control:**
- [ ] Authorization checks before returning encrypted data
- [ ] Role-based access properly implemented
- [ ] Modifiers used for repeated checks

**Input Validation:**
- [ ] All user inputs validated
- [ ] Input proofs used for encrypted inputs
- [ ] Boundary conditions checked

**Security:**
- [ ] Reentrancy protection where needed
- [ ] Checks-Effects-Interactions pattern followed
- [ ] No unchecked external calls

**Documentation:**
- [ ] NatSpec comments on all public functions
- [ ] Contract purpose documented
- [ ] Complex logic explained

**Testing:**
- [ ] Unit tests for all functions
- [ ] Success and failure cases covered
- [ ] Integration tests for workflows
- [ ] >95% code coverage

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Solidity Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

---

**Remember**: Security and correctness are paramount. Take time to design, review, and test your contracts thoroughly before deployment.
