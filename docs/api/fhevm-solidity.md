# FHEVM Solidity Library API Reference

## Overview

The `@fhevm/solidity` library provides the core functionality for working with Fully Homomorphic Encryption in Solidity smart contracts.

## Import Statement

```solidity
import { FHE, euint8, euint16, euint32, euint64, ebool, eaddress } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
```

## Encrypted Types

### ebool
Encrypted boolean type.

```solidity
ebool encryptedFlag;
```

**Range**: `true` or `false`
**Use Cases**: Flags, status indicators, yes/no values

### euint8
Encrypted 8-bit unsigned integer.

```solidity
euint8 smallNumber;
```

**Range**: 0 to 255
**Use Cases**: Small counters, levels, percentages

### euint16
Encrypted 16-bit unsigned integer.

```solidity
euint16 mediumNumber;
```

**Range**: 0 to 65,535
**Use Cases**: IDs, medium-sized counts

### euint32
Encrypted 32-bit unsigned integer.

```solidity
euint32 largeNumber;
```

**Range**: 0 to 4,294,967,295
**Use Cases**: Balances, scores, large counts

### euint64
Encrypted 64-bit unsigned integer.

```solidity
euint64 veryLargeNumber;
```

**Range**: 0 to 18,446,744,073,709,551,615
**Use Cases**: Timestamps, very large values

### eaddress
Encrypted Ethereum address.

```solidity
eaddress encryptedAddr;
```

**Range**: 20-byte Ethereum address
**Use Cases**: Private recipient addresses, confidential transfers

## FHE Library Functions

### Creating Encrypted Values

#### FHE.asEbool()
Convert boolean to encrypted boolean.

```solidity
ebool encrypted = FHE.asEbool(true);
```

**Parameters**:
- `value` (bool): Plain boolean value

**Returns**: `ebool` - Encrypted boolean

**Example**:
```solidity
ebool isActive = FHE.asEbool(true);
FHE.allowThis(isActive);
```

#### FHE.asEuint8() / asEuint16() / asEuint32() / asEuint64()
Convert integer to encrypted integer.

```solidity
euint32 encrypted = FHE.asEuint32(100);
```

**Parameters**:
- `value` (uint): Plain integer value

**Returns**: Encrypted integer of specified size

**Example**:
```solidity
euint8 level = FHE.asEuint8(5);
euint32 score = FHE.asEuint32(1000);
FHE.allowThis(level);
FHE.allowThis(score);
```

#### FHE.asEuintXX(inEuintXX, bytes)
Convert external encrypted input with proof.

```solidity
euint32 encrypted = FHE.asEuint32(inputHandle, inputProof);
```

**Parameters**:
- `inputHandle` (inEuint32): External encrypted input handle
- `inputProof` (bytes): Zero-knowledge proof

**Returns**: Internal encrypted value

**Example**:
```solidity
function submitValue(
    inEuint32 calldata inputHandle,
    bytes calldata inputProof
) external {
    euint32 value = FHE.asEuint32(inputHandle, inputProof);
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
}
```

### Permission Management

#### FHE.allowThis()
Grant contract permission to use encrypted value.

```solidity
FHE.allowThis(encryptedValue);
```

**Parameters**:
- `value`: Encrypted value (any encrypted type)

**Returns**: None

**When to Use**: **ALWAYS** after creating or modifying encrypted values

**Example**:
```solidity
euint32 value = FHE.asEuint32(100);
FHE.allowThis(value);  // Contract can now use this value
```

#### FHE.allow()
Grant address permission to decrypt encrypted value.

```solidity
FHE.allow(encryptedValue, userAddress);
```

**Parameters**:
- `value`: Encrypted value (any encrypted type)
- `account` (address): Address to grant permission to

**Returns**: None

**When to Use**: After creating encrypted values that users need to decrypt

**Example**:
```solidity
euint32 value = FHE.asEuint32(100);
FHE.allowThis(value);
FHE.allow(value, msg.sender);  // User can decrypt
FHE.allow(value, admin);       // Admin can decrypt
```

#### FHE.allowTransient()
Grant temporary permission that expires after transaction.

```solidity
FHE.allowTransient(encryptedValue, userAddress);
```

**Parameters**:
- `value`: Encrypted value
- `account` (address): Address to grant temporary permission

**Returns**: None

**Use Cases**: Temporary access for relay transactions, flash operations

### Arithmetic Operations

#### FHE.add()
Add two encrypted values.

```solidity
euint32 sum = FHE.add(a, b);
```

**Parameters**:
- `a`, `b`: Encrypted values of same type

**Returns**: Encrypted sum

**Example**:
```solidity
euint32 result = FHE.add(balance, deposit);
FHE.allowThis(result);
FHE.allow(result, msg.sender);
```

#### FHE.sub()
Subtract encrypted values.

```solidity
euint32 difference = FHE.sub(a, b);
```

**Parameters**:
- `a`, `b`: Encrypted values of same type

**Returns**: Encrypted difference

**Note**: Does not check for underflow. Use `FHE.select()` for conditional logic.

#### FHE.mul()
Multiply encrypted values.

```solidity
euint32 product = FHE.mul(a, b);
```

**Parameters**:
- `a`, `b`: Encrypted values of same type

**Returns**: Encrypted product

**Note**: More expensive than add/sub operations.

#### FHE.div()
Divide encrypted values.

```solidity
euint32 quotient = FHE.div(a, b);
```

**Parameters**:
- `a`, `b`: Encrypted values of same type

**Returns**: Encrypted quotient

**Note**: Division by zero returns 0.

#### FHE.rem()
Remainder of division.

```solidity
euint32 remainder = FHE.rem(a, b);
```

**Parameters**:
- `a`, `b`: Encrypted values of same type

**Returns**: Encrypted remainder

### Comparison Operations

#### FHE.eq()
Check equality.

```solidity
ebool isEqual = FHE.eq(a, b);
```

**Parameters**:
- `a`, `b`: Encrypted values of same type

**Returns**: `ebool` - Encrypted boolean result

#### FHE.ne()
Check inequality.

```solidity
ebool notEqual = FHE.ne(a, b);
```

#### FHE.lt() / FHE.le() / FHE.gt() / FHE.ge()
Comparison operations.

```solidity
ebool less = FHE.lt(a, b);        // a < b
ebool lessEq = FHE.le(a, b);      // a <= b
ebool greater = FHE.gt(a, b);     // a > b
ebool greaterEq = FHE.ge(a, b);   // a >= b
```

### Logical Operations

#### FHE.and()
Logical AND.

```solidity
ebool result = FHE.and(flag1, flag2);
```

#### FHE.or()
Logical OR.

```solidity
ebool result = FHE.or(flag1, flag2);
```

#### FHE.xor()
Logical XOR.

```solidity
ebool result = FHE.xor(flag1, flag2);
```

#### FHE.not()
Logical NOT.

```solidity
ebool result = FHE.not(flag);
```

### Conditional Operations

#### FHE.select()
Conditional select (ternary operator for encrypted values).

```solidity
euint32 result = FHE.select(condition, trueValue, falseValue);
```

**Parameters**:
- `condition` (ebool): Encrypted boolean condition
- `trueValue`: Value if condition is true
- `falseValue`: Value if condition is false

**Returns**: Selected encrypted value

**Example**:
```solidity
// result = (balance > threshold) ? balance : 0
ebool isAboveThreshold = FHE.gt(balance, threshold);
euint32 result = FHE.select(isAboveThreshold, balance, FHE.asEuint32(0));
```

### Bitwise Operations

#### FHE.shl() / FHE.shr()
Shift left/right.

```solidity
euint32 shifted = FHE.shl(value, bits);  // <<
euint32 shifted = FHE.shr(value, bits);  // >>
```

### Min/Max Operations

#### FHE.min() / FHE.max()
Get minimum or maximum value.

```solidity
euint32 minimum = FHE.min(a, b);
euint32 maximum = FHE.max(a, b);
```

## Configuration Classes

### SepoliaConfig
Configuration for Sepolia testnet.

```solidity
contract YourContract is SepoliaConfig {
    // Your contract code
}
```

### ZamaEthereumConfig
Configuration for Zama Ethereum network.

```solidity
contract YourContract is ZamaEthereumConfig {
    // Your contract code
}
```

## Best Practices

### Always Set Permissions
```solidity
✅ CORRECT:
euint32 value = FHE.asEuint32(100);
FHE.allowThis(value);          // Contract can use
FHE.allow(value, msg.sender);  // User can decrypt

❌ WRONG:
euint32 value = FHE.asEuint32(100);
// Missing permissions!
```

### Update Permissions After Operations
```solidity
✅ CORRECT:
euint32 result = FHE.add(a, b);
FHE.allowThis(result);          // Update for result
FHE.allow(result, msg.sender);

❌ WRONG:
euint32 result = FHE.add(a, b);
// Missing permission updates!
```

### Use Input Proofs
```solidity
✅ CORRECT:
function submitValue(
    inEuint32 calldata inputHandle,
    bytes calldata inputProof
) external {
    euint32 value = FHE.asEuint32(inputHandle, inputProof);
}

❌ WRONG:
function submitValue(uint32 value) external {
    euint32 encrypted = FHE.asEuint32(value);
    // No proof verification!
}
```

## Gas Costs

Approximate gas costs (relative):

| Operation | Cost Level |
|-----------|-----------|
| `asEuint` | Medium |
| `add/sub` | Medium |
| `mul` | High |
| `div` | Very High |
| `eq/ne` | Medium |
| `lt/le/gt/ge` | Medium-High |
| `select` | High |

## Common Patterns

### Store and Retrieve
```solidity
// Store
function store(uint32 value) external {
    stored = FHE.asEuint32(value);
    FHE.allowThis(stored);
    FHE.allow(stored, msg.sender);
}

// Retrieve
function retrieve() external view returns (euint32) {
    return stored;
}
```

### Conditional Logic
```solidity
// if (balance >= amount) balance -= amount;
ebool hasEnough = FHE.ge(balance, amount);
euint32 newBalance = FHE.sub(balance, amount);
balance = FHE.select(hasEnough, newBalance, balance);
```

### Access Control
```solidity
function getData() external view returns (euint32) {
    require(authorized[msg.sender], "Not authorized");
    return encryptedData;
}
```

## Resources

- [Official FHEVM Docs](https://docs.zama.ai/fhevm)
- [GitHub Repository](https://github.com/zama-ai/fhevm)
- [Examples](../examples/)

---

**Version**: @fhevm/solidity v0.1.0+
**Last Updated**: December 2025
