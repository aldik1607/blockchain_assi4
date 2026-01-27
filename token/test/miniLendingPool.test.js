const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MiniLendingPool", function () {
  async function deployFixture() {
    const [deployer, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("TestToken", "TT", 0n, deployer.address);
    await token.waitForDeployment();

    // Mint tokens to users
    await token.mint(user1.address, ethers.parseEther("100"));
    await token.mint(user2.address, ethers.parseEther("50"));

    const MiniLendingPool = await ethers.getContractFactory("MiniLendingPool");
    const pool = await MiniLendingPool.deploy(await token.getAddress());
    await pool.waitForDeployment();

    return { deployer, user1, user2, token, pool };
  }

  it("tracks deposits and balances", async function () {
    const { user1, token, pool } = await deployFixture();

    const amount = ethers.parseEther("10");
    await token.connect(user1).approve(await pool.getAddress(), amount);
    await pool.connect(user1).deposit(amount);

    expect(await pool.balances(user1.address)).to.equal(amount);
    expect(await pool.totalDeposits()).to.equal(amount);
    expect(await token.balanceOf(await pool.getAddress())).to.equal(amount);
  });

  it("allows multiple deposits from same user", async function () {
    const { user1, token, pool } = await deployFixture();

    const amount1 = ethers.parseEther("5");
    const amount2 = ethers.parseEther("3");
    await token.connect(user1).approve(await pool.getAddress(), amount1 + amount2);

    await pool.connect(user1).deposit(amount1);
    await pool.connect(user1).deposit(amount2);

    expect(await pool.balances(user1.address)).to.equal(amount1 + amount2);
    expect(await pool.totalDeposits()).to.equal(amount1 + amount2);
  });

  it("allows deposits from multiple users", async function () {
    const { user1, user2, token, pool } = await deployFixture();

    const a1 = ethers.parseEther("10");
    const a2 = ethers.parseEther("7");

    await token.connect(user1).approve(await pool.getAddress(), a1);
    await token.connect(user2).approve(await pool.getAddress(), a2);

    await pool.connect(user1).deposit(a1);
    await pool.connect(user2).deposit(a2);

    expect(await pool.balances(user1.address)).to.equal(a1);
    expect(await pool.balances(user2.address)).to.equal(a2);
    expect(await pool.totalDeposits()).to.equal(a1 + a2);
  });

  it("reverts deposit of zero", async function () {
    const { user1, pool } = await deployFixture();
    await expect(pool.connect(user1).deposit(0)).to.be.revertedWith("amount = 0");
  });

  it("reverts withdraw of zero", async function () {
    const { user1, pool } = await deployFixture();
    await expect(pool.connect(user1).withdraw(0)).to.be.revertedWith("amount = 0");
  });

  it("allows withdraw up to deposited amount", async function () {
    const { user1, token, pool } = await deployFixture();

    const depositAmount = ethers.parseEther("20");
    const withdrawAmount = ethers.parseEther("7");

    await token.connect(user1).approve(await pool.getAddress(), depositAmount);
    await pool.connect(user1).deposit(depositAmount);

    const balBefore = await token.balanceOf(user1.address);
    await pool.connect(user1).withdraw(withdrawAmount);

    expect(await pool.balances(user1.address)).to.equal(depositAmount - withdrawAmount);
    expect(await pool.totalDeposits()).to.equal(depositAmount - withdrawAmount);
    expect(await token.balanceOf(user1.address)).to.equal(balBefore + withdrawAmount);
  });

  it("reverts withdraw above user balance", async function () {
    const { user1, token, pool } = await deployFixture();

    const depositAmount = ethers.parseEther("5");
    await token.connect(user1).approve(await pool.getAddress(), depositAmount);
    await pool.connect(user1).deposit(depositAmount);

    await expect(
      pool.connect(user1).withdraw(ethers.parseEther("6"))
    ).to.be.revertedWith("insufficient balance");
  });

  it("pool token balance matches totalDeposits after many actions", async function () {
    const { user1, user2, token, pool } = await deployFixture();

    const a1 = ethers.parseEther("30");
    const a2 = ethers.parseEther("15");

    await token.connect(user1).approve(await pool.getAddress(), a1);
    await token.connect(user2).approve(await pool.getAddress(), a2);

    await pool.connect(user1).deposit(a1);
    await pool.connect(user2).deposit(a2);

    await pool.connect(user1).withdraw(ethers.parseEther("5"));
    await pool.connect(user2).withdraw(ethers.parseEther("10"));

    const total = await pool.totalDeposits();
    const poolBal = await token.balanceOf(await pool.getAddress());

    expect(total).to.equal(poolBal);
  });
});

