# Frequently Asked Questions (FAQ)

## General Questions

### What is FHEVM?
FHEVM (Fully Homomorphic Encryption Virtual Machine) is a blockchain technology that allows smart contracts to perform computations on encrypted data without decrypting it.

### Do I need to understand cryptography to use FHEVM?
No! FHEVM provides a simple Solidity API. You just need to understand:
- Encrypted types (`ebool`, `euint32`, etc.)
- FHE operations (`FHE.add()`, `FHE.eq()`, etc.)
- Permission management (`FHE.allow()`, `FHE.allowThis()`)

### Is FHEVM production-ready?
FHEVM is actively developed and available on testnet. Check the official Zama documentation for the latest production status and recommendations.

### Which blockchains support FHEVM?
Currently, FHEVM is available on:
- Zama Sepolia Testnet (for testing)
- Check [Zama's official site](https://www.zama.ai/) for mainnet availability

## Development Questions

### How do I get started?
1. Follow the [Quick Start Guide](../quick-start.md)
2. Try the [FHE Counter example](../basic/fhe-counter.md)
3. Build your own project using the [base template](../../base-template/)

### What tools do I need?
- Node.js v16+
- Hardhat
- @fhevm/solidity library
- fhevmjs (for frontend)
- MetaMask or compatible wallet

### How do I install FHEVM dependencies?
```bash
npm install @fhevm/solidity fhevmjs
```

### Can I use FHEVM with existing contracts?
Yes! You can integrate FHEVM into existing projects by:
1. Adding FHEVM dependencies
2. Converting sensitive data to encrypted types
3. Updating operations to use FHE functions

### How do I test FHEVM contracts?
Use Hardhat with FHEVM plugin:
```bash
npm install --save-dev @fhevm/hardhat-plugin
npm test
```

See [testing guide](../best-practices/testing.md) for details.

## Technical Questions

### What are encrypted types?
Encrypted types are Solidity types that store encrypted data:
- `ebool` - encrypted boolean
- `euint8`, `euint16`, `euint32`, `euint64` - encrypted integers
- `eaddress` - encrypted address

### What operations can I perform on encrypted data?
You can perform many operations:
- **Arithmetic**: add, sub, mul, div
- **Comparison**: eq, ne, lt, le, gt, ge
- **Logical**: and, or, xor, not
- **Conditional**: select (ternary operator)
- **Bitwise**: shl, shr, and, or, xor
- **Min/Max**: min, max

### What is FHE.allowThis()?
`FHE.allowThis()` grants the contract permission to use an encrypted value in future operations. **You must call this for every encrypted value.**

### What is FHE.allow()?
`FHE.allow(value, address)` grants a specific address permission to decrypt the encrypted value. Only authorized addresses can decrypt.

### Do I need to call both allowThis() and allow()?
**Yes!** Always call both:
```solidity
euint32 value = FHE.asEuint32(100);
FHE.allowThis(value);          // Contract can use
FHE.allow(value, msg.sender);  // User can decrypt
```

### What are input proofs?
Input proofs are zero-knowledge proofs that verify encrypted inputs are correctly bound to the contract and user. Always use them:
```solidity
function submitValue(
    inEuint32 calldata inputHandle,
    bytes calldata inputProof
) external {
    euint32 value = FHE.asEuint32(inputHandle, inputProof);
}
```

### Can I use encrypted values in view functions?
You can **return** encrypted values from view functions, but you **cannot** modify permissions:
```solidity
// ✅ OK - Just returning
function getValue() external view returns (euint32) {
    return encryptedValue;
}

// ❌ NOT OK - Cannot modify in view
function getValue() external view returns (euint32) {
    FHE.allow(encryptedValue, msg.sender);  // ❌ Error!
    return encryptedValue;
}
```

### How do I decrypt values?
Decryption happens on the client side using fhevmjs:
```javascript
const fhevm = await createFhevmInstance();
const encryptedValue = await contract.getValue();
const decrypted = await fhevm.decrypt(contractAddress, encryptedValue);
```

## Performance Questions

### How much gas do FHE operations cost?
FHE operations are more expensive than plain operations:
- Basic operations (add, sub): 2-5x more gas
- Complex operations (mul, div): 5-10x more gas
- Comparisons: 3-7x more gas

Use the smallest encrypted type that fits your data to minimize costs.

### Which encrypted type should I use?
Choose the smallest type for your data range:
- `ebool` for true/false (smallest)
- `euint8` for 0-255
- `euint16` for 0-65,535
- `euint32` for 0-4.3 billion
- `euint64` for larger values (largest, most expensive)

### How can I optimize gas costs?
1. Use smallest appropriate encrypted types
2. Minimize FHE operations in loops
3. Cache results instead of recomputing
4. Use `FHE.select()` instead of multiple operations
5. Batch operations when possible

## Error Questions

### "Not authorized" error when accessing encrypted data
**Cause**: Missing `FHE.allow()` permission for the user.

**Fix**: Grant permission when creating/updating the value:
```solidity
FHE.allow(encryptedValue, userAddress);
```

### Contract functions revert when using encrypted values
**Cause**: Missing `FHE.allowThis()` permission for the contract.

**Fix**: Always call `FHE.allowThis()`:
```solidity
FHE.allowThis(encryptedValue);
```

### "Invalid input proof" error
**Cause**: Input proof doesn't match the encrypted input or is for wrong contract/user.

**Fix**: Ensure client-side encryption uses correct contract and user addresses:
```javascript
const input = await fhevm.createEncryptedInput(
    correctContractAddress,
    correctUserAddress
);
```

### Test failures in Hardhat
**Cause**: Missing FHEVM Hardhat plugin or incorrect network configuration.

**Fix**: Install plugin and configure:
```bash
npm install --save-dev @fhevm/hardhat-plugin
```

```javascript
// hardhat.config.js
require("@fhevm/hardhat-plugin");
```

## Best Practices Questions

### When should I use FHEVM vs traditional contracts?
**Use FHEVM when**:
- Privacy is required
- Data should remain confidential
- Computations on sensitive data needed

**Use traditional contracts when**:
- All data can be public
- Gas costs are critical
- Privacy is not needed

### How do I handle access control?
Always check authorization before returning encrypted data:
```solidity
function getData(uint256 id) external view returns (euint32) {
    require(msg.sender == owner[id], "Not authorized");
    return encryptedData[id];
}
```

### Should I emit encrypted values in events?
**No!** Never emit decrypted sensitive data. Only emit public information:
```solidity
// ✅ Good
event DataUpdated(address indexed user);

// ❌ Bad
event DataUpdated(uint256 decryptedValue);
```

### How do I upgrade FHEVM contracts?
Use proxy patterns like OpenZeppelin's upgradeable contracts, but be careful with encrypted state:
1. Encrypted values may need permission reinitialization
2. Test upgrades thoroughly
3. Consider data migration carefully

## Deployment Questions

### Where can I deploy FHEVM contracts?
- **Testnet**: Zama Sepolia Testnet (recommended for development)
- **Mainnet**: Check Zama's official documentation for availability

### How do I get testnet ETH?
Visit the [Zama faucet](https://faucet.zama.ai/) to get testnet ETH for the Sepolia testnet.

### How do I verify contracts?
Use Hardhat verification:
```bash
npx hardhat verify --network zamaTestnet CONTRACT_ADDRESS
```

### Can I use the same contract on multiple networks?
Yes, but you may need to:
1. Update network configurations
2. Redeploy to each network
3. Update frontend to point to correct contract addresses

## Integration Questions

### How do I integrate FHEVM with my frontend?
1. Install fhevmjs: `npm install fhevmjs`
2. Create FHEVM instance
3. Encrypt inputs client-side
4. Send to contract with proofs
5. Decrypt results client-side

See [frontend integration guide](../getting-started/frontend-integration.md).

### Can I use FHEVM with React/Vue/Angular?
Yes! fhevmjs works with any JavaScript framework. See framework-specific examples in the documentation.

### How do I handle wallet connections?
Use standard Web3 libraries (ethers.js, web3.js) with MetaMask or other wallets. FHEVM adds encryption on top of normal transactions.

### Can FHEVM contracts interact with regular contracts?
Yes! FHEVM contracts can call regular contracts and vice versa. However, regular contracts cannot perform FHE operations on encrypted data.

## Troubleshooting

### Contract deploys but functions revert
**Check**:
1. All encrypted values have `FHE.allowThis()` called
2. Permissions set correctly
3. Input proofs provided for external inputs

### Frontend cannot decrypt values
**Check**:
1. `FHE.allow()` called for user address
2. Correct contract address used in decryption
3. User has permission for the specific value

### Gas estimates are very high
**This is normal** for FHE operations. To reduce:
1. Use smaller encrypted types
2. Minimize operations
3. Optimize contract logic

### Tests pass but frontend doesn't work
**Check**:
1. Network configuration matches
2. Contract address correct
3. fhevmjs initialized properly
4. Wallet connected to correct network

## Getting Help

### Where can I get support?
- **Discord**: [Zama Discord](https://discord.gg/zama)
- **Forum**: [Zama Community Forum](https://community.zama.ai/)
- **GitHub**: [FHEVM Issues](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [Official Docs](https://docs.zama.ai/fhevm)

### How do I report bugs?
1. Check existing issues on GitHub
2. Create a minimal reproduction example
3. Open issue with details
4. Include error messages and code samples

### How do I request features?
1. Check if feature is already requested
2. Open GitHub issue with use case
3. Discuss on Discord/Forum
4. Contribute if possible!

### Where can I find more examples?
- This project's [examples](../../examples/) directory
- [Official FHEVM examples](https://github.com/zama-ai/fhevm-examples)
- [Community projects](https://community.zama.ai/)

---

**Can't find your question?** Ask on [Discord](https://discord.gg/zama) or [open an issue](https://github.com/zama-ai/fhevm/issues)!
