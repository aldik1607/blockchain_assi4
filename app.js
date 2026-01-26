import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const ERC20_ADDRESS = "YOUR_ERC20_ADDRESS";
const ERC721_ADDRESS = "YOUR_ERC721_ADDRESS";

const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)"
];

const ERC721_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenURI(uint256) view returns (string)"
];

let provider, signer, account;

async function init() {
    if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        document.getElementById('connectBtn').onclick = connectWallet;
    }
}

async function connectWallet() {
    signer = await provider.getSigner();
    account = await signer.getAddress();
    document.getElementById('walletAddress').innerText = account;
    loadERC20();
    loadERC721();
}

async function loadERC20() {
    const contract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, provider);
    const name = await contract.name();
    const symbol = await contract.symbol();
    const balance = await contract.balanceOf(account);
    const decimals = await contract.decimals();

    document.getElementById('tokenInfo').innerText = `${name} (${symbol})`;
    document.getElementById('tokenBalance').innerText = ethers.formatUnits(balance, decimals);
}

document.getElementById('transferBtn').onclick = async () => {
    const to = document.getElementById('transferTo').value;
    const amount = document.getElementById('transferAmount').value;
    const contract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, signer);
    
    try {
        const tx = await contract.transfer(to, ethers.parseUnits(amount, 18));
        document.getElementById('erc20Result').innerText = "Tx Hash: " + tx.hash;
        await tx.wait();
        loadERC20();
    } catch (err) {
        console.error(err);
    }
};

async function loadERC721() {
    const contract = new ethers.Contract(ERC721_ADDRESS, ERC721_ABI, provider);
    const balance = await contract.balanceOf(account);
    document.getElementById('nftCount').innerText = balance.toString();

    const listDiv = document.getElementById('nftList');
    listDiv.innerHTML = "";

    for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(account, i);
        const uri = await contract.tokenURI(tokenId);
        const item = document.createElement('div');
        item.innerHTML = `ID: ${tokenId} - <small>${uri}</small>`;
        listDiv.appendChild(item);
    }
}

init();