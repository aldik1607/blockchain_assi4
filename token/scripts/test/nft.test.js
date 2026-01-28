const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT (ERC-721) Tests", function () {
  let nft;
  let owner;
  let addr1;
  let addr2;
  
  const TOKEN_URI1 = "ipfs://QmTest1/nft1.json";
  const TOKEN_URI2 = "ipfs://QmTest2/nft2.json";
  const TOKEN_URI3 = "ipfs://QmTest3/nft3.json";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();
  });

  // ============ DEPLOYMENT TESTS ============
  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await nft.name()).to.equal("SimpleNFT");
      expect(await nft.symbol()).to.equal("SNFT");
    });

    it("Should set the correct owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should start with zero total supply", async function () {
      expect(await nft.totalSupply()).to.equal(0);
    });
  });

  // ============ SUCCESSFUL MINT TESTS ============
  describe("Successful Mint", function () {
    it("Should mint NFT successfully", async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should mint with correct token ID sequence", async function () {
      const tx1 = await nft.mintNFT(addr1.address, TOKEN_URI1);
      const tx2 = await nft.mintNFT(addr1.address, TOKEN_URI2);
      const tx3 = await nft.mintNFT(addr2.address, TOKEN_URI3);
      
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.ownerOf(2)).to.equal(addr2.address);
    });

    it("Should increase total supply after minting", async function () {
      expect(await nft.totalSupply()).to.equal(0);
      
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      expect(await nft.totalSupply()).to.equal(1);
      
      await nft.mintNFT(addr1.address, TOKEN_URI2);
      expect(await nft.totalSupply()).to.equal(2);
      
      await nft.mintNFT(addr2.address, TOKEN_URI3);
      expect(await nft.totalSupply()).to.equal(3);
    });

    it("Should increase balance after minting multiple NFTs", async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      await nft.mintNFT(addr1.address, TOKEN_URI2);
      await nft.mintNFT(addr1.address, TOKEN_URI3);
      
      expect(await nft.balanceOf(addr1.address)).to.equal(3);
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(nft.mintNFT(addr1.address, TOKEN_URI1))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 0);
    });

    it("Should mint to different addresses", async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      await nft.mintNFT(addr2.address, TOKEN_URI2);
      await nft.mintNFT(owner.address, TOKEN_URI3);
      
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
      expect(await nft.ownerOf(2)).to.equal(owner.address);
      
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.balanceOf(owner.address)).to.equal(1);
    });

    it("Should return correct token ID from mintNFT", async function () {
      const tx1 = await nft.mintNFT(addr1.address, TOKEN_URI1);
      const receipt1 = await tx1.wait();
      
      const tx2 = await nft.mintNFT(addr1.address, TOKEN_URI2);
      const receipt2 = await tx2.wait();
      
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should revert when minting to zero address", async function () {
      await expect(
        nft.mintNFT(ethers.ZeroAddress, TOKEN_URI1)
      ).to.be.revertedWithCustomError(nft, "ERC721InvalidReceiver");
    });

    it("Should revert when non-owner tries to mint", async function () {
      await expect(
        nft.connect(addr1).mintNFT(addr2.address, TOKEN_URI1)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to mint multiple times", async function () {
      for (let i = 0; i < 5; i++) {
        await nft.mintNFT(addr1.address, `ipfs://QmTest${i}/nft.json`);
      }
      
      expect(await nft.totalSupply()).to.equal(5);
      expect(await nft.balanceOf(addr1.address)).to.equal(5);
    });
  });

  // ============ OWNERSHIP CHECKS TESTS ============
  describe("Ownership Checks", function () {
    beforeEach(async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      await nft.mintNFT(addr2.address, TOKEN_URI2);
      await nft.mintNFT(addr1.address, TOKEN_URI3);
    });

    it("Should return correct owner using ownerOf", async function () {
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
      expect(await nft.ownerOf(2)).to.equal(addr1.address);
    });

    it("Should return correct owner using getOwner", async function () {
      expect(await nft.getOwner(0)).to.equal(addr1.address);
      expect(await nft.getOwner(1)).to.equal(addr2.address);
      expect(await nft.getOwner(2)).to.equal(addr1.address);
    });

    it("Should return correct balance", async function () {
      expect(await nft.balanceOf(addr1.address)).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.balanceOf(owner.address)).to.equal(0);
    });

    it("Should update owner after transfer", async function () {
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
      expect(await nft.ownerOf(0)).to.equal(addr2.address);
      expect(await nft.getOwner(0)).to.equal(addr2.address);
    });

    it("Should update balances after transfer", async function () {
      const initialAddr1Balance = await nft.balanceOf(addr1.address);
      const initialAddr2Balance = await nft.balanceOf(addr2.address);
      
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
      expect(await nft.balanceOf(addr1.address)).to.equal(initialAddr1Balance - 1n);
      expect(await nft.balanceOf(addr2.address)).to.equal(initialAddr2Balance + 1n);
    });

    it("Should revert when checking owner of non-existent token", async function () {
      await expect(
        nft.ownerOf(999)
      ).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
    });

    it("Should revert when using getOwner on non-existent token", async function () {
      await expect(
        nft.getOwner(999)
      ).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
    });

    it("Should allow approve and check approved address", async function () {
      await nft.connect(addr1).approve(addr2.address, 0);
      
      expect(await nft.getApproved(0)).to.equal(addr2.address);
    });

    it("Should allow setApprovalForAll", async function () {
      await nft.connect(addr1).setApprovalForAll(addr2.address, true);
      
      expect(await nft.isApprovedForAll(addr1.address, addr2.address)).to.equal(true);
    });

    it("Should transfer NFT with approval", async function () {
      await nft.connect(addr1).approve(owner.address, 0);
      await nft.connect(owner).transferFrom(addr1.address, addr2.address, 0);
      
      expect(await nft.ownerOf(0)).to.equal(addr2.address);
    });
  });

  // ============ TOKEN URI RETRIEVAL TESTS ============
  describe("TokenURI Retrieval", function () {
    it("Should return correct token URI after mint", async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      
      expect(await nft.tokenURI(0)).to.equal(TOKEN_URI1);
    });

    it("Should return correct URI for multiple tokens", async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      await nft.mintNFT(addr1.address, TOKEN_URI2);
      await nft.mintNFT(addr2.address, TOKEN_URI3);
      
      expect(await nft.tokenURI(0)).to.equal(TOKEN_URI1);
      expect(await nft.tokenURI(1)).to.equal(TOKEN_URI2);
      expect(await nft.tokenURI(2)).to.equal(TOKEN_URI3);
    });

    it("Should return different URIs for different tokens", async function () {
      const uri1 = "ipfs://QmHash1/metadata1.json";
      const uri2 = "ipfs://QmHash2/metadata2.json";
      
      await nft.mintNFT(addr1.address, uri1);
      await nft.mintNFT(addr1.address, uri2);
      
      expect(await nft.tokenURI(0)).to.equal(uri1);
      expect(await nft.tokenURI(1)).to.equal(uri2);
      expect(await nft.tokenURI(0)).to.not.equal(await nft.tokenURI(1));
    });

    it("Should maintain URI after transfer", async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      
      const uriBefore = await nft.tokenURI(0);
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      const uriAfter = await nft.tokenURI(0);
      
      expect(uriAfter).to.equal(uriBefore);
      expect(uriAfter).to.equal(TOKEN_URI1);
    });

    it("Should revert when getting URI of non-existent token", async function () {
      await expect(
        nft.tokenURI(999)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should accept empty URI string", async function () {
      await nft.mintNFT(addr1.address, "");
      
      expect(await nft.tokenURI(0)).to.equal("");
    });

    it("Should accept long URI strings", async function () {
      const longURI = "ipfs://QmVeryLongHash123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ/metadata.json?param=value&another=test";
      
      await nft.mintNFT(addr1.address, longURI);
      
      expect(await nft.tokenURI(0)).to.equal(longURI);
    });
  });

  // ============ TRANSFER FUNCTIONALITY ============
  describe("Transfer Functionality", function () {
    beforeEach(async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      await nft.mintNFT(addr2.address, TOKEN_URI2);
    });

    it("Should transfer NFT correctly", async function () {
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
      expect(await nft.ownerOf(0)).to.equal(addr2.address);
    });

    it("Should emit Transfer event on transfer", async function () {
      await expect(
        nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).to.emit(nft, "Transfer")
        .withArgs(addr1.address, addr2.address, 0);
    });

    it("Should use safeTransferFrom", async function () {
      await nft.connect(addr1)["safeTransferFrom(address,address,uint256)"](
        addr1.address,
        addr2.address,
        0
      );
      
      expect(await nft.ownerOf(0)).to.equal(addr2.address);
    });

    it("Should revert when transferring token you don't own", async function () {
      await expect(
        nft.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(nft, "ERC721InsufficientApproval");
    });

    it("Should revert when transferring to zero address", async function () {
      await expect(
        nft.connect(addr1).transferFrom(addr1.address, ethers.ZeroAddress, 0)
      ).to.be.revertedWithCustomError(nft, "ERC721InvalidReceiver");
    });
  });

  // ============ TOTAL SUPPLY TESTS ============
  describe("Total Supply", function () {
    it("Should track total supply correctly", async function () {
      expect(await nft.totalSupply()).to.equal(0);
      
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      expect(await nft.totalSupply()).to.equal(1);
      
      await nft.mintNFT(addr1.address, TOKEN_URI2);
      expect(await nft.totalSupply()).to.equal(2);
      
      await nft.mintNFT(addr2.address, TOKEN_URI3);
      expect(await nft.totalSupply()).to.equal(3);
    });

    it("Should not decrease total supply after transfer", async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      await nft.mintNFT(addr1.address, TOKEN_URI2);
      
      const supplyBefore = await nft.totalSupply();
      
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
      expect(await nft.totalSupply()).to.equal(supplyBefore);
    });
  });

  // ============ EDGE CASES ============
  describe("Edge Cases", function () {
    it("Should handle minting to contract owner", async function () {
      await nft.mintNFT(owner.address, TOKEN_URI1);
      
      expect(await nft.ownerOf(0)).to.equal(owner.address);
      expect(await nft.balanceOf(owner.address)).to.equal(1);
    });

    it("Should handle multiple operations in sequence", async function () {
      // Mint
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      
      // Approve
      await nft.connect(addr1).approve(addr2.address, 0);
      expect(await nft.getApproved(0)).to.equal(addr2.address);
      
      // Transfer
      await nft.connect(addr2).transferFrom(addr1.address, addr2.address, 0);
      expect(await nft.ownerOf(0)).to.equal(addr2.address);
      
      // Check URI still correct
      expect(await nft.tokenURI(0)).to.equal(TOKEN_URI1);
    });

    it("Should clear approval after transfer", async function () {
      await nft.mintNFT(addr1.address, TOKEN_URI1);
      await nft.connect(addr1).approve(addr2.address, 0);
      
      expect(await nft.getApproved(0)).to.equal(addr2.address);
      
      await nft.connect(addr1).transferFrom(addr1.address, owner.address, 0);
      
      expect(await nft.getApproved(0)).to.equal(ethers.ZeroAddress);
    });
  });
});