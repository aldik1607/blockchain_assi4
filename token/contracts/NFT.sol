// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("SimpleNFT", "SNFT") Ownable(msg.sender) {}

    function mintNFT(address to, string memory uri)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        _nextTokenId++;
        return tokenId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    function getOwner(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }
}
