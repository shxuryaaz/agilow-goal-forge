const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ProofOfCommitmentNFT to Sepolia...");

  // Get the contract factory
  const ProofOfCommitmentNFT = await ethers.getContractFactory("ProofOfCommitmentNFT");

  // Deploy the contract
  const nftContract = await ProofOfCommitmentNFT.deploy();

  // Wait for deployment to complete
  await nftContract.waitForDeployment();

  const contractAddress = await nftContract.getAddress();
  
  console.log("✅ ProofOfCommitmentNFT deployed to:", contractAddress);
  console.log("📋 Contract details:");
  console.log("   - Name: Proof of Commitment");
  console.log("   - Symbol: POC");
  console.log("   - Network: Sepolia Testnet");
  console.log("   - Address:", contractAddress);
  
  // Verify the deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await nftContract.name();
  const symbol = await nftContract.symbol();
  const totalSupply = await nftContract.totalSupply();
  
  console.log("   - Name:", name);
  console.log("   - Symbol:", symbol);
  console.log("   - Total Supply:", totalSupply.toString());
  
  console.log("\n🎉 Deployment successful!");
  console.log("\n📝 Next steps:");
  console.log("1. Update your .env file with the contract address:");
  console.log(`   NFT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Update your Firebase Functions config:");
  console.log(`   firebase functions:config:set nft.contract_address="${contractAddress}"`);
  console.log("3. Deploy your Firebase Functions:");
  console.log("   firebase deploy --only functions");
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

