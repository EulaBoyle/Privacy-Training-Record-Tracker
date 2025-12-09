# Privacy Training Record - Test Suite

Comprehensive test suite demonstrating FHEVM concepts through real-world training management scenarios.

## Overview

This test suite includes **8 test categories** with **100+ test cases** covering:

- ✅ Basic FHEVM operations (encrypted data creation, access control)
- ✅ Advanced multi-party scenarios
- ✅ Edge cases and boundary conditions
- ✅ Common anti-patterns and how to avoid them
- ✅ Complete workflow integration tests

## Test Files

### 1. BasicTests.test.js
**For beginners learning FHEVM**

Contains 10 test categories covering fundamental concepts:
- Contract deployment
- Creating encrypted records
- Basic access control
- Encrypted data handling (ebool)
- Training completion
- Module management
- Trainer authorization
- Employee training history
- Training expiry
- Simple integration flows

**Run:**
```bash
npx hardhat test test/BasicTests.test.js
```

**What you'll learn:**
- How to deploy FHEVM contracts
- Creating and managing encrypted booleans
- Basic permission patterns
- Reading encrypted data with access control

---

### 2. PrivacyTrainingRecord.test.js
**Comprehensive coverage of all features**

Contains 8 test categories with 60+ tests:
1. **Deployment & Initialization** - Contract setup and initial state
2. **Access Control & Permissions** - Role-based authorization
3. **Training Record Creation** - Creating records with encrypted fields
4. **Training Completion** - Updating encrypted data
5. **Data Retrieval & Decryption** - Access control for encrypted values
6. **Edge Cases & Error Handling** - Boundary conditions
7. **Anti-patterns** - Common mistakes and best practices
8. **Integration Workflows** - End-to-end scenarios

**Run:**
```bash
npx hardhat test test/PrivacyTrainingRecord.test.js
```

**What you'll learn:**
- Complete FHEVM contract testing patterns
- Proper access control implementation
- How to test encrypted data
- Common pitfalls to avoid
- Integration testing strategies

---

### 3. AdvancedTests.test.js
**For experienced developers**

Contains 7 advanced test categories:
1. **Multi-Trainer Coordination** - Complex multi-party scenarios
2. **Complex Access Control** - Intricate permission patterns
3. **Boundary Conditions** - Edge cases and limits
4. **State Consistency** - Verifying state across operations
5. **Permission Transitions** - Dynamic authorization changes
6. **Complex Workflows** - Enterprise-scale scenarios
7. **FHEVM Pattern Verification** - Encryption pattern validation

**Run:**
```bash
npx hardhat test test/AdvancedTests.test.js
```

**What you'll learn:**
- Multi-party encrypted data management
- Complex permission scenarios
- State consistency with encrypted data
- Real-world enterprise workflows
- Advanced FHEVM patterns

---

## Running Tests

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Test File
```bash
npx hardhat test test/BasicTests.test.js
npx hardhat test test/PrivacyTrainingRecord.test.js
npx hardhat test test/AdvancedTests.test.js
```

### Run Specific Test Suite
```bash
npx hardhat test --grep "Deployment & Initialization"
npx hardhat test --grep "Access Control"
npx hardhat test --grep "Encrypted Data"
```

### Run with Gas Reporting
```bash
REPORT_GAS=true npx hardhat test
```

### Run with Coverage
```bash
npx hardhat coverage
```

### Run with Detailed Output
```bash
npx hardhat test --verbose
```

---

## Test Categories by Concept

### FHEVM Core Concepts

#### 1. Encrypted Data Storage (`ebool`)
**Tests:** BasicTests (Test 4), PrivacyTrainingRecord (Category 3, 4, 5)

Learn how to:
- Create encrypted boolean values with `FHE.asEbool()`
- Store encrypted state in smart contracts
- Retrieve encrypted values with access control

**Example:**
```javascript
it("Can create encrypted completion status", async function () {
    await contract.createTrainingRecord(employee.address, "Test", "data-privacy");
    const encrypted = await contract.getEncryptedCompletion(0);
    expect(encrypted).to.not.be.undefined;
});
```

#### 2. Access Control with FHE
**Tests:** BasicTests (Test 3), PrivacyTrainingRecord (Category 2, 5), AdvancedTests (Category 2)

Learn how to:
- Set permissions with `FHE.allow()` and `FHE.allowThis()`
- Implement role-based access control
- Prevent unauthorized data access

**Example:**
```javascript
it("Only authorized users can decrypt", async function () {
    await expect(
        contract.connect(unauthorized).getEncryptedCompletion(0)
    ).to.be.revertedWith("Not authorized");
});
```

#### 3. Permission Management
**Tests:** PrivacyTrainingRecord (Category 7), AdvancedTests (Category 5)

Learn how to:
- Grant and revoke access permissions
- Maintain permissions across state changes
- Handle permission transitions

**Best Practice Example:**
```javascript
it("Proper permission management", async function () {
    // Create record sets permissions for both contract and employee
    FHE.allowThis(record.encryptedCompletion);   // Contract can use
    FHE.allow(record.encryptedCompletion, employee); // Employee can decrypt
});
```

---

### Common Patterns

#### Pattern 1: Creating Encrypted Records
```solidity
// Good Practice
record.encryptedCompletion = FHE.asEbool(false);
FHE.allowThis(record.encryptedCompletion);
FHE.allow(record.encryptedCompletion, employee);
```

**Tests:** PrivacyTrainingRecord (Category 3, Test 2)

#### Pattern 2: Updating Encrypted Data
```solidity
// Good Practice
record.encryptedCompletion = FHE.asEbool(completed);
FHE.allowThis(record.encryptedCompletion);
FHE.allow(record.encryptedCompletion, record.employee);
```

**Tests:** PrivacyTrainingRecord (Category 4)

#### Pattern 3: Access Control for Decryption
```solidity
// Good Practice
modifier canDecrypt(uint256 recordId) {
    require(
        msg.sender == record.employee ||
        authorizedTrainers[msg.sender] ||
        msg.sender == admin,
        "Not authorized"
    );
    _;
}
```

**Tests:** BasicTests (Test 3), AdvancedTests (Category 2)

---

### Anti-Patterns (What NOT to Do)

#### ❌ Anti-Pattern 1: Missing FHE.allowThis()
```solidity
// WRONG
record.encryptedCompletion = FHE.asEbool(false);
// Missing FHE.allowThis() - contract can't use this value!
```

**Test:** PrivacyTrainingRecord (Category 7, Anti-Pattern 1)

#### ❌ Anti-Pattern 2: View Functions with Encrypted State Changes
```solidity
// WRONG
function getValue() external view returns (ebool) {
    ebool value = FHE.asEbool(true);
    FHE.allow(value, msg.sender); // Can't modify state in view!
    return value;
}
```

**Test:** PrivacyTrainingRecord (Category 7, Anti-Pattern 2)

#### ❌ Anti-Pattern 3: Missing Authorization Checks
```solidity
// WRONG
function createRecord() external {
    // No authorization check!
    // Anyone can create records
}

// CORRECT
function createRecord() external onlyAuthorizedTrainer {
    // Only authorized trainers can create
}
```

**Test:** PrivacyTrainingRecord (Category 7, Anti-Pattern 3)

---

## Test Coverage

### By Feature

| Feature | Basic | Comprehensive | Advanced | Total Tests |
|---------|-------|---------------|----------|-------------|
| Deployment | 3 | 4 | - | 7 |
| Access Control | 4 | 6 | 8 | 18 |
| Record Creation | 4 | 5 | - | 9 |
| Training Completion | 5 | 7 | - | 12 |
| Data Retrieval | 4 | 8 | - | 12 |
| Encrypted Data | 3 | 8 | 6 | 17 |
| Edge Cases | - | 6 | 12 | 18 |
| Integration | 1 | 2 | 4 | 7 |
| **Total** | **24** | **46** | **30** | **100** |

### By FHEVM Concept

| Concept | Test Count | Files |
|---------|------------|-------|
| `ebool` creation | 15 | All |
| `FHE.allow()` usage | 20 | All |
| `FHE.allowThis()` usage | 20 | All |
| Access control | 25 | All |
| Permission management | 12 | Comprehensive, Advanced |
| Anti-patterns | 8 | Comprehensive |
| Integration scenarios | 10 | All |

---

## Expected Test Results

### All Tests Should Pass
```
Privacy Training Record - Test Suite
  ✓ All 100+ tests passing
  ✓ 0 failing
  ✓ Coverage > 95%
```

### Sample Output
```
  Basic FHEVM Tests
    Test 1: Contract Deployment
      ✓ Contract deploys successfully
      ✓ Owner is set correctly
      ✓ Record counter starts at zero
    Test 2: Creating Training Records
      ✓ Can create a basic training record
      ✓ Emits TrainingRecordCreated event
      ...

  Privacy Training Record Comprehensive Tests
    1. Deployment & Initialization
      ✓ Should deploy with correct admin address
      ✓ Should automatically authorize deployer
      ...
    2. Access Control & Permissions
      ✓ Should allow admin to authorize trainers
      ✓ Should prevent unauthorized access
      ...

  Advanced FHEVM Tests
    Advanced 1: Multi-Trainer Scenarios
      ✓ Different trainers can manage same employee
      ✓ Maintains separate training histories
      ...

  100 passing (5s)
```

---

## Writing Your Own Tests

### Template for Basic Test
```javascript
it("Should test specific FHEVM feature", async function () {
    // 1. Setup
    await contract.authorizeTrainer(trainer.address);

    // 2. Action
    await contract.connect(trainer).createTrainingRecord(
        employee.address,
        "Test Employee",
        "data-privacy"
    );

    // 3. Assertion
    const record = await contract.connect(employee).getTrainingRecord(0);
    expect(record.employee).to.equal(employee.address);
});
```

### Template for Access Control Test
```javascript
it("Should enforce access control", async function () {
    // Setup: Create encrypted data
    await contract.createTrainingRecord(employee.address, "Test", "data-privacy");

    // Test: Authorized access works
    await expect(
        contract.connect(employee).getEncryptedCompletion(0)
    ).to.not.be.reverted;

    // Test: Unauthorized access fails
    await expect(
        contract.connect(unauthorized).getEncryptedCompletion(0)
    ).to.be.revertedWith("Not authorized");
});
```

### Template for Anti-Pattern Test
```javascript
it("ANTI-PATTERN: Demonstrates common mistake", async function () {
    /**
     * Explanation: Why this is wrong
     *
     * WRONG: (show incorrect code)
     * CORRECT: (show correct code)
     */

    // Test demonstrates the correct pattern is implemented
    await expect(correctImplementation()).to.not.be.reverted;
});
```

---

## Best Practices for FHEVM Testing

### 1. Always Test Access Control
Every encrypted value should have tests verifying:
- ✅ Authorized users can access
- ✅ Unauthorized users cannot access
- ✅ Permissions persist correctly

### 2. Test Permission Management
Verify that `FHE.allow()` and `FHE.allowThis()` are called:
- ✅ When creating encrypted values
- ✅ When updating encrypted values
- ✅ For all parties that need access

### 3. Test State Consistency
Encrypted state should remain consistent:
- ✅ Across multiple reads
- ✅ After state updates
- ✅ Through permission changes

### 4. Document Anti-Patterns
Include tests showing:
- ❌ Common mistakes
- ✅ Correct implementations
- 📝 Explanations of why

### 5. Test Integration Scenarios
Include end-to-end tests:
- ✅ Complete workflows
- ✅ Multi-party interactions
- ✅ Real-world use cases

---

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx hardhat test
      - run: npx hardhat coverage
```

---

## Troubleshooting

### Tests Not Running
```bash
# Install dependencies
npm install

# Verify Hardhat installation
npx hardhat --version

# Clean and recompile
npx hardhat clean
npx hardhat compile
```

### Import Errors
Make sure `hardhat.config.js` includes:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
```

### Gas Issues
If tests fail due to gas:
```javascript
// Increase gas limit in hardhat.config.js
networks: {
  hardhat: {
    gas: 12000000,
    blockGasLimit: 12000000
  }
}
```

---

## Additional Resources

### FHEVM Testing Documentation
- [FHEVM Testing Guide](https://docs.zama.ai/fhevm/testing)
- [Hardhat Testing](https://hardhat.org/tutorial/testing-contracts)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)

### Example Projects
- [FHEVM Examples Repository](https://github.com/zama-ai/fhevm)
- [OpenZeppelin Test Helpers](https://docs.openzeppelin.com/test-helpers)

### Community
- [Zama Discord](https://discord.gg/zama)
- [GitHub Discussions](https://github.com/zama-ai/fhevm/discussions)

---

## Summary

This test suite provides comprehensive coverage of FHEVM concepts through practical examples:

✅ **100+ test cases** covering all major features
✅ **3 difficulty levels** from beginner to advanced
✅ **Anti-pattern documentation** showing what NOT to do
✅ **Real-world scenarios** demonstrating practical usage
✅ **Best practices** for FHEVM development

Use these tests as:
- 📚 Learning resource for FHEVM development
- ✅ Validation suite for your implementation
- 📖 Reference for testing patterns
- 🎯 Foundation for your own FHEVM projects

---

**Ready to run tests?**
```bash
npx hardhat test
```
