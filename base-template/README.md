# FHEVM Base Template

This is the base Hardhat template for creating FHEVM examples. It includes all necessary dependencies and configurations for building privacy-preserving smart contracts with FHEVM.

## What's Included

### Dependencies
- **Hardhat** - Ethereum development environment
- **@fhevm/solidity** - FHEVM Solidity library
- **fhevmjs** - Client-side FHE library
- **Ethers.js** - Ethereum interaction library
- **TypeScript** - Type-safe development

### Configuration
- **hardhat.config.ts** - Hardhat configuration with FHEVM support
- **tsconfig.json** - TypeScript compilation settings
- **package.json** - Project dependencies and scripts
- **.env.example** - Environment variable template

### Structure
```
base-template/
├── contracts/          # Smart contract source files
├── test/              # Test files
├── scripts/           # Deployment and utility scripts
├── deploy/            # Hardhat-deploy scripts
├── hardhat.config.ts  # Hardhat configuration
├── package.json       # Dependencies
└── README.md          # This file
```

## How to Use This Template

### Method 1: Using the Automation Script
```bash
# From the main project root
npm run create-example

# Follow the interactive prompts
```

### Method 2: Manual Setup
```bash
# Copy the template
cp -r base-template/ my-fhevm-example
cd my-fhevm-example
npm install
npm run compile
npm test
```

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/)
- [Developer Guide](../DEVELOPER_GUIDE.md)
