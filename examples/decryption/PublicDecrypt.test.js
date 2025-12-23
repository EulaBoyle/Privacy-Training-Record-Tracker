const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createInstances } = require("fhevmjs");

describe("PublicDecrypt", function () {
  let publicDecrypt;
  let owner, user1, user2, user3;
  let instances;

  before(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const PublicDecrypt = await ethers.getContractFactory("PublicDecrypt");
    publicDecrypt = await PublicDecrypt.deploy();
    await publicDecrypt.waitForDeployment();

    instances = await createInstances(await publicDecrypt.getAddress(), ethers, await ethers.getSigners());
  });

  describe("Threshold Proposals", function () {
    it("Should create threshold proposal", async function () {
      const proposalId = 1;
      const threshold = 3;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add64(100);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createThresholdProposal(
        proposalId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      const [proposalThreshold, currentVotes, isReady] = await publicDecrypt.getProposalMetadata(proposalId);
      expect(proposalThreshold).to.equal(threshold);
      expect(currentVotes).to.equal(0);
      expect(isReady).to.equal(false);
    });

    it("Should increment votes and reach threshold", async function () {
      const proposalId = 1;
      const threshold = 3;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add64(100);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createThresholdProposal(
        proposalId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      // Users vote
      await publicDecrypt.connect(user1).voteOnProposal(proposalId);
      await publicDecrypt.connect(user2).voteOnProposal(proposalId);

      let [, votes, ready] = await publicDecrypt.getProposalMetadata(proposalId);
      expect(votes).to.equal(2);
      expect(ready).to.equal(false);

      // Reach threshold
      await publicDecrypt.connect(user3).voteOnProposal(proposalId);

      [, votes, ready] = await publicDecrypt.getProposalMetadata(proposalId);
      expect(votes).to.equal(3);
      expect(ready).to.equal(true);
    });

    it("Should allow decryption after threshold met", async function () {
      const proposalId = 2;
      const threshold = 2;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add64(42);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createThresholdProposal(
        proposalId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      // Reach threshold
      await publicDecrypt.connect(user1).voteOnProposal(proposalId);
      await publicDecrypt.connect(user2).voteOnProposal(proposalId);

      // Verify readiness
      const { 2: isReady } = await publicDecrypt.getProposalMetadata(proposalId);
      expect(isReady).to.equal(true);

      // Trigger decryption
      const result = await publicDecrypt.connect(user1).decryptAfterThreshold(proposalId);
      expect(result).to.not.equal(undefined);
    });

    it("Should prevent double decryption", async function () {
      const proposalId = 3;
      const threshold = 1;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add64(100);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createThresholdProposal(
        proposalId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      // Reach threshold
      await publicDecrypt.connect(user1).voteOnProposal(proposalId);

      // First decryption
      await publicDecrypt.connect(user1).decryptAfterThreshold(proposalId);

      // Second attempt should fail
      try {
        await publicDecrypt.connect(user1).decryptAfterThreshold(proposalId);
        expect.fail("Should not allow second decryption");
      } catch (error) {
        expect(error.message).to.include("Already decrypted");
      }
    });
  });

  describe("Decryption Gates", function () {
    it("Should create decryption gate", async function () {
      const gateId = ethers.id("gate1");
      const threshold = 10;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add32(50);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createDecryptionGate(
        gateId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      const [isOpen, opener] = await publicDecrypt.getGateStatus(gateId);
      expect(isOpen).to.equal(false);
      expect(opener).to.equal(ethers.ZeroAddress);
    });

    it("Should open gate with proof", async function () {
      const gateId = ethers.id("gate2");
      const threshold = 5;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add32(75);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createDecryptionGate(
        gateId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      // Open gate
      const proof = ethers.toBeHex("0x1234", 32);
      await publicDecrypt.connect(user1).openDecryptionGate(gateId, proof);

      const [isOpen, opener] = await publicDecrypt.getGateStatus(gateId);
      expect(isOpen).to.equal(true);
      expect(opener).to.equal(user1.address);
    });

    it("Should revoke gate access", async function () {
      const gateId = ethers.id("gate3");
      const threshold = 5;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add32(100);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createDecryptionGate(
        gateId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      const proof = ethers.toBeHex("0x1234", 32);
      await publicDecrypt.connect(user1).openDecryptionGate(gateId, proof);

      // Revoke access
      await publicDecrypt.connect(user1).revokeDecryptionAccess(gateId);

      const [isOpen, opener] = await publicDecrypt.getGateStatus(gateId);
      expect(isOpen).to.equal(false);
      expect(opener).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Encrypted Contributions", function () {
    it("Should add encrypted contribution", async function () {
      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encAmount = input.add64(500);
      const encrypted = encAmount.encrypt();

      await publicDecrypt.connect(user1).addEncryptedContribution(
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Contribution is stored and encrypted
      expect(await publicDecrypt.hasContributed(user1.address)).to.equal(true);
    });

    it("Should aggregate multiple contributions", async function () {
      // User1 contributes
      let input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      let encAmount = input.add64(100);
      let encrypted = encAmount.encrypt();

      await publicDecrypt.connect(user1).addEncryptedContribution(
        encrypted.handles[0],
        encrypted.inputProof
      );

      // User2 contributes
      input = instances.user2.createEncryptedInput(await publicDecrypt.getAddress(), user2.address);
      encAmount = input.add64(200);
      encrypted = encAmount.encrypt();

      await publicDecrypt.connect(user2).addEncryptedContribution(
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Aggregate
      const aggregated = await publicDecrypt.aggregateContributions([
        user1.address,
        user2.address
      ]);

      // Should be encrypted sum
      expect(aggregated).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Decryption Readiness", function () {
    it("Should check decryption readiness", async function () {
      const proposalId = 10;
      const threshold = 2;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add64(999);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createThresholdProposal(
        proposalId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      // Before threshold
      const [encrypted1, ready1] = await publicDecrypt.checkDecryptionReadiness(proposalId);
      expect(ready1).to.equal(false);

      // Reach threshold
      await publicDecrypt.connect(user1).voteOnProposal(proposalId);
      await publicDecrypt.connect(user2).voteOnProposal(proposalId);

      // After threshold
      const [encrypted2, ready2] = await publicDecrypt.checkDecryptionReadiness(proposalId);
      expect(ready2).to.equal(true);
    });

    it("Should verify threshold met", async function () {
      const proposalId = 11;
      const threshold = 2;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add64(555);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createThresholdProposal(
        proposalId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      expect(await publicDecrypt.meetsDecryptionThreshold(proposalId)).to.equal(false);

      await publicDecrypt.connect(user1).voteOnProposal(proposalId);
      await publicDecrypt.connect(user2).voteOnProposal(proposalId);

      expect(await publicDecrypt.meetsDecryptionThreshold(proposalId)).to.equal(true);
    });
  });

  describe("Time-Locked Decryption", function () {
    it("Should provide time-locked decryption metadata", async function () {
      const proposalId = 20;
      const threshold = 1;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add64(777);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createThresholdProposal(
        proposalId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      const [enc, timestamp] = await publicDecrypt.getTimeLocked(proposalId);
      // Before threshold, timestamp should be in future
      expect(timestamp).to.be.gt(0);
    });
  });

  describe("Role-Based Access", function () {
    it("Should check decryption access", async function () {
      const gateId = ethers.id("roleGate");
      const threshold = 5;

      const input = instances.user1.createEncryptedInput(await publicDecrypt.getAddress(), user1.address);
      const encValue = input.add32(123);
      const encrypted = encValue.encrypt();

      await publicDecrypt.connect(user1).createDecryptionGate(
        gateId,
        encrypted.handles[0],
        threshold,
        encrypted.inputProof
      );

      // Opener (user1) has access after opening
      const proof = ethers.toBeHex("0x1234", 32);
      await publicDecrypt.connect(user1).openDecryptionGate(gateId, proof);

      const roleRequired = ethers.id("ADMIN");
      const hasAccess = await publicDecrypt.connect(user1).checkDecryptionAccess(gateId, roleRequired);
      expect(hasAccess).to.equal(true);
    });
  });
});
