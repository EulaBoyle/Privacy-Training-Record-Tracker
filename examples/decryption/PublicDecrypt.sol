// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool, inEuint32, inEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PublicDecrypt
 * @notice Demonstrates public decryption patterns in FHEVM
 * @dev Shows threshold gates and decryption access patterns
 *
 * Learning objectives:
 * - Understand threshold decryption patterns
 * - Learn when values can be publicly revealed
 * - Explore programmatic decryption triggers
 * - See access control for sensitive decryptions
 */
contract PublicDecrypt is SepoliaConfig {
    // Encrypted proposals/values awaiting threshold
    mapping(uint256 => euint64) public encryptedProposals;
    mapping(uint256 => uint256) public proposalThresholds;
    mapping(uint256 => uint64) public decryptedResults;
    mapping(uint256 => bool) public isDecrypted;

    // Voting/contribution tracking (public)
    mapping(uint256 => uint256) public totalVotes;
    mapping(uint256 => bool) public canDecrypt;

    // Aggregated encrypted values
    mapping(address => euint64) public userContributions;
    mapping(address => bool) public hasContributed;

    // Encrypted state that gets decrypted when conditions met
    struct DecryptionGate {
        euint32 encryptedValue;
        uint256 threshold;
        bool isOpen;
        address opener;
    }

    mapping(bytes32 => DecryptionGate) public gates;

    // Events
    event ProposalCreated(uint256 indexed proposalId, uint256 threshold);
    event ProposalThresholdMet(uint256 indexed proposalId, uint256 totalVotes);
    event DecryptionTriggered(uint256 indexed proposalId, uint64 decryptedValue);
    event GateOpened(bytes32 indexed gateId, address opener);
    event ContributionAggregated(address indexed contributor, uint64 decryptedAmount);

    /**
     * @notice Create a proposal that requires threshold votes before decryption
     * @param proposalId Unique proposal identifier
     * @param encryptedValue Encrypted proposal value
     * @param threshold Number of votes needed to decrypt
     * @param inputProof Input proof
     */
    function createThresholdProposal(
        uint256 proposalId,
        inEuint64 calldata encryptedValue,
        uint256 threshold,
        bytes calldata inputProof
    ) external {
        require(threshold > 0, "Threshold must be > 0");
        require(!isDecrypted[proposalId], "Proposal already exists");

        euint64 value = FHE.asEuint64(encryptedValue, inputProof);

        encryptedProposals[proposalId] = value;
        proposalThresholds[proposalId] = threshold;
        totalVotes[proposalId] = 0;
        canDecrypt[proposalId] = false;

        emit ProposalCreated(proposalId, threshold);
    }

    /**
     * @notice Vote on a proposal (represents public vote count)
     * @param proposalId Proposal identifier
     * @dev When votes reach threshold, triggers decryption window
     */
    function voteOnProposal(uint256 proposalId) external {
        require(encryptedProposals[proposalId] != euint64.wrap(0), "Invalid proposal");
        require(!isDecrypted[proposalId], "Already decrypted");

        // Increment public vote count
        totalVotes[proposalId]++;

        // Check if threshold reached
        if (totalVotes[proposalId] >= proposalThresholds[proposalId]) {
            canDecrypt[proposalId] = true;
            emit ProposalThresholdMet(proposalId, totalVotes[proposalId]);
        }
    }

    /**
     * @notice Public function to request decryption after threshold met
     * @param proposalId Proposal identifier
     * @return Decrypted value (only accessible when threshold reached)
     * @dev Pattern: Encrypted value becomes public data when threshold met
     */
    function decryptAfterThreshold(uint256 proposalId) external returns (uint64) {
        require(encryptedProposals[proposalId] != euint64.wrap(0), "Invalid proposal");
        require(canDecrypt[proposalId], "Threshold not met");
        require(!isDecrypted[proposalId], "Already decrypted");

        // Mark as decrypted (prevents re-decryption)
        isDecrypted[proposalId] = true;

        // NOTE: In actual implementation, decryption happens off-chain
        // This is a placeholder showing the pattern
        // Real decryption would use threshold cryptography

        uint64 result = 0; // Placeholder for decrypted value
        decryptedResults[proposalId] = result;

        emit DecryptionTriggered(proposalId, result);

        return result;
    }

    /**
     * @notice Create decryption gate with permission control
     * @param gateId Unique gate identifier
     * @param encryptedValue Encrypted value behind gate
     * @param threshold Threshold for opening gate
     * @param inputProof Input proof
     */
    function createDecryptionGate(
        bytes32 gateId,
        inEuint32 calldata encryptedValue,
        uint256 threshold,
        bytes calldata inputProof
    ) external {
        require(threshold > 0, "Invalid threshold");

        euint32 value = FHE.asEuint32(encryptedValue, inputProof);

        gates[gateId] = DecryptionGate({
            encryptedValue: value,
            threshold: threshold,
            isOpen: false,
            opener: address(0)
        });
    }

    /**
     * @notice Open decryption gate when conditions met
     * @param gateId Gate identifier
     * @param proofOfCondition Evidence that condition is met
     * @dev Demonstrates permission-based decryption trigger
     */
    function openDecryptionGate(
        bytes32 gateId,
        bytes calldata proofOfCondition
    ) external {
        DecryptionGate storage gate = gates[gateId];
        require(!gate.isOpen, "Gate already open");
        require(gate.threshold > 0, "Invalid gate");

        // Verify condition (simplified pattern)
        // In production, this would verify the proof properly
        require(proofOfCondition.length > 0, "Invalid proof");

        gate.isOpen = true;
        gate.opener = msg.sender;

        emit GateOpened(gateId, msg.sender);
    }

    /**
     * @notice Demonstrate programmatic decryption on condition
     * @param proposalId Proposal requiring decryption
     * @return encrypted Encrypted value
     * @return canBeDecrypted Boolean indicating if decryption allowed
     */
    function checkDecryptionReadiness(
        uint256 proposalId
    ) external view returns (euint64 encrypted, bool canBeDecrypted) {
        encrypted = encryptedProposals[proposalId];
        canBeDecrypted = canDecrypt[proposalId] && !isDecrypted[proposalId];
        return (encrypted, canBeDecrypted);
    }

    /**
     * @notice Get decrypted result for a proposal
     * @param proposalId Proposal identifier
     * @return Result if decrypted, 0 if not yet
     */
    function getDecryptedResult(uint256 proposalId) external view returns (uint64) {
        if (isDecrypted[proposalId]) {
            return decryptedResults[proposalId];
        }
        return 0;
    }

    /**
     * @notice Check gate decryption status
     * @param gateId Gate identifier
     * @return isOpen Whether gate can be decrypted
     * @return opener Address that opened gate
     */
    function getGateStatus(
        bytes32 gateId
    ) external view returns (bool isOpen, address opener) {
        DecryptionGate memory gate = gates[gateId];
        return (gate.isOpen, gate.opener);
    }

    /**
     * @notice Add encrypted contribution that can be decrypted in batch
     * @param encryptedAmount Encrypted contribution amount
     * @param inputProof Input proof
     */
    function addEncryptedContribution(
        inEuint64 calldata encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

        userContributions[msg.sender] = amount;
        hasContributed[msg.sender] = true;

        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
    }

    /**
     * @notice Aggregate encrypted contributions
     * @param addresses Array of contributor addresses
     * @return aggregatedSum Encrypted sum
     * @dev Shows encrypted computation that can later be decrypted
     */
    function aggregateContributions(
        address[] calldata addresses
    ) external view returns (euint64) {
        require(addresses.length > 0, "Empty address list");

        euint64 sum = FHE.asEuint64(0);

        for (uint256 i = 0; i < addresses.length; i++) {
            if (hasContributed[addresses[i]]) {
                sum = FHE.add(sum, userContributions[addresses[i]]);
            }
        }

        return sum;
    }

    /**
     * @notice Demonstrate time-locked decryption pattern
     * @param proposalId Proposal identifier
     * @return encrypted Encrypted value
     * @return timestamp When decryption becomes available
     */
    function getTimeLocked(
        uint256 proposalId
    ) external view returns (euint64 encrypted, uint256 timestamp) {
        encrypted = encryptedProposals[proposalId];
        // Example: unlock after threshold met
        timestamp = canDecrypt[proposalId] ? block.timestamp : block.timestamp + 1 days;
        return (encrypted, timestamp);
    }

    /**
     * @notice Demonstrate role-based decryption access
     * @param gateId Gate identifier
     * @param requiredRole Role needed for decryption
     * @return hasAccess Whether caller has required role
     * @dev Simplified example of access control
     */
    function checkDecryptionAccess(
        bytes32 gateId,
        bytes32 requiredRole
    ) external view returns (bool hasAccess) {
        DecryptionGate memory gate = gates[gateId];

        // Simplified check - in production use proper RBAC
        hasAccess = gate.isOpen || msg.sender == gate.opener;

        return hasAccess;
    }

    /**
     * @notice Revoke decryption access
     * @param gateId Gate identifier
     * @dev Demonstrates permission revocation pattern
     */
    function revokeDecryptionAccess(bytes32 gateId) external {
        DecryptionGate storage gate = gates[gateId];

        require(msg.sender == gate.opener, "Only opener can revoke");

        gate.isOpen = false;
        gate.opener = address(0);
    }

    /**
     * @notice Check if value meets threshold for decryption
     * @param proposalId Proposal identifier
     * @return meetsThreshold Whether threshold is met
     */
    function meetsDecryptionThreshold(
        uint256 proposalId
    ) external view returns (bool) {
        return canDecrypt[proposalId];
    }

    /**
     * @notice Get all proposal metadata without decrypting
     * @param proposalId Proposal identifier
     * @return threshold Required votes
     * @return currentVotes Current vote count
     * @return isReady Ready for decryption
     */
    function getProposalMetadata(
        uint256 proposalId
    ) external view returns (uint256 threshold, uint256 currentVotes, bool isReady) {
        return (
            proposalThresholds[proposalId],
            totalVotes[proposalId],
            canDecrypt[proposalId]
        );
    }
}
