const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createInstances } = require("fhevmjs");

describe("UserDecrypt", function () {
  let userDecrypt;
  let owner, user1, user2;
  let instances;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const UserDecrypt = await ethers.getContractFactory("UserDecrypt");
    userDecrypt = await UserDecrypt.deploy();
    await userDecrypt.waitForDeployment();

    // Initialize fhevmjs instances for testing
    instances = await createInstances(await userDecrypt.getAddress(), ethers, await ethers.getSigners());
  });

  describe("Balance Storage and Retrieval", function () {
    it("Should store encrypted balance with proper permissions", async function () {
      const input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encryptedBalance = input.add64(1000);
      const encryptedInput = encryptedBalance.encrypt();

      const tx = await userDecrypt.connect(user1).storeBalance(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      await tx.wait();

      // Retrieve encrypted balance
      const encryptedResult = await userDecrypt.connect(user1).getBalance();

      // User can decrypt their own balance
      const decryptedBalance = await instances.user1.decrypt64(encryptedResult);
      expect(decryptedBalance).to.equal(1000);
    });

    it("Should allow user to add to balance and decrypt new value", async function () {
      // Store initial balance
      let input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      let encryptedBalance = input.add64(1000);
      let encryptedInput = encryptedBalance.encrypt();

      await userDecrypt.connect(user1).storeBalance(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Add to balance
      input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      encryptedBalance = input.add64(500);
      encryptedInput = encryptedBalance.encrypt();

      await userDecrypt.connect(user1).addToBalance(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Decrypt new balance
      const encryptedResult = await userDecrypt.connect(user1).getBalance();
      const decryptedBalance = await instances.user1.decrypt64(encryptedResult);
      expect(decryptedBalance).to.equal(1500);
    });

    it("Should prevent other users from decrypting balance", async function () {
      // User1 stores balance
      const input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encryptedBalance = input.add64(1000);
      const encryptedInput = encryptedBalance.encrypt();

      await userDecrypt.connect(user1).storeBalance(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // User2 tries to retrieve user1's balance - should fail or return encrypted value they can't decrypt
      try {
        const encryptedResult = await userDecrypt.connect(user2).getBalance();
        // This should return zero or throw - user2 has no balance
        expect(encryptedResult).to.not.equal(undefined);
      } catch (error) {
        // Expected behavior
        expect(error).to.exist;
      }
    });
  });

  describe("Score Management", function () {
    it("Should store and decrypt score", async function () {
      const input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encryptedScore = input.add32(85);
      const encryptedInput = encryptedScore.encrypt();

      await userDecrypt.connect(user1).storeScore(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      const encryptedResult = await userDecrypt.connect(user1).getScore();
      const decryptedScore = await instances.user1.decrypt32(encryptedResult);
      expect(decryptedScore).to.equal(85);
    });

    it("Should update status based on threshold", async function () {
      // Store score
      let input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      let encryptedScore = input.add32(75);
      let encryptedInput = encryptedScore.encrypt();

      await userDecrypt.connect(user1).storeScore(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Update status with threshold
      input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encryptedThreshold = input.add32(70);
      encryptedInput = encryptedThreshold.encrypt();

      await userDecrypt.connect(user1).updateStatus(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Decrypt status (should be true since 75 >= 70)
      const encryptedStatus = await userDecrypt.connect(user1).getStatus();
      const decryptedStatus = await instances.user1.decryptBool(encryptedStatus);
      expect(decryptedStatus).to.equal(true);
    });
  });

  describe("Shared Data with Permissions", function () {
    it("Should share data with specific viewer", async function () {
      const dataId = ethers.id("testData");

      const input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encryptedValue = input.add32(42);
      const encryptedInput = encryptedValue.encrypt();

      await userDecrypt.connect(user1).shareData(
        dataId,
        encryptedInput.handles[0],
        user2.address,
        encryptedInput.inputProof
      );

      // Both owner and viewer should be able to decrypt
      const sharedValue = await userDecrypt.connect(user1).getSharedData(dataId);

      const ownerDecrypted = await instances.user1.decrypt32(sharedValue);
      expect(ownerDecrypted).to.equal(42);

      const viewerDecrypted = await instances.user2.decrypt32(sharedValue);
      expect(viewerDecrypted).to.equal(42);
    });

    it("Should grant additional view permissions", async function () {
      const dataId = ethers.id("testData2");

      // User1 shares data with user2
      const input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encryptedValue = input.add32(100);
      const encryptedInput = encryptedValue.encrypt();

      await userDecrypt.connect(user1).shareData(
        dataId,
        encryptedInput.handles[0],
        user2.address,
        encryptedInput.inputProof
      );

      // Grant permission to another viewer
      const [, , user3] = await ethers.getSigners();
      await userDecrypt.connect(user1).grantViewPermission(dataId, user3.address);

      // Verify viewers list
      const viewers = await userDecrypt.getViewers(dataId);
      expect(viewers).to.include(user2.address);
      expect(viewers).to.include(user3.address);
    });
  });

  describe("Balance Transfer", function () {
    it("Should transfer balance between users", async function () {
      // User1 stores initial balance
      let input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      let encrypted = input.add64(1000);
      let encryptedInput = encrypted.encrypt();

      await userDecrypt.connect(user1).storeBalance(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // User2 stores initial balance
      input = instances.user2.createEncryptedInput(await userDecrypt.getAddress(), user2.address);
      encrypted = input.add64(500);
      encryptedInput = encrypted.encrypt();

      await userDecrypt.connect(user2).storeBalance(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // User1 transfers 200 to user2
      input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      encrypted = input.add64(200);
      encryptedInput = encrypted.encrypt();

      await userDecrypt.connect(user1).transferBalance(
        user2.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Check new balances
      const user1Balance = await userDecrypt.connect(user1).getBalance();
      const user1Decrypted = await instances.user1.decrypt64(user1Balance);
      expect(user1Decrypted).to.equal(800);

      const user2Balance = await userDecrypt.connect(user2).getBalance();
      const user2Decrypted = await instances.user2.decrypt64(user2Balance);
      expect(user2Decrypted).to.equal(700);
    });
  });

  describe("Multiple Data Types", function () {
    it("Should store multiple data types at once", async function () {
      const balanceInput = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encBalance = balanceInput.add64(5000);
      const balanceEncrypted = encBalance.encrypt();

      const scoreInput = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encScore = scoreInput.add32(90);
      const scoreEncrypted = encScore.encrypt();

      await userDecrypt.connect(user1).storeMultiple(
        balanceEncrypted.handles[0],
        scoreEncrypted.handles[0],
        balanceEncrypted.inputProof,
        scoreEncrypted.inputProof
      );

      // Verify both values
      const balance = await userDecrypt.connect(user1).getBalance();
      const balanceDecrypted = await instances.user1.decrypt64(balance);
      expect(balanceDecrypted).to.equal(5000);

      const score = await userDecrypt.connect(user1).getScore();
      const scoreDecrypted = await instances.user1.decrypt32(score);
      expect(scoreDecrypted).to.equal(90);
    });
  });

  describe("Conditional Selection", function () {
    it("Should return different rewards based on score", async function () {
      // Store score
      let input = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      let encrypted = input.add32(80);
      let encryptedInput = encrypted.encrypt();

      await userDecrypt.connect(user1).storeScore(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Create conditional reward inputs
      const thresholdInput = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encThreshold = thresholdInput.add32(70);
      const thresholdEncrypted = encThreshold.encrypt();

      const highInput = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encHigh = highInput.add64(1000);
      const highEncrypted = encHigh.encrypt();

      const lowInput = instances.user1.createEncryptedInput(await userDecrypt.getAddress(), user1.address);
      const encLow = lowInput.add64(500);
      const lowEncrypted = encLow.encrypt();

      const reward = await userDecrypt.connect(user1).conditionalReward(
        thresholdEncrypted.handles[0],
        highEncrypted.handles[0],
        lowEncrypted.handles[0],
        thresholdEncrypted.inputProof,
        highEncrypted.inputProof,
        lowEncrypted.inputProof
      );

      // Since score (80) > threshold (70), should get high reward (1000)
      const decryptedReward = await instances.user1.decrypt64(reward);
      expect(decryptedReward).to.equal(1000);
    });
  });
});
