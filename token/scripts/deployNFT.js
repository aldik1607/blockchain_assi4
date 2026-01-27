// scripts/deployNFT.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying NFT contract...");
  
  const [owner, user1, user2] = await hre.ethers.getSigners();
  
  console.log("Deployer account:", owner.address);
  
  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  
  const contractAddress = await nft.getAddress();
  console.log("Contract deployed to:", contractAddress);
  console.log("Contract owner:", await nft.owner());
  
  // Mint 3 NFTs with metadata
  console.log("\nMinting 3 NFTs with metadata...");
  
  const nfts = [
    { to: owner.address, uri: "ipfs://QmTest1/nft1.json", name: "NFT #1" },
    { to: user1.address, uri: "ipfs://QmTest2/nft2.json", name: "NFT #2" },
    { to: user2.address, uri: "ipfs://QmTest3/nft3.json", name: "NFT #3" }
  ];
  
  for (let i = 0; i < nfts.length; i++) {
    const tx = await nft.mintNFT(nfts[i].to, nfts[i].uri);
    await tx.wait();
    console.log(`${nfts[i].name} minted:`);
    console.log("  To:", nfts[i].to);
    console.log("  URI:", nfts[i].uri);
    console.log("  Token ID:", i);
  }
  
  console.log("\n===== ALL NFT INFORMATION =====");
  console.log("Total NFTs minted:", (await nft.totalSupply()).toString());
  
  for (let i = 0; i < 3; i++) {
    try {
      const ownerAddr = await nft.getOwner(i);
      const uri = await nft.tokenURI(i);
      console.log(`\nToken ID: ${i}`);
      console.log("  Owner:", ownerAddr);
      console.log("  URI:", uri);
    } catch (error) {
      console.log(`Token ${i} error: ${error.message}`);
    }
  }
  
  console.log("\nTesting security - non-owner mint attempt:");
  try {
    const hackerTx = await nft.connect(user1).mintNFT(user1.address, "ipfs://hack.json");
    await hackerTx.wait();
    console.log("ERROR: Non-owner was able to mint!");
  } catch (error) {
    console.log("SUCCESS: Only contract owner can mint NFTs");
  }
  
  console.log("\nDeployment completed successfully!");
  console.log("\nTo interact with contract in console:");
  console.log(`npx hardhat console --network localhost`);
  console.log(`const nft = await ethers.getContractAt("NFT", "${contractAddress}")`);
  console.log(`await nft.totalSupply()`);
  console.log(`await nft.tokenURI(0)`);
  console.log(`await nft.getOwner(0)`);
}

main().catch((error) => {
  console.error("Deployment error:", error);
  process.exitCode = 1;
});