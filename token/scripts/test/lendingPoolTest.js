const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mini Lending Pool", function () {
  let token, pool, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy TestToken
    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();
    await token.deployed();

    // Deploy LendingPool
    const Pool = await ethers.getContractFactory("MiniLendingPool");
    pool = await Pool.deploy(token.address);
    await pool.deployed();

    // Distribute tokens
    await token.transfer(addr1.address, ethers.utils.parseEther("1000"));
    await token.transfer(addr2.address, ethers.utils.parseEther("1000"));
  });

  it("Deposit updates user balance and totalDeposited", async function () {
    await token.connect(addr1).approve(pool.address, ethers.utils.parseEther("500"));
    await pool.connect(addr1).deposit(ethers.utils.parseEther("500"));

    expect(await pool.balances(addr1.address)).to.equal(ethers.utils.parseEther("500"));
    expect(await pool.totalDeposited()).to.equal(ethers.utils.parseEther("500"));
  });

  it("Withdraw decreases balance and totalDeposited", async function () {
    await token.connect(addr1).approve(pool.address, ethers.utils.parseEther("500"));
    await pool.connect(addr1).deposit(ethers.utils.parseEther("500"));

    await pool.connect(addr1).withdraw(ethers.utils.parseEther("200"));
    expect(await pool.balances(addr1.address)).to.equal(ethers.utils.parseEther("300"));
    expect(await pool.totalDeposited()).to.equal(ethers.utils.parseEther("300"));
  });

  it("Cannot withdraw more than balance", async function () {
    await token.connect(addr1).approve(pool.address, ethers.utils.parseEther("100"));
    await pool.connect(addr1).deposit(ethers.utils.parseEther("100"));

    await expect(pool.connect(addr1).withdraw(ethers.utils.parseEther("200")))
      .to.be.revertedWith("Insufficient balance");
  });

  it("Multiple users deposit independently", async function () {
    await token.connect(addr1).approve(pool.address, ethers.utils.parseEther("100"));
    await token.connect(addr2).approve(pool.address, ethers.utils.parseEther("200"));

    await pool.connect(addr1).deposit(ethers.utils.parseEther("100"));
    await pool.connect(addr2).deposit(ethers.utils.parseEther("200"));

    expect(await pool.balances(addr1.address)).to.equal(ethers.utils.parseEther("100"));
    expect(await pool.balances(addr2.address)).to.equal(ethers.utils.parseEther("200"));
    expect(await pool.totalDeposited()).to.equal(ethers.utils.parseEther("300"));
  });

  it("Deposit of 0 is rejected", async function () {
    await token.connect(addr1).approve(pool.address, 0);
    await expect(pool.connect(addr1).deposit(0)).to.be.revertedWith("Amount must be > 0");
  });

  it("Withdraw of 0 is rejected", async function () {
    await token.connect(addr1).approve(pool.address, ethers.utils.parseEther("100"));
    await pool.connect(addr1).deposit(ethers.utils.parseEther("100"));

    await expect(pool.connect(addr1).withdraw(0)).to.be.revertedWith("Amount must be > 0");
  });
});
