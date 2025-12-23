# Public Decryption Example

## Overview

This example demonstrates public decryption patterns in FHEVM, where encrypted values become publicly decryptable under specific conditions. This is essential for applications requiring threshold-based reveals, governance tokens, and privacy-preserving data aggregation.

## Key Concepts

### 1. Threshold-Based Decryption

Values are encrypted initially but can be decrypted once a threshold is reached:

```
Encrypted Value (Private)
    ↓
Votes/Conditions Accumulate
    ↓
Threshold Met
    ↓
Decryption Triggered (Public)
```

### 2. Decryption Gates

Gates control access to encrypted data with permission requirements:

```solidity
struct DecryptionGate {
    euint32 encryptedValue;
    uint256 threshold;
    bool isOpen;
    address opener;
}
```

### 3. Access Patterns

- **Time-locked**: Decryption after specific block height
- **Vote-based**: Decryption after vote threshold
- **Role-based**: Decryption if caller has required role
- **Condition-based**: Decryption when external condition met

## Smart Contract Functions

### Create Threshold Proposal
```solidity
function createThresholdProposal(
    uint256 proposalId,
    inEuint64 calldata encryptedValue,
    uint256 threshold,
    bytes calldata inputProof
) external
```
- Creates proposal with encrypted value
- Requires specific number of votes to decrypt
- Only callable once per proposal ID

### Vote on Proposal
```solidity
function voteOnProposal(uint256 proposalId) external
```
- Increments public vote count
- Automatically triggers decryption window if threshold met
- Public operation (vote counts are visible)

### Decrypt After Threshold
```solidity
function decryptAfterThreshold(uint256 proposalId) external returns (uint64)
```
- Retrieves encrypted value for voting/decryption
- Only succeeds if threshold met
- Prevents double decryption

### Create Decryption Gate
```solidity
function createDecryptionGate(
    bytes32 gateId,
    inEuint32 calldata encryptedValue,
    uint256 threshold,
    bytes calldata inputProof
) external
```
- Creates gate protecting encrypted data
- Gate starts closed

### Open Decryption Gate
```solidity
function openDecryptionGate(
    bytes32 gateId,
    bytes calldata proofOfCondition
) external
```
- Opens gate if condition proven
- Stores opener's address
- Once opened, value becomes viewable to authorized parties

### Aggregate Contributions
```solidity
function aggregateContributions(
    address[] calldata addresses
) external view returns (euint64)
```
- Returns encrypted sum of all contributions
- Sum remains encrypted until decryption triggered
- Useful for privacy-preserving data collection

## Usage Patterns

### Pattern 1: Voted Reveal

```javascript
// 1. Create proposal
const proposalId = 1;
const threshold = 100; // Need 100 votes
const input = createEncryptedInput(contractAddress);
const encValue = input.add64(secretValue);
const encrypted = encValue.encrypt();

const tx = await contract.createThresholdProposal(
  proposalId,
  encrypted.handles[0],
  threshold,
  encrypted.inputProof
);
await tx.wait();

// 2. Users vote
for (let i = 0; i < 100; i++) {
  await contract.connect(voter[i]).voteOnProposal(proposalId);
}

// 3. Trigger decryption when ready
const metadata = await contract.getProposalMetadata(proposalId);
if (metadata.isReady) {
  const decryptTx = await contract.decryptAfterThreshold(proposalId);
  await decryptTx.wait();

  // 4. Get decrypted value
  const result = await contract.getDecryptedResult(proposalId);
  console.log("Decrypted value:", result);
}
```

### Pattern 2: Gated Access

```javascript
// 1. Create gate
const gateId = ethers.id("secret_gate");
const input = createEncryptedInput(contractAddress);
const encSecret = input.add32(secretData);
const encrypted = encSecret.encrypt();

await contract.createDecryptionGate(
  gateId,
  encrypted.handles[0],
  5, // threshold
  encrypted.inputProof
);

// 2. Prove condition met
const proof = generateProof(); // Custom proof logic

// 3. Open gate
await contract.openDecryptionGate(gateId, proof);

// 4. Retrieve encrypted value
const encryptedGate = await contract.getSharedData(gateId);
// Authorized parties can now see this value
```

### Pattern 3: Batch Aggregation

```javascript
// Multiple users contribute encrypted amounts
const contributions = [];

for (let i = 0; i < users.length; i++) {
  const input = createEncryptedInput(contractAddress, userAddresses[i]);
  const encAmount = input.add64(amounts[i]);
  const encrypted = encAmount.encrypt();

  await contract.connect(signers[i]).addEncryptedContribution(
    encrypted.handles[0],
    encrypted.inputProof
  );

  contributions.push(amounts[i]);
}

// Later: Aggregate all contributions (stays encrypted)
const aggregated = await contract.aggregateContributions(userAddresses);

// When conditions met, aggregate can be decrypted
const decrypted = await instances.decrypt64(aggregated);
console.log("Total contributions:", decrypted);
```

## Real-World Use Cases

### 1. Decentralized Voting with Secret Outcomes
```solidity
// Votes are encrypted - outcome hidden until threshold
function createSecretBallot(
    uint256 electionId,
    inEuint32 calldata encryptedVoteCount,
    uint256 revealThreshold,
    bytes calldata proof
) external {
    // Vote counts hidden
    // Results revealed once threshold votes reached
}
```

### 2. Confidential Fundraising
```solidity
// Contributions encrypted until target reached
function addConfidentialContribution(
    inEuint64 calldata encryptedAmount,
    bytes calldata proof
) external {
    // Amount private
    // Total only visible at milestone
}
```

### 3. Sealed Auction with Hidden Bids
```solidity
// Bids encrypted until auction closes
function placeSealedBid(
    inEuint64 calldata encryptedBid,
    bytes calldata proof
) external {
    // Bid amount hidden from others
    // Winner only revealed after close
}
```

### 4. Privacy-Preserving Analytics
```solidity
// Data encrypted until statistical threshold
function submitDataPoint(
    inEuint32 calldata encryptedData,
    bytes calldata proof
) external {
    // Individual data private
    // Aggregates shown only when anonymity threshold met
}
```

## Security Considerations

### 1. Threshold Protection
```solidity
// Always check threshold before decryption
require(meetsDecryptionThreshold(proposalId), "Threshold not met");
```

### 2. Prevention of Double Decryption
```solidity
// Track decryption state
if (isDecrypted[proposalId]) {
    revert("Already decrypted");
}
isDecrypted[proposalId] = true;
```

### 3. Proof Verification
```solidity
// Validate proofs for gate opening
require(verifyConditionProof(proof), "Invalid proof");
```

### 4. Access Control
```solidity
// Limit who can trigger decryption
require(hasRole(DECRYPTION_ROLE, msg.sender), "Not authorized");
```

## Testing Scenarios

### Test 1: Threshold Progression
```javascript
const proposalId = 1;
const threshold = 3;

// Create proposal
await contract.createThresholdProposal(proposalId, enc.handles[0], threshold, enc.inputProof);

// Vote progression
expect(await contract.meetsDecryptionThreshold(proposalId)).to.be.false;

await contract.connect(voter1).voteOnProposal(proposalId);
expect(await contract.meetsDecryptionThreshold(proposalId)).to.be.false;

await contract.connect(voter2).voteOnProposal(proposalId);
expect(await contract.meetsDecryptionThreshold(proposalId)).to.be.false;

await contract.connect(voter3).voteOnProposal(proposalId);
expect(await contract.meetsDecryptionThreshold(proposalId)).to.be.true;
```

### Test 2: Gate Opening
```javascript
const gateId = ethers.id("test_gate");
const [isOpen1, opener1] = await contract.getGateStatus(gateId);
expect(isOpen1).to.be.false;

await contract.openDecryptionGate(gateId, proof);
const [isOpen2, opener2] = await contract.getGateStatus(gateId);
expect(isOpen2).to.be.true;
```

### Test 3: Aggregation with Multiple Contributors
```javascript
const contributors = [user1, user2, user3];
const amounts = [100n, 200n, 300n];

// Each contributes
for (let i = 0; i < contributors.length; i++) {
  const input = createInput(...);
  const enc = input.add64(amounts[i]).encrypt();
  await contract.addEncryptedContribution(enc.handles[0], enc.inputProof);
}

// Aggregate (result encrypted)
const aggregated = await contract.aggregateContributions(
  contributors.map(c => c.address)
);

// Verify sum is correct
const decrypted = await instances.decrypt64(aggregated);
expect(decrypted).to.equal(600n);
```

## Advanced Patterns

### Time-Locked with Vote Requirement
```solidity
struct TimeLocked {
    euint64 value;
    uint256 unlockBlock;
    uint256 voteThreshold;
    uint256 votes;
}

function unlockWithVotes(uint256 id) external {
    require(block.number >= timeLocked[id].unlockBlock, "Not unlocked");
    require(timeLocked[id].votes >= timeLocked[id].voteThreshold, "No votes");

    // Now decryption allowed
}
```

### Multi-Stage Reveal
```solidity
enum RevealStage {
    HIDDEN,      // Encrypted, hidden
    THRESHOLD_MET, // Encrypted, but decryptable
    REVEALED     // Decrypted publicly
}

RevealStage public stage;

function canDecrypt() public view returns (bool) {
    return stage == RevealStage.THRESHOLD_MET;
}

function revealNow() external onlyOwner {
    require(meetsCondition(), "Conditions not met");
    stage = RevealStage.REVEALED;
}
```

### Batch Decryption with Authorization
```solidity
function batchDecryptWithAuth(
    uint256[] calldata proposalIds,
    bytes[] calldata proofs
) external onlyRole(DECRYPTION_ROLE) {
    for (uint256 i = 0; i < proposalIds.length; i++) {
        require(meetsDecryptionThreshold(proposalIds[i]), "Threshold not met");
        require(verifyProof(proposalIds[i], proofs[i]), "Invalid proof");

        decryptAfterThreshold(proposalIds[i]);
    }
}
```

## Comparison: User vs Public Decryption

| Aspect | User Decryption | Public Decryption |
|--------|-----------------|-------------------|
| Permission | User holds private key | Triggered by conditions |
| Timing | Anytime after storage | When threshold/condition met |
| Visibility | Only to permitted users | Can be public once unlocked |
| Use Case | Personal data | Governance, auctions |
| Reversibility | User can re-encrypt | Permanent once revealed |
| Example | Checking balance | Vote outcome reveal |

## Related Examples

- **UserDecrypt.sol**: Client-side decryption patterns
- **InputProofPatterns.sol**: Input proof handling
- **ConfidentialERC20.sol**: Token transfer patterns
- **ConfidentialVoting.sol**: Voting with privacy

## Key Takeaways

1. **Threshold Gating**: Use vote counts or conditions to trigger decryption
2. **Permission Control**: `FHE.allow()` even for public decryption
3. **State Tracking**: Maintain flags to prevent double decryption
4. **Proof Validation**: Verify all conditions before enabling decryption
5. **User Responsibility**: Even public decryption needs explicit triggering

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Threshold never reached | Check vote counting logic |
| Gate won't open | Verify proof format and condition |
| Double decryption allowed | Add `isDecrypted` flag check |
| Aggregation fails | Ensure all contributors have permissions |
| Decryption returns zero | Check if encrypted values were stored |

