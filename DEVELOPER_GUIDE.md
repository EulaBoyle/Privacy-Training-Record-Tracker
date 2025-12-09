# Developer Guide - Privacy Training Record

Comprehensive guide for developers building on top of the Privacy Training Record example or creating new FHEVM examples.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Adding New Features](#adding-new-features)
- [Creating New Examples](#creating-new-examples)
- [Testing Strategies](#testing-strategies)
- [Deployment Process](#deployment-process)
- [Maintenance and Updates](#maintenance-and-updates)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Development Environment Setup

#### Prerequisites
- **Node.js**: v16.0.0 or later
- **npm**: v8.0.0 or later
- **Git**: Latest version
- **Code Editor**: VS Code recommended with Solidity extensions

#### Recommended VS Code Extensions
- Solidity (Juan Blanco)
- Hardhat Solidity
- ESLint
- Prettier

#### Installation Steps

```bash
# Clone the repository
git clone <repository-url>
cd PrivacyTrainingRecord

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Add your PRIVATE_KEY and other settings

# Compile contracts
npm run compile

# Run tests
npm test
```

---

## Project Architecture

### Directory Structure

```
PrivacyTrainingRecord/
├── contracts/              # Solidity smart contracts
│   └── PrivacyTrainingRecord.sol
├── test/                   # Test files
│   ├── BasicTests.test.js
│   ├── PrivacyTrainingRecord.test.js
│   ├── AdvancedTests.test.js
│   └── README.md
├── scripts/                # Deployment and automation scripts
│   ├── deploy.js
│   ├── create-fhevm-example.ts
│   └── generate-docs.ts
├── docs/                   # Generated documentation
├── hardhat.config.ts       # Hardhat configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Node.js dependencies and scripts
└── README.md               # Project documentation
```

### Key Components

#### 1. Smart Contract (`contracts/PrivacyTrainingRecord.sol`)

**Core Data Structures:**
```solidity
struct TrainingRecord {
    address employee;
    string employeeName;
    string trainingModule;
    ebool encryptedCompletion;      // FHE encrypted
    ebool encryptedCertification;   // FHE encrypted
    uint256 completionTime;
    uint256 expiryTime;
    bool isActive;
    uint256 score;
    string notes;
}
```

**Key Patterns:**
- Encrypted boolean storage with `ebool`
- Permission management with `FHE.allow()` and `FHE.allowThis()`
- Role-based access control
- Event emission for indexing

#### 2. Testing Suite

**Three-level testing approach:**
- **BasicTests**: Fundamental concepts for beginners
- **Comprehensive Tests**: Full feature coverage with anti-patterns
- **Advanced Tests**: Complex scenarios and edge cases

---

## Adding New Features

### Adding a New Encrypted Field

**Example: Adding encrypted score**

1. **Update the struct:**

```solidity
struct TrainingRecord {
    // ... existing fields
    euint32 encryptedScore;  // New encrypted field
}
```

2. **Initialize in creation:**

```solidity
function createTrainingRecord(...) external {
    record.encryptedScore = FHE.asEuint32(0);

    // Set permissions
    FHE.allowThis(record.encryptedScore);
    FHE.allow(record.encryptedScore, _employee);
}
```

3. **Add getter function:**

```solidity
function getEncryptedScore(uint256 _recordId)
    external
    view
    returns (euint32)
{
    TrainingRecord storage record = trainingRecords[_recordId];
    require(
        msg.sender == record.employee ||
        authorizedTrainers[msg.sender] ||
        msg.sender == admin,
        "Not authorized"
    );
    return record.encryptedScore;
}
```

4. **Write tests:**

```javascript
it("Should store encrypted score", async function () {
    await contract.createTrainingRecord(employee.address, "Test", "data-privacy");
    const encryptedScore = await contract.connect(employee).getEncryptedScore(0);
    expect(encryptedScore).to.not.be.undefined;
});
```

### Adding a New Function

**Example: Adding batch record creation**

1. **Implement the function:**

```solidity
function createBatchRecords(
    address[] calldata _employees,
    string[] calldata _employeeNames,
    string calldata _trainingModule
) external onlyAuthorizedTrainer returns (uint256[] memory) {
    require(_employees.length == _employeeNames.length, "Length mismatch");

    uint256[] memory recordIds = new uint256[](_employees.length);

    for (uint256 i = 0; i < _employees.length; i++) {
        recordIds[i] = createTrainingRecord(
            _employees[i],
            _employeeNames[i],
            _trainingModule
        );
    }

    return recordIds;
}
```

2. **Add tests:**

```javascript
it("Should create multiple records in batch", async function () {
    const employees = [employee1.address, employee2.address, employee3.address];
    const names = ["Alice", "Bob", "Carol"];

    const recordIds = await contract.connect(trainer).createBatchRecords(
        employees,
        names,
        "data-privacy"
    );

    expect(recordIds.length).to.equal(3);
});
```

3. **Document the function:**

```solidity
/// @notice Creates multiple training records in a single transaction
/// @dev More gas-efficient than calling createTrainingRecord multiple times
/// @param _employees Array of employee addresses
/// @param _employeeNames Array of employee names (must match employees length)
/// @param _trainingModule Training module identifier
/// @return recordIds Array of created record IDs
```

---

## Creating New Examples

### Using the Automation Script

```bash
# Interactive mode
npm run create-example

# With parameters
npx ts-node scripts/create-fhevm-example.ts --name my-example --description "My FHEVM example"
```

### Manual Creation Steps

1. **Define Your Concept**
   - What FHEVM feature are you demonstrating?
   - Which category does it belong to? (basic, encryption, access-control, etc.)
   - What is the learning objective?

2. **Create Contract Template**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Your Example Title
 * @notice Brief description of what this demonstrates
 * @dev Category: basic|encryption|access-control|relayer|anti-patterns
 */
contract YourExample is SepoliaConfig {
    // Your implementation here
}
```

3. **Implement Core Logic**
   - Use encrypted data types appropriately
   - Implement proper access control
   - Add permission management
   - Emit events for important actions

4. **Write Comprehensive Tests**

```javascript
describe("YourExample FHEVM Tests", function () {
    // Test deployment
    // Test encrypted data creation
    // Test access control
    // Test edge cases
    // Test anti-patterns
});
```

5. **Create Documentation**

```bash
npm run generate-docs
```

6. **Add to Repository**
   - Update main README with link to your example
   - Add category tag
   - Include usage instructions

---

## Testing Strategies

### Test Coverage Goals

Aim for >95% coverage across:
- ✅ All function paths
- ✅ Access control scenarios
- ✅ Edge cases and boundary conditions
- ✅ Error conditions
- ✅ Event emissions

### Writing Effective Tests

#### Pattern 1: Basic Functionality Test

```javascript
it("Should perform basic operation correctly", async function () {
    // 1. Setup
    await setupContract();

    // 2. Action
    const result = await contract.someFunction();

    // 3. Verification
    expect(result).to.equal(expectedValue);
});
```

#### Pattern 2: Access Control Test

```javascript
it("Should enforce access control", async function () {
    // Test authorized access works
    await expect(
        contract.connect(authorized).restrictedFunction()
    ).to.not.be.reverted;

    // Test unauthorized access fails
    await expect(
        contract.connect(unauthorized).restrictedFunction()
    ).to.be.revertedWith("Not authorized");
});
```

#### Pattern 3: Encrypted Data Test

```javascript
it("Should handle encrypted data correctly", async function () {
    // Create encrypted value
    await contract.createEncryptedData(params);

    // Authorized user can access
    const encrypted = await contract.connect(authorized).getEncrypted(id);
    expect(encrypted).to.not.be.undefined;

    // Unauthorized user cannot access
    await expect(
        contract.connect(unauthorized).getEncrypted(id)
    ).to.be.revertedWith("Not authorized");
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm run test:basic
npm run test:comprehensive
npm run test:advanced

# Run with coverage
npm run test:coverage

# Run with gas reporting
npm run gas-report

# Verbose output
npx hardhat test --verbose
```

---

## Deployment Process

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and audited
- [ ] Gas optimization completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Network configuration verified

### Deployment Steps

1. **Prepare Environment**

```bash
# Ensure .env is configured
cp .env.example .env
# Edit .env with your PRIVATE_KEY and other values
```

2. **Compile Contracts**

```bash
npm run compile
```

3. **Run Pre-Deployment Tests**

```bash
npm test
```

4. **Deploy to Testnet**

```bash
# Deploy to Zama Sepolia Testnet
npm run deploy

# Or to specific network
npx hardhat run scripts/deploy.js --network zamaTestnet
```

5. **Verify Deployment**

```bash
# Verify on block explorer
npm run verify -- --network zamaTestnet <CONTRACT_ADDRESS>
```

6. **Update Configuration**

- Update `deployment.json` with contract address
- Update frontend `index.html` with contract address
- Update `.env` if needed

### Post-Deployment

1. **Test on Testnet**
   - Connect wallet
   - Test all user flows
   - Verify encrypted data works
   - Check access control

2. **Monitor**
   - Watch for transactions
   - Check gas usage
   - Monitor events

3. **Document**
   - Record deployment details
   - Update README
   - Publish documentation

---

## Maintenance and Updates

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install @fhevm/solidity@latest

# Audit for vulnerabilities
npm audit
npm audit fix
```

### Contract Upgrades

**Note**: This example is not upgradeable by design. For upgradeable contracts:

1. Use OpenZeppelin's upgradeable contract patterns
2. Implement proper storage layout
3. Add upgrade authorization
4. Test upgrades thoroughly

### FHEVM Library Updates

When @fhevm/solidity updates:

1. **Read Changelog**
   - Check for breaking changes
   - Note new features
   - Review migration guide

2. **Update Dependencies**

```bash
npm install @fhevm/solidity@latest
```

3. **Update Imports**

```solidity
// Update imports if package structure changed
import { FHE, ebool } from "@fhevm/solidity/lib/FHE.sol";
```

4. **Run Tests**

```bash
npm test
```

5. **Update Documentation**
   - Update code examples
   - Update version numbers
   - Note any API changes

---

## Best Practices

### FHEVM Development

1. **Always Set Permissions**

```solidity
// CORRECT ✓
ebool encrypted = FHE.asEbool(true);
FHE.allowThis(encrypted);          // Contract can use
FHE.allow(encrypted, userAddress); // User can decrypt
```

```solidity
// WRONG ✗
ebool encrypted = FHE.asEbool(true);
// Missing permissions - will fail!
```

2. **Use Appropriate Data Types**

```solidity
// For booleans
ebool encryptedFlag;

// For small numbers
euint8 encryptedTinyNumber;

// For larger numbers
euint32 encryptedNumber;
euint64 encryptedLargeNumber;

// For addresses (if needed)
eaddress encryptedAddress;
```

3. **Implement Access Control**

```solidity
// Use modifiers
modifier onlyAuthorized(uint256 recordId) {
    require(isAuthorized(msg.sender, recordId), "Not authorized");
    _;
}

// Check in functions
function getEncryptedData(uint256 id) external view returns (ebool) {
    require(canAccess(msg.sender, id), "Access denied");
    return data[id];
}
```

4. **Document FHE Usage**

```solidity
/// @notice Stores completion status as encrypted boolean
/// @dev Uses ebool for privacy-preserving storage
/// @param _recordId Training record identifier
/// @param _completed Completion status (will be encrypted)
function setCompletion(uint256 _recordId, bool _completed) external {
    // Implementation
}
```

### Security Best Practices

1. **Input Validation**

```solidity
function createRecord(address _employee, string calldata _name) external {
    require(_employee != address(0), "Invalid address");
    require(bytes(_name).length > 0, "Empty name");
    require(bytes(_name).length <= 100, "Name too long");
    // Continue...
}
```

2. **Reentrancy Protection**

```solidity
bool private locked;

modifier noReentrancy() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}
```

3. **Safe External Calls**

```solidity
// Check return values
(bool success, ) = recipient.call{value: amount}("");
require(success, "Transfer failed");
```

### Code Quality

1. **Use Consistent Formatting**

```bash
npm run format
```

2. **Lint Regularly**

```bash
npm run lint
```

3. **Write Clear Comments**

```solidity
// Good: Explains WHY
// Store encrypted completion to maintain employee privacy

// Bad: Explains WHAT (obvious from code)
// Set encryptedCompletion to true
```

4. **Follow Naming Conventions**

```solidity
// State variables: camelCase with underscore prefix for function params
mapping(address => bool) public authorizedTrainers;
function authorize(address _trainer) external { }

// Constants: UPPER_SNAKE_CASE
uint256 public constant MAX_RECORDS = 1000;

// Functions: camelCase, verbs
function createRecord() external { }
function getRecord() external view returns (...) { }
```

---

## Troubleshooting

### Common Issues

#### Issue: "Module not found: @fhevm/solidity"

**Solution:**
```bash
npm install @fhevm/solidity
```

#### Issue: Tests failing with "Not authorized"

**Solution:**
```solidity
// Ensure proper authorization before testing
await contract.authorizeTrainer(trainer.address);
await contract.connect(trainer).createRecord(...);
```

#### Issue: Deployment fails with "Insufficient funds"

**Solution:**
- Check account balance
- Get testnet ETH from faucet: https://faucet.zama.ai/
- Verify network configuration

#### Issue: "Transaction underpriced"

**Solution:**
```typescript
// Increase gas price in hardhat.config.ts
networks: {
  zamaTestnet: {
    gasPrice: 20000000000, // 20 gwei
  }
}
```

### Getting Help

- **Documentation**: Read FHEVM docs at https://docs.zama.ai/fhevm
- **Discord**: Join Zama Discord at https://discord.gg/zama
- **Community**: Visit https://community.zama.ai/
- **GitHub Issues**: Report bugs or ask questions

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Code style
- Pull request process
- Testing requirements
- Documentation standards

---

## Resources

### Official Documentation
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/)
- [Ethers.js Documentation](https://docs.ethers.io/)

### Learning Resources
- [Solidity by Example](https://solidity-by-example.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethereum Development Tutorials](https://ethereum.org/en/developers/tutorials/)

### Community
- [Zama Discord](https://discord.gg/zama)
- [GitHub Discussions](https://github.com/zama-ai/fhevm/discussions)
- [Community Forum](https://community.zama.ai/)

---

**Happy Building with FHEVM!** 🚀

For questions or suggestions about this guide, please open an issue or reach out to the community.
