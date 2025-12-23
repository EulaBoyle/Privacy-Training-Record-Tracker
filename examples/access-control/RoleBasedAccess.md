# Role-Based Access Control Example

## Overview

This example demonstrates implementing role-based access control for encrypted data, showing how to manage permissions for different user roles.

## Concepts Demonstrated

- **Role-Based Permissions**: Admin, Manager, User roles
- **Selective Decryption**: Different roles see different data
- **Permission Delegation**: Granting and revoking access
- **Access Patterns**: Best practices for encrypted data access

## Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract RoleBasedAccess is SepoliaConfig {
    struct Record {
        address owner;
        euint32 sensitiveData;
        euint32 publicData;
    }

    mapping(uint256 => Record) public records;
    mapping(address => bool) public managers;
    address public admin;
    uint256 public recordCount;

    event ManagerAdded(address indexed manager);
    event ManagerRemoved(address indexed manager);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyManager() {
        require(managers[msg.sender] || msg.sender == admin, "Only manager");
        _;
    }

    constructor() {
        admin = msg.sender;
        managers[msg.sender] = true;
    }

    function addManager(address _manager) external onlyAdmin {
        managers[_manager] = true;
        emit ManagerAdded(_manager);
    }

    function removeManager(address _manager) external onlyAdmin {
        managers[_manager] = false;
        emit ManagerRemoved(_manager);
    }

    function createRecord(uint32 _sensitiveData, uint32 _publicData) external returns (uint256) {
        uint256 recordId = recordCount++;
        Record storage record = records[recordId];

        record.owner = msg.sender;
        record.sensitiveData = FHE.asEuint32(_sensitiveData);
        record.publicData = FHE.asEuint32(_publicData);

        // Contract needs access
        FHE.allowThis(record.sensitiveData);
        FHE.allowThis(record.publicData);

        // Owner can access both
        FHE.allow(record.sensitiveData, msg.sender);
        FHE.allow(record.publicData, msg.sender);

        // Admin can access both
        FHE.allow(record.sensitiveData, admin);
        FHE.allow(record.publicData, admin);

        return recordId;
    }

    function grantManagerAccess(uint256 _recordId, address _manager) external {
        Record storage record = records[_recordId];
        require(msg.sender == record.owner || msg.sender == admin, "Not authorized");
        require(managers[_manager], "Not a manager");

        // Managers get access to public data only
        FHE.allow(record.publicData, _manager);
    }

    function getSensitiveData(uint256 _recordId) external view returns (euint32) {
        Record storage record = records[_recordId];
        require(
            msg.sender == record.owner || msg.sender == admin,
            "Not authorized for sensitive data"
        );
        return record.sensitiveData;
    }

    function getPublicData(uint256 _recordId) external view returns (euint32) {
        Record storage record = records[_recordId];
        require(
            msg.sender == record.owner ||
            managers[msg.sender] ||
            msg.sender == admin,
            "Not authorized"
        );
        return record.publicData;
    }
}
```

## Access Matrix

| Role | Sensitive Data | Public Data | Manage Roles |
|------|---------------|-------------|--------------|
| Admin | ✅ All | ✅ All | ✅ Yes |
| Manager | ❌ No | ✅ Granted | ❌ No |
| Owner | ✅ Own | ✅ Own | ❌ No |
| Other | ❌ No | ❌ No | ❌ No |

## Key Patterns

### 1. Role Modifiers
```solidity
modifier onlyAdmin() {
    require(msg.sender == admin, "Only admin");
    _;
}

modifier onlyManager() {
    require(managers[msg.sender] || msg.sender == admin, "Only manager");
    _;
}
```

### 2. Selective Permission Granting
```solidity
// Owner gets all permissions
FHE.allow(record.sensitiveData, owner);
FHE.allow(record.publicData, owner);

// Managers get limited permissions
FHE.allow(record.publicData, manager);
// Note: sensitiveData NOT granted to managers
```

### 3. Authorization Checks
```solidity
require(
    msg.sender == record.owner || msg.sender == admin,
    "Not authorized for sensitive data"
);
```

## Usage Example

```javascript
// Admin creates a record
await contract.connect(admin).createRecord(1000, 500);

// Owner decrypts their data
const sensitive = await contract.connect(owner).getSensitiveData(0);
const sensitiveValue = await fhevm.decrypt(contractAddress, sensitive);

// Grant manager access to public data
await contract.connect(owner).grantManagerAccess(0, managerAddress);

// Manager can only access public data
const publicData = await contract.connect(manager).getPublicData(0);
// Attempting to access sensitive data will revert
```

## Learning Points

✅ **DO:**
- Implement clear role hierarchies
- Grant minimal necessary permissions
- Check authorization before returning encrypted data
- Document access patterns clearly

❌ **DON'T:**
- Grant blanket permissions to all roles
- Skip authorization checks
- Allow unauthorized permission delegation
- Forget to revoke permissions when needed

## Security Considerations

1. **Permission Granularity**: Grant access to specific fields, not entire records
2. **Permission Lifecycle**: Implement revocation mechanisms
3. **Role Management**: Secure role assignment functions
4. **Audit Trail**: Emit events for permission changes

## Running This Example

```bash
npm run create-example
# Select "Role-Based Access Control"
cd role-based-access-example
npm install && npm test
```

---

**Category**: Access Control
**Difficulty**: Advanced
**Concepts**: Roles, Permissions, Selective access, Authorization
