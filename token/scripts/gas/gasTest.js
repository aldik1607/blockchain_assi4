const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Деплой Expensive
  const Expensive = await hre.ethers.getContractFactory("Expensive");
  const expensive = await Expensive.deploy();
  await expensive.deployed();

  // Деплой Optimized
  const Optimized = await hre.ethers.getContractFactory("Optimized");
  const optimized = await Optimized.deploy();
  await optimized.deployed();

  console.log("Testing Expensive contract...");
  let tx = await expensive.addNumbers([1,2,3,4,5]);
  let receipt = await tx.wait();
  console.log("Expensive gas used:", receipt.gasUsed.toString());

  console.log("Testing Optimized contract...");
  tx = await optimized.addNumbers([1,2,3,4,5]);
  receipt = await tx.wait();
  console.log("Optimized gas used:", receipt.gasUsed.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
