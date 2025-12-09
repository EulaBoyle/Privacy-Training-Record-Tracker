/**
 * Privacy Training Record - Deployment Script
 *
 * This script deploys the PrivacyTrainingRecord contract to the configured network.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network zamaTestnet
 *   npx hardhat run scripts/deploy.js --network localhost
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     Privacy Training Record - Smart Contract Deploy     ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.error("❌ Insufficient balance! Please fund your account with testnet ETH.");
    console.error("   Zama Faucet: https://faucet.zama.ai/");
    process.exit(1);
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId, "\n");

  // Deploy contract
  console.log("📦 Compiling contract...");
  const PrivacyTrainingRecord = await ethers.getContractFactory("PrivacyTrainingRecord");

  console.log("🚀 Deploying PrivacyTrainingRecord...");
  const contract = await PrivacyTrainingRecord.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress, "\n");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const admin = await contract.admin();
  console.log("✓ Admin address:", admin);

  const isAuthorized = await contract.authorizedTrainers(deployer.address);
  console.log("✓ Deployer is authorized:", isAuthorized);

  const recordCounter = await contract.recordCounter();
  console.log("✓ Initial record counter:", recordCounter.toString(), "\n");

  // Get training modules
  const [moduleIds, names] = await contract.getActiveTrainingModules();
  console.log("✓ Active training modules:", moduleIds.length);
  for (let i = 0; i < moduleIds.length; i++) {
    console.log(`  - ${moduleIds[i]}: ${names[i]}`);
  }
  console.log();

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentBlock: await ethers.provider.getBlockNumber(),
    deploymentTimestamp: new Date().toISOString(),
    contractName: "PrivacyTrainingRecord",
    solidityVersion: "0.8.24",
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to deployment.json\n");

  // Save contract ABI
  const artifact = await hre.artifacts.readArtifact("PrivacyTrainingRecord");
  const abiPath = path.join(__dirname, "..", "abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("📋 Contract ABI saved to abi.json\n");

  // Generate environment template
  const envTemplate = `
# Privacy Training Record - Environment Configuration

# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ZAMA_RPC_URL=https://sepolia.zama.ai/

# Wallet Configuration
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# API Keys
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
COINMARKETCAP_API_KEY=YOUR_COINMARKETCAP_API_KEY

# Contract Configuration
CONTRACT_ADDRESS=${contractAddress}
NETWORK_NAME=${network.name}
CHAIN_ID=${network.chainId}

# Frontend Configuration
VITE_CONTRACT_ADDRESS=${contractAddress}
VITE_NETWORK_NAME=${network.name}
VITE_CHAIN_ID=${network.chainId}
`;

  const envTemplatePath = path.join(__dirname, "..", ".env.example");
  fs.writeFileSync(envTemplatePath, envTemplate.trim());
  console.log("📝 Environment template saved to .env.example\n");

  // Print deployment summary
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║            🎉 DEPLOYMENT SUCCESSFUL 🎉                 ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📌 Key Information:");
  console.log("   Network:", network.name);
  console.log("   Contract Address:", contractAddress);
  console.log("   Deployer:", deployer.address);
  console.log("   Block Number:", (await ethers.provider.getBlockNumber()).toString());

  console.log("\n📝 Next Steps:");
  console.log("   1. Update your .env file with the contract address");
  console.log("   2. Update frontend configuration in index.html");
  console.log("   3. Run tests to verify functionality:");
  console.log("      npx hardhat test");
  console.log("   4. Access the application at your deployment URL");

  console.log("\n🔗 Blockchain Explorers:");
  if (network.chainId === 9000) {
    console.log("   Zama Sepolia Explorer: https://sepolia.zamascan.io/address/" + contractAddress);
  } else if (network.chainId === 11155111) {
    console.log("   Etherscan Sepolia: https://sepolia.etherscan.io/address/" + contractAddress);
  }

  console.log("\n💡 Need help?");
  console.log("   - Documentation: See DEPLOYMENT_GUIDE.md");
  console.log("   - Discord: https://discord.gg/zama");
  console.log("   - Community: https://community.zama.ai/");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
