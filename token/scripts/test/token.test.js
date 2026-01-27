const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC-20 Token Tests", function () {
  let token;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("CoffeeToken", "CFT", ethers.parseEther("1000000"), owner.address);
    await token.waitForDeployment();
  });

  // ============ MINTING TESTS ============
  describe("Minting", function () {
    it("Should mint tokens successfully", async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(addr1.address, mintAmount);
      
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(mintAmount);
    });

    it("Should increase total supply after minting", async function () {
      const initialSupply = await token.totalSupply();
      const mintAmount = ethers.parseEther("500");
      
      await token.mint(addr1.address, mintAmount);
      
      const newSupply = await token.totalSupply();
      expect(newSupply).to.equal(initialSupply + mintAmount);
    });

    it("Should emit Transfer event on mint", async function () {
      const mintAmount = ethers.parseEther("100");
      
      await expect(token.mint(addr1.address, mintAmount))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);
    });

    it("Should revert when non-owner tries to mint", async function () {
      const mintAmount = ethers.parseEther("100");
      
      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.reverted;
    });
  });

  // ============ TRANSFER TESTS ============
  describe("Transfers", function () {
    beforeEach(async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(owner.address, mintAmount);
    });

    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("50");
      
      await token.transfer(addr1.address, transferAmount);
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(transferAmount);
    });

    it("Should emit Transfer event", async function () {
      const transferAmount = ethers.parseEther("50");
      
      await expect(token.transfer(addr1.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Should update balances correctly", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      const transferAmount = ethers.parseEther("100");
      
      await token.transfer(addr1.address, transferAmount);
      
      expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance - transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should revert when transferring more than balance", async function () {
      await expect(
        token.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it("Should revert when transferring to zero address", async function () {
      await expect(
        token.transfer(ethers.ZeroAddress, ethers.parseEther("50"))
      ).to.be.reverted;
    });
  });

  // ============ APPROVAL & ALLOWANCE TESTS ============
  describe("Approval & Allowance Logic", function () {
    it("Should approve tokens for spending", async function () {
      const approveAmount = ethers.parseEther("100");
      await token.approve(addr1.address, approveAmount);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });

    it("Should emit Approval event", async function () {
      const approveAmount = ethers.parseEther("100");
      
      await expect(token.approve(addr1.address, approveAmount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, approveAmount);
    });

    it("Should update allowance correctly", async function () {
      await token.approve(addr1.address, ethers.parseEther("100"));
      expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));
      
      await token.approve(addr1.address, ethers.parseEther("200"));
      expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
    });

    it("Should allow zero approval", async function () {
      await token.approve(addr1.address, ethers.parseEther("100"));
      await token.approve(addr1.address, 0);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });
  });

  // ============ TRANSFERFROM BEHAVIOR TESTS ============
  describe("TransferFrom Behavior", function () {
    beforeEach(async function () {
      await token.mint(owner.address, ethers.parseEther("1000"));
    });

    it("Should transfer tokens using transferFrom", async function () {
      const amount = ethers.parseEther("50");
      
      await token.approve(addr1.address, amount);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
    });

    it("Should decrease allowance after transferFrom", async function () {
      await token.approve(addr1.address, ethers.parseEther("100"));
      await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should revert transferFrom without approval", async function () {
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))
      ).to.be.reverted;
    });

    it("Should revert with insufficient allowance", async function () {
      await token.approve(addr1.address, ethers.parseEther("30"));
      
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))
      ).to.be.reverted;
    });

    it("Should revert with insufficient balance", async function () {
      await token.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
      
      await expect(
        token.connect(addr2).transferFrom(addr1.address, owner.address, ethers.parseEther("50"))
      ).to.be.reverted;
    });
  });

  // ============ REVERT CONDITIONS ============
  describe("Revert Conditions", function () {
    it("Should revert transfer with zero balance", async function () {
      await expect(
        token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it("Should revert transferFrom with no approval", async function () {
      await token.mint(owner.address, ethers.parseEther("100"));
      
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("10"))
      ).to.be.reverted;
    });
  });
});