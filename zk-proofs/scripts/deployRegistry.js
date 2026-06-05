const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const Registry = await hre.ethers.getContractFactory("CredentialRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("\n✅ CredentialRegistry deployed!");
  console.log("   Contract address:", address);
  console.log("   Etherscan:        https://sepolia.etherscan.io/address/" + address);
  console.log("\nSave this in your zkp-backend/.env:");
  console.log("   REGISTRY_ADDRESS=" + address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
