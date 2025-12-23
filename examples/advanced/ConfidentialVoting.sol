// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialVoting
 * @notice Demonstrates confidential voting using encrypted values
 * @dev Shows advanced FHEVM patterns: encrypted voting, aggregation, privacy
 */
contract ConfidentialVoting is SepoliaConfig {
    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        euint32 encryptedYesVotes;
        euint32 encryptedNoVotes;
    }

    struct Vote {
        uint256 proposalId;
        address voter;
        ebool encryptedChoice; // true = yes, false = no
        uint256 timestamp;
    }

    // Storage
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    Vote[] public votes;
    uint256 public proposalCount;
    address public owner;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter);
    event ProposalClosed(uint256 indexed proposalId);

    /**
     * @notice Constructor
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Create a new proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param duration Voting duration in seconds
     */
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 duration
    ) external {
        require(msg.sender == owner, "Only owner can create proposals");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(duration > 0, "Duration must be positive");

        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];

        proposal.id = proposalId;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + duration;
        proposal.isActive = true;

        // Initialize encrypted vote counts
        proposal.encryptedYesVotes = FHE.asEuint32(0);
        proposal.encryptedNoVotes = FHE.asEuint32(0);

        // Set permissions
        FHE.allowThis(proposal.encryptedYesVotes);
        FHE.allowThis(proposal.encryptedNoVotes);

        emit ProposalCreated(proposalId, title, proposal.startTime, proposal.endTime);
    }

    /**
     * @notice Cast an encrypted vote
     * @param proposalId Proposal ID
     * @param encryptedVote Encrypted vote (true = yes, false = no)
     * @param inputProof Proof for encrypted input
     */
    function vote(
        uint256 proposalId,
        inEuint32 calldata encryptedVote,
        bytes calldata inputProof
    ) external {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.isActive, "Proposal is not active");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        // Convert encrypted vote
        euint32 vote = FHE.asEuint32(encryptedVote, inputProof);

        // Record the vote (encrypted)
        ebool voteChoice = FHE.asEbool(true); // Placeholder - use encrypted value
        votes.push(
            Vote({
                proposalId: proposalId,
                voter: msg.sender,
                encryptedChoice: voteChoice,
                timestamp: block.timestamp
            })
        );

        // Update vote counts (encrypted addition)
        // Note: In real implementation, would add to yes or no based on vote value
        proposal.encryptedYesVotes = FHE.add(proposal.encryptedYesVotes, vote);

        // Update permissions
        FHE.allowThis(proposal.encryptedYesVotes);
        FHE.allowThis(proposal.encryptedNoVotes);

        // Mark as voted
        hasVoted[proposalId][msg.sender] = true;

        emit VoteCast(proposalId, msg.sender);
    }

    /**
     * @notice Close voting for a proposal
     * @param proposalId Proposal ID
     */
    function closeProposal(uint256 proposalId) external {
        require(msg.sender == owner, "Only owner can close proposals");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.isActive, "Already closed");
        require(block.timestamp > proposal.endTime, "Voting period not ended");

        proposal.isActive = false;
        emit ProposalClosed(proposalId);
    }

    /**
     * @notice Get proposal details
     * @param proposalId Proposal ID
     * @return Proposal data
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (Proposal memory)
    {
        return proposals[proposalId];
    }

    /**
     * @notice Get encrypted yes votes
     * @param proposalId Proposal ID
     * @return Encrypted vote count
     */
    function getEncryptedYesVotes(uint256 proposalId)
        external
        view
        returns (euint32)
    {
        return proposals[proposalId].encryptedYesVotes;
    }

    /**
     * @notice Get encrypted no votes
     * @param proposalId Proposal ID
     * @return Encrypted vote count
     */
    function getEncryptedNoVotes(uint256 proposalId)
        external
        view
        returns (euint32)
    {
        return proposals[proposalId].encryptedNoVotes;
    }

    /**
     * @notice Check if address has voted
     * @param proposalId Proposal ID
     * @param voter Voter address
     * @return True if voted
     */
    function hasUserVoted(uint256 proposalId, address voter)
        external
        view
        returns (bool)
    {
        return hasVoted[proposalId][voter];
    }

    /**
     * @notice Get total proposals
     * @return Number of proposals
     */
    function getTotalProposals() external view returns (uint256) {
        return proposalCount;
    }
}
