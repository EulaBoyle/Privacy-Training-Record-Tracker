const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createInstances } = require("fhevmjs");

describe("InputProofPatterns", function () {
  let inputProofPatterns;
  let owner, user1, user2;
  let instances;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const InputProofPatterns = await ethers.getContractFactory("InputProofPatterns");
    inputProofPatterns = await InputProofPatterns.deploy();
    await inputProofPatterns.waitForDeployment();

    instances = await createInstances(await inputProofPatterns.getAddress(), ethers, await ethers.getSigners());
  });

  describe("euint8 Input Proof", function () {
    it("Should process euint8 with valid proof", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add8(50);
      const encrypted = encValue.encrypt();

      await inputProofPatterns.connect(user1).storeEuint8(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [valid] = await inputProofPatterns.getProofStats(user1.address);
      expect(valid).to.equal(1);
    });

    it("Should reject empty proof", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add8(50);
      const encrypted = encValue.encrypt();

      try {
        // Pass empty proof
        await inputProofPatterns.connect(user1).storeEuint8(
          encrypted.handles[0],
          "0x"
        );
        expect.fail("Should reject empty proof");
      } catch (error) {
        expect(error.message).to.include("Proof cannot be empty");
      }
    });
  });

  describe("euint16 Input Proof", function () {
    it("Should process euint16 with valid proof", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add16(30000);
      const encrypted = encValue.encrypt();

      await inputProofPatterns.connect(user1).storeEuint16(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [valid] = await inputProofPatterns.getProofStats(user1.address);
      expect(valid).to.equal(1);
    });
  });

  describe("euint32 Input Proof", function () {
    it("Should process euint32 with valid proof", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(1234567);
      const encrypted = encValue.encrypt();

      await inputProofPatterns.connect(user1).storeEuint32(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [valid] = await inputProofPatterns.getProofStats(user1.address);
      expect(valid).to.be.gte(1);
    });

    it("Should reject proof that is too short", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(1234567);
      const encrypted = encValue.encrypt();

      try {
        // Pass short proof
        await inputProofPatterns.connect(user1).storeEuint32(
          encrypted.handles[0],
          "0x1234"
        );
        expect.fail("Should reject short proof");
      } catch (error) {
        expect(error.message).to.include("Proof too short");
      }
    });
  });

  describe("euint64 Input Proof", function () {
    it("Should process euint64 with valid proof", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add64(9876543210n);
      const encrypted = encValue.encrypt();

      await inputProofPatterns.connect(user1).storeEuint64(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [valid] = await inputProofPatterns.getProofStats(user1.address);
      expect(valid).to.be.gte(1);
    });
  });

  describe("eaddress Input Proof", function () {
    it("Should process eaddress with valid proof", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encAddress = input.addAddress(user2.address);
      const encrypted = encAddress.encrypt();

      await inputProofPatterns.connect(user1).storeEaddress(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [valid] = await inputProofPatterns.getProofStats(user1.address);
      expect(valid).to.be.gte(1);
    });
  });

  describe("ebool Input Proof", function () {
    it("Should process ebool with valid proof", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encBool = input.addBool(true);
      const encrypted = encBool.encrypt();

      await inputProofPatterns.connect(user1).storeEbool(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [valid] = await inputProofPatterns.getProofStats(user1.address);
      expect(valid).to.be.gte(1);
    });
  });

  describe("Batch Processing", function () {
    it("Should process multiple inputs with different proofs", async function () {
      const input1 = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue1 = input1.add32(100);
      const encrypted1 = encValue1.encrypt();

      const input2 = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue2 = input2.add32(200);
      const encrypted2 = encValue2.encrypt();

      await inputProofPatterns.connect(user1).processBatch(
        encrypted1.handles[0],
        encrypted2.handles[0],
        encrypted1.inputProof,
        encrypted2.inputProof
      );

      const [valid] = await inputProofPatterns.getProofStats(user1.address);
      expect(valid).to.equal(2);
    });
  });

  describe("Proof Validation", function () {
    it("Should validate proof size", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(500);
      const encrypted = encValue.encrypt();

      const isValid = await inputProofPatterns.validateProofSize(
        encrypted.handles[0],
        encrypted.inputProof
      );

      expect(isValid).to.equal(true);
    });

    it("Should reject proof that is too long", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(500);
      const encrypted = encValue.encrypt();

      // Create artificially long proof
      const longProof = "0x" + "FF".repeat(2000);

      const isValid = await inputProofPatterns.validateProofSize(
        encrypted.handles[0],
        longProof
      );

      expect(isValid).to.equal(false);
    });

    it("Should validate input-proof correlation", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(750);
      const encrypted = encValue.encrypt();

      const result = await inputProofPatterns.connect(user1).storeWithValidation(
        encrypted.handles[0],
        encrypted.inputProof
      );

      expect(result).to.equal(true);
    });
  });

  describe("Proof Statistics", function () {
    it("Should track valid proof count", async function () {
      const input1 = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const enc1 = input1.add32(100);
      const enc1rypt = enc1.encrypt();

      await inputProofPatterns.connect(user1).storeEuint32(
        enc1rypt.handles[0],
        enc1rypt.inputProof
      );

      const input2 = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const enc2 = input2.add32(200);
      const enc2rypt = enc2.encrypt();

      await inputProofPatterns.connect(user1).storeEuint32(
        enc2rypt.handles[0],
        enc2rypt.inputProof
      );

      const [validCount] = await inputProofPatterns.getProofStats(user1.address);
      expect(validCount).to.equal(2);
    });

    it("Should get last proof timestamp", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(999);
      const encrypted = encValue.encrypt();

      await inputProofPatterns.connect(user1).storeEuint32(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const timestamp = await inputProofPatterns.getLastProofTimestamp(user1.address);
      expect(timestamp).to.be.gt(0);
    });
  });

  describe("Safe Processing", function () {
    it("Should handle safe processing with try-catch", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(555);
      const encrypted = encValue.encrypt();

      const result = await inputProofPatterns.connect(user1).safeSt oregEuint32(
        encrypted.handles[0],
        encrypted.inputProof
      );

      expect(result).to.equal(true);
    });

    it("Should handle invalid processing gracefully", async function () {
      // Pass invalid proof
      const result = await inputProofPatterns.connect(user1).safeSt oregEuint32(
        "0x1234",
        "0x"
      );

      expect(result).to.equal(false);
    });
  });

  describe("Parameterized Processing", function () {
    it("Should process with different operation types", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(888);
      const encrypted = encValue.encrypt();

      // Store operation
      await inputProofPatterns.connect(user1).processWithType(
        encrypted.handles[0],
        encrypted.inputProof,
        1
      );

      const [validCount] = await inputProofPatterns.getProofStats(user1.address);
      expect(validCount).to.be.gte(1);
    });

    it("Should reject invalid operation type", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(999);
      const encrypted = encValue.encrypt();

      try {
        await inputProofPatterns.connect(user1).processWithType(
          encrypted.handles[0],
          encrypted.inputProof,
          99 // Invalid type
        );
        expect.fail("Should reject invalid operation type");
      } catch (error) {
        expect(error.message).to.include("Invalid operation");
      }
    });
  });

  describe("Pattern Demonstrations", function () {
    it("Should show wrong pattern (missing validation)", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(111);
      const encrypted = encValue.encrypt();

      // This will execute but demonstrates bad pattern
      await inputProofPatterns.connect(user1).wrongPatternForgotValidation(
        encrypted.handles[0],
        encrypted.inputProof
      );
    });

    it("Should show correct pattern (full validation)", async function () {
      const input = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const encValue = input.add32(222);
      const encrypted = encValue.encrypt();

      await inputProofPatterns.connect(user1).correctPatternFullValidation(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [validCount] = await inputProofPatterns.getProofStats(user1.address);
      expect(validCount).to.be.gte(1);
    });
  });

  describe("Multi-Type Retrieval", function () {
    it("Should retrieve all stored values", async function () {
      // Store all types
      const input8 = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const val8 = input8.add8(10);
      const enc8 = val8.encrypt();

      const input16 = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const val16 = input16.add16(1000);
      const enc16 = val16.encrypt();

      const input32 = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const val32 = input32.add32(100000);
      const enc32 = val32.encrypt();

      const input64 = instances.user1.createEncryptedInput(await inputProofPatterns.getAddress(), user1.address);
      const val64 = input64.add64(9999999999n);
      const enc64 = val64.encrypt();

      await inputProofPatterns.connect(user1).storeEuint8(enc8.handles[0], enc8.inputProof);
      await inputProofPatterns.connect(user1).storeEuint16(enc16.handles[0], enc16.inputProof);
      await inputProofPatterns.connect(user1).storeEuint32(enc32.handles[0], enc32.inputProof);
      await inputProofPatterns.connect(user1).storeEuint64(enc64.handles[0], enc64.inputProof);

      const [val8Stored, val16Stored, val32Stored, val64Stored] = await inputProofPatterns.connect(user1).getAllValues();

      expect(val8Stored).to.not.equal(ethers.ZeroAddress);
      expect(val16Stored).to.not.equal(ethers.ZeroAddress);
      expect(val32Stored).to.not.equal(ethers.ZeroAddress);
      expect(val64Stored).to.not.equal(ethers.ZeroAddress);
    });
  });
});
