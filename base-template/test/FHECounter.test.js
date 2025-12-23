const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FHECounter", function () {
  let counter;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const FHECounter = await ethers.getContractFactory("FHECounter");
    counter = await FHECounter.deploy();
    await counter.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await counter.getAddress()).to.be.properAddress;
    });

    it("Should set the correct owner", async function () {
      expect(await counter.owner()).to.equal(owner.address);
    });
  });

  describe("Counter Operations", function () {
    it("Should have a counter getter function", async function () {
      const counterValue = await counter.getCounter();
      expect(counterValue).to.not.be.undefined;
    });
  });
});
