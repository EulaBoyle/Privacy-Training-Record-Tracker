# Quick Start Guide

Get started with FHEVM in 5 minutes! This guide will help you set up your development environment and create your first privacy-preserving smart contract.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **npm** v8 or higher (comes with Node.js)
- **MetaMask** browser extension ([Install](https://metamask.io/))
- **Code Editor** (VS Code recommended)

## Step 1: Clone or Create Project

### Option A: Using the Example Generator

```bash
# Clone this repository
git clone <repository-url>
cd privacy-training-record

# Install dependencies
npm install

# Create a new example
npm run create-example
```

Follow the interactive prompts to:
1. Name your project
2. Choose a category (basic, encryption, access-control, advanced)
3. Set description and author

### Option B: Start from Template

```bash
# Copy the base template
cp -r base-template/ my-fhevm-project
cd my-fhevm-project

# Install dependencies
npm install
```

## Step 2: Configure Environment

Create a `.env` file:

```bash
# Copy the example
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Your wallet private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Zama Sepolia Testnet RPC
ZAMA_RPC_URL=https://sepolia.zama.ai/
```

## Step 3: Write Your First FHEVM Contract

Create `contracts/MyFirstFHEVM.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title My First FHEVM Contract
 * @notice A simple encrypted counter
 */
contract MyFirstFHEVM is SepoliaConfig {
    // Encrypted counter
    euint32 private counter;

    // Contract owner
    address public owner;

    constructor() {
        owner = msg.sender;
        counter = FHE.asEuint32(0);  // Initialize to 0
        FHE.allowThis(counter);       // Contract can use it
    }

    /**
     * @notice Increment counter by encrypted value
     */
    function increment(
        inEuint32 calldata inputHandle,
        bytes calldata inputProof
    ) external {
        // Convert encrypted input
        euint32 value = FHE.asEuint32(inputHandle, inputProof);

        // Add to counter
        counter = FHE.add(counter, value);

        // Set permissions
        FHE.allowThis(counter);
        FHE.allow(counter, msg.sender);
    }

    /**
     * @notice Get encrypted counter
     */
    function getCounter() external view returns (euint32) {
        return counter;
    }
}
```

## Step 4: Write Tests

Create `test/MyFirstFHEVM.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyFirstFHEVM", function () {
  let contract;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const MyFirstFHEVM = await ethers.getContractFactory("MyFirstFHEVM");
    contract = await MyFirstFHEVM.deploy();
    await contract.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
  });

  it("Should set the owner", async function () {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("Should have a counter", async function () {
    const counter = await contract.getCounter();
    expect(counter).to.not.be.undefined;
  });
});
```

## Step 5: Compile and Test

```bash
# Compile contracts
npm run compile

# Run tests
npm test
```

Expected output:
```
  MyFirstFHEVM
    ✓ Should deploy successfully
    ✓ Should set the owner
    ✓ Should have a counter

  3 passing (2s)
```

## Step 6: Deploy to Testnet

### Get Testnet ETH

1. Visit [Zama Faucet](https://faucet.zama.ai/)
2. Enter your wallet address
3. Receive test ETH

### Deploy

```bash
npm run deploy
```

Output:
```
Deploying MyFirstFHEVM...
Contract deployed to: 0x1234...
```

## Step 7: Interact with Your Contract

### Using Hardhat Console

```bash
npx hardhat console --network zamaTestnet
```

```javascript
// Get contract
const MyFirstFHEVM = await ethers.getContractFactory("MyFirstFHEVM");
const contract = MyFirstFHEVM.attach("0x1234...");  // Your deployed address

// Get counter
const counter = await contract.getCounter();
console.log("Counter:", counter);
```

### Using Frontend

See the `index.html` file for a complete Web3 integration example with:
- MetaMask wallet connection
- FHEVM client-side encryption
- Contract interaction

## What's Next?

Now that you have your first FHEVM contract running:

### Learn More Concepts

1. **Encrypted Types**: Learn about `ebool`, `euint8`, `euint32`, etc.
   - Read: [Encrypted Types Guide](api/encrypted-types.md)

2. **Access Control**: Understand `FHE.allow()` and `FHE.allowThis()`
   - Read: [Access Control Guide](access-control/what-is-access-control.md)

3. **Input Proofs**: Learn why and how to use input proofs
   - Read: [Input Proofs Guide](input-proofs/what-are-input-proofs.md)

### Explore Examples

1. **Basic Examples**: Simple, focused examples
   - [FHE Counter](basic/fhe-counter.md)
   - [Encrypted Boolean](basic/encrypted-boolean.md)
   - [Simple Arithmetic](basic/simple-arithmetic.md)

2. **Advanced Examples**: Production-ready implementations
   - [Privacy Training Record](advanced/privacy-training-record.md)
   - [Blind Auction](advanced/blind-auction.md)
   - [Confidential Voting](advanced/confidential-voting.md)

### Build Your Project

1. **Generate Category Project**: Multiple related examples
   ```bash
   npm run create-category
   # Choose: basic, encryption, access-control, or advanced
   ```

2. **Use Automation Tools**:
   ```bash
   # Generate documentation
   npm run generate-docs

   # Validate examples
   npm run validate

   # Update dependencies
   npm run update-deps
   ```

## Common Commands Reference

```bash
# Development
npm run compile          # Compile contracts
npm test                 # Run all tests
npm run test:coverage    # Test with coverage
npm run gas-report       # Gas usage report

# Deployment
npm run deploy           # Deploy to testnet
npm run deploy:local     # Deploy to local network
npm run verify           # Verify on block explorer

# Code Quality
npm run lint             # Lint Solidity code
npm run format           # Format code
npm run validate         # Validate examples

# Project Generation
npm run create-example   # Create single example
npm run create-category  # Create category project
npm run generate-docs    # Generate documentation

# Maintenance
npm run update-deps      # Check dependencies
npm run clean            # Clean artifacts
```

## Troubleshooting

### Contract won't compile

```bash
# Clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run compile
```

### Tests failing

```bash
# Make sure you have the latest dependencies
npm install

# Run specific test file
npm run test:basic
```

### Deployment fails

- Check your `.env` file has valid `PRIVATE_KEY`
- Ensure you have testnet ETH from the faucet
- Verify network configuration in `hardhat.config.ts`

### Need more help?

- Check [FAQ](resources/faq.md)
- Visit [Zama Discord](https://discord.gg/zama)
- Review [Documentation](https://docs.zama.ai/fhevm)

## Summary

You've learned to:
- ✅ Set up FHEVM development environment
- ✅ Write an encrypted smart contract
- ✅ Test FHEVM contracts
- ✅ Deploy to testnet
- ✅ Use automation tools

**Next Steps**: Explore [Basic Examples](basic/fhe-counter.md) or dive into [Advanced Examples](advanced/privacy-training-record.md)!

---

**Questions?** Check the [FAQ](resources/faq.md) or join [Zama Discord](https://discord.gg/zama).
