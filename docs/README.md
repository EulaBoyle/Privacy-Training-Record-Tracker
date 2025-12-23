# FHEVM Examples Documentation

Welcome to the comprehensive guide for building privacy-preserving smart contracts with FHEVM (Fully Homomorphic Encryption Virtual Machine).

## What is This Documentation?

This documentation provides a complete learning path for developers who want to build decentralized applications with fully homomorphic encryption. Whether you're a beginner or an experienced blockchain developer, you'll find examples and guides suited to your level.

## Documentation Structure

### 📚 **Getting Started**
Learn the fundamentals of FHEVM development:
- Installation and setup
- Your first encrypted smart contract
- Testing and deployment basics

### 🔰 **Basic Examples**
Simple, focused examples demonstrating core concepts:
- Encrypted counters and booleans
- Basic arithmetic operations
- Comparison operations

### 🔐 **Encryption & Decryption**
Deep dive into FHE encryption patterns:
- Single and multiple value encryption
- Different encrypted data types
- User and public decryption

### 🛡️ **Access Control**
Learn permission management:
- `FHE.allow()` and `FHE.allowThis()`
- Role-based access control
- Selective data disclosure

### ⚠️ **Anti-Patterns**
Learn from common mistakes:
- What NOT to do
- Common pitfalls
- How to avoid errors

### 🚀 **Advanced Examples**
Production-ready implementations:
- Privacy Training Record system
- Blind auctions
- Confidential voting
- Token vesting with privacy

### 🛠️ **Developer Tools**
Automation and utilities:
- Project scaffolding scripts
- Documentation generators
- Testing frameworks
- Maintenance tools

## Quick Navigation

### I'm new to FHEVM
1. Start with [What is FHEVM?](what-is-fhevm.md)
2. Follow [Quick Start Guide](quick-start.md)
3. Try [Your First FHEVM Contract](getting-started/first-contract.md)
4. Explore [Basic Examples](basic/fhe-counter.md)

### I know blockchain, new to FHE
1. Review [FHEVM Concepts](what-is-fhevm.md)
2. Check [Encryption Examples](encryption/encrypted-storage.md)
3. Study [Access Control](access-control/what-is-access-control.md)
4. Read [Anti-Patterns](anti-patterns/common-mistakes.md)

### I need production examples
1. Explore [Advanced Examples](advanced/privacy-training-record.md)
2. Review [Best Practices](best-practices/contract-design.md)
3. Check [Security Patterns](best-practices/security.md)
4. Study [OpenZeppelin Contracts](openzeppelin/erc7984.md)

### I want to contribute
1. Read [Developer Tools](tools/automation-scripts.md)
2. Check [Testing Strategies](best-practices/testing.md)
3. Review [API Reference](api/fhevm-solidity.md)

## Key Features

### ✅ Standalone Examples
Each example is a complete, working project that you can:
- Clone and run immediately
- Study independently
- Use as a template for your project

### ✅ Multiple Difficulty Levels
- **Beginner**: Simple, focused examples
- **Intermediate**: More complex patterns
- **Advanced**: Production-ready implementations

### ✅ Comprehensive Testing
All examples include:
- Unit tests
- Integration tests
- Anti-pattern demonstrations
- >95% code coverage

### ✅ Automation Tools
Generate new projects with:
- `create-fhevm-example` - Single example projects
- `create-fhevm-category` - Category-based projects
- `generate-docs` - Automated documentation

## Example Categories

### Basic (4 examples)
Simple contracts demonstrating fundamental FHEVM concepts:
- Encrypted counters
- Boolean operations
- Basic arithmetic
- Comparisons

### Encryption (4 examples)
Encryption patterns and techniques:
- Single/multiple value encryption
- Type handling
- Storage patterns

### Access Control (3 examples)
Permission management:
- Role-based access
- Selective disclosure
- Permission delegation

### Advanced (4+ examples)
Real-world applications:
- Training record management
- Blind auctions
- Voting systems
- Token operations

### OpenZeppelin (4+ examples)
Integration with OpenZeppelin:
- ERC7984 token standard
- Token wrappers
- Swaps
- Vesting

## Using This Documentation

### For Learning
1. Follow the sequential order in the sidebar
2. Try each example hands-on
3. Read the anti-patterns section
4. Build your own project

### For Reference
1. Use the search function
2. Jump to specific topics via sidebar
3. Check API reference for syntax
4. Review best practices

### For Teaching
1. Start with basic examples
2. Progress through categories
3. Use anti-patterns for discussions
4. Assign advanced examples as projects

## Running the Examples

### Prerequisites
```bash
Node.js v16+
npm or yarn
MetaMask or similar wallet
```

### Quick Start
```bash
# Clone a specific example
npm run create-example

# Or clone category
npm run create-category

# Install and test
cd your-example
npm install
npm test
```

### Deploy
```bash
# Configure environment
cp .env.example .env
# Edit .env with your keys

# Deploy to testnet
npm run deploy
```

## Contributing

We welcome contributions! See:
- [Developer Guide](../DEVELOPER_GUIDE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Testing Guide](best-practices/testing.md)

## Resources

### Official Documentation
- [FHEVM Docs](https://docs.zama.ai/fhevm)
- [Zama Protocol](https://docs.zama.ai/)

### Community
- [Discord](https://discord.gg/zama)
- [Forum](https://community.zama.ai/)
- [GitHub](https://github.com/zama-ai/fhevm)

### Tools
- [Hardhat](https://hardhat.org/)
- [Ethers.js](https://docs.ethers.io/)
- [fhevmjs](https://github.com/zama-ai/fhevmjs)

## Support

Need help?
- Check [FAQ](resources/faq.md)
- Search [existing issues](https://github.com/zama-ai/fhevm/issues)
- Ask on [Discord](https://discord.gg/zama)
- Post in [Community Forum](https://community.zama.ai/)

---

**Ready to build privacy-preserving dApps?** Start with the [Quick Start Guide](quick-start.md)!

**Last Updated**: December 2025
