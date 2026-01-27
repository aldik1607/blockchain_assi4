// scripts/Attack.js
// Demonstrates a re-entrancy exploit against VulnerableBank,
// then shows that the same attack fails against FixedBank.

const hre = require("hardhat");

async function exploitVulnerable() {
  console.log("===== Exploit against VulnerableBank =====");

  const [deployer, attackerEOA] = await hre.ethers.getSigners();

  const Vulnerable = await hre.ethers.getContractFactory("VulnerableBank");
  const vulnerable = await Vulnerable.deploy();
  await vulnerable.waitForDeployment();

  const vulnerableAddress = await vulnerable.getAddress();
  console.log("VulnerableBank deployed at:", vulnerableAddress);

  // Fund the bank with some ETH (simulating honest users)
  const initialBankFunding = hre.ethers.parseEther("10");
  await vulnerable.connect(deployer).deposit({ value: initialBankFunding });

  console.log(
    "Bank balance before attack:",
    hre.ethers.formatEther(await vulnerable.getBankBalance()),
    "ETH"
  );

  const Attack = await hre.ethers.getContractFactory("Attack");
  const attack = await Attack.connect(attackerEOA).deploy(vulnerableAddress);
  await attack.waitForDeployment();

  const attackAddress = await attack.getAddress();
  console.log("Attack contract deployed at:", attackAddress);

  // Start attack with 1 ETH
  const attackDeposit = hre.ethers.parseEther("1");

  console.log(
    "Attacker starting balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(attackAddress)),
    "ETH"
  );

  const tx = await attack.connect(attackerEOA).attack({ value: attackDeposit });
  await tx.wait();

  console.log(
    "Bank balance after attack:",
    hre.ethers.formatEther(await vulnerable.getBankBalance()),
    "ETH"
  );
  console.log(
    "Attacker contract balance after attack:",
    hre.ethers.formatEther(await attack.getBalance()),
    "ETH"
  );
}

async function exploitFixed() {
  console.log("\n===== Attempted exploit against FixedBank =====");

  const [deployer, attackerEOA] = await hre.ethers.getSigners();

  const Fixed = await hre.ethers.getContractFactory("FixedBank");
  const fixed = await Fixed.deploy();
  await fixed.waitForDeployment();

  const fixedAddress = await fixed.getAddress();
  console.log("FixedBank deployed at:", fixedAddress);

  const initialBankFunding = hre.ethers.parseEther("10");
  await fixed.connect(deployer).deposit({ value: initialBankFunding });

  console.log(
    "Bank balance before attack:",
    hre.ethers.formatEther(await fixed.getBankBalance()),
    "ETH"
  );

  const Attack = await hre.ethers.getContractFactory("Attack");
  const attack = await Attack.connect(attackerEOA).deploy(fixedAddress);
  await attack.waitForDeployment();

  const attackAddress = await attack.getAddress();
  console.log("Attack contract deployed at:", attackAddress);

  const attackDeposit = hre.ethers.parseEther("1");

  console.log(
    "Attacker starting balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(attackAddress)),
    "ETH"
  );

  try {
    const tx = await attack.connect(attackerEOA).attack({ value: attackDeposit });
    await tx.wait();
    console.log("Unexpectedly succeeded attack tx:", tx.hash);
  } catch (error) {
    console.log("Attack reverted as expected:", error.message);
  }

  console.log(
    "Bank balance after attempted attack:",
    hre.ethers.formatEther(await fixed.getBankBalance()),
    "ETH"
  );
  console.log(
    "Attacker contract balance after attempted attack:",
    hre.ethers.formatEther(await attack.getBalance()),
    "ETH"
  );
}

async function main() {
  await exploitVulnerable();
  await exploitFixed();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

