const hre = require("hardhat");

async function main() {
  console.log("Deploying FHECounter contract...");

  const FHECounter = await hre.ethers.getContractFactory("FHECounter");
  const counter = await FHECounter.deploy();

  await counter.waitForDeployment();

  const address = await counter.getAddress();
  console.log("FHECounter deployed to:", address);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
