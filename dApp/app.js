import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const ERC20_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
const ERC721_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)"
];

const ERC721_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function getOwner(uint256 tokenId) view returns (address)", 
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function totalSupply() view returns (uint256)"
];

let provider, signer, account, erc20Decimals = 18;

async function init() {
    if (!window.ethereum) {
        alert("MetaMask (or another Web3 wallet) is required.");
        return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    console.log("Подключено к сети с Chain ID:", network.chainId);
    document.getElementById("connectBtn").onclick = connectWallet;
}

async function connectWallet() {
    try {
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        account = await signer.getAddress();
        document.getElementById("walletAddress").innerText = account;

        await loadERC20();
        await loadERC721();
    } catch (err) {
        console.error(err);
        alert("Failed to connect wallet. Check MetaMask.");
    }
}

// ---------- ERC‑20 ----------

async function loadERC20() {
    try {
        const currentAccount = await signer.getAddress();
        console.log("Запрашиваю баланс для:", currentAccount);

        const contract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, provider);

        const [name, symbol, balance, decimals] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.balanceOf(currentAccount),
            contract.decimals()
        ]);

        console.log(`Данные контракта: Name=${name}, Decimals=${decimals}, RawBalance=${balance}`);

        erc20Decimals = Number(decimals);
        
        document.getElementById("tokenInfo").innerText = `${name} (${symbol})`;
        
        const formattedBalance = ethers.formatUnits(balance, erc20Decimals);
        document.getElementById("tokenBalance").innerText = formattedBalance;

    } catch (err) {
        console.error("Ошибка в loadERC20:", err);
    }
}

document.getElementById("transferBtn").onclick = async () => {
    if (!signer) {
        alert("Connect your wallet first.");
        return;
    }

    const to = document.getElementById("transferTo").value.trim();
    const amount = document.getElementById("transferAmount").value.trim();
    const resultDiv = document.getElementById("erc20Result");
    resultDiv.innerText = "";

    if (!to || !amount) {
        resultDiv.innerText = "Please enter recipient and amount.";
        return;
    }

    try {
        const contract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, signer);
        const tx = await contract.transfer(
            to,
            ethers.parseUnits(amount, erc20Decimals)
        );
        resultDiv.innerText = "Pending Tx Hash: " + tx.hash;
        await tx.wait();
        resultDiv.innerText = "Confirmed Tx Hash: " + tx.hash;
        await loadERC20();
    } catch (err) {
        console.error(err);
        resultDiv.innerText = "Error: " + (err.message || err);
    }
};

// ---------- ERC‑721 (NFT) ----------

async function loadERC721() {
    const contract = new ethers.Contract(ERC721_ADDRESS, ERC721_ABI, provider);

    const total = await contract.totalSupply(); 

    const listDiv = document.getElementById("nftList");
    listDiv.innerHTML = "";

    let ownedCount = 0;

    for (let tokenId = 0; tokenId < total; tokenId++) {
        try {
            const owner = await contract.getOwner(tokenId);
            if (owner.toLowerCase() !== account.toLowerCase()) {
                continue;
            }

            ownedCount++;
            const uri = await contract.tokenURI(tokenId);

            const item = document.createElement("div");
            item.className = "nft-item";
            item.innerHTML = `
                <strong>Token ID:</strong> ${tokenId}<br/>
                <strong>Owner:</strong> ${owner}<br/>
                <strong>Metadata URI:</strong> <small>${uri}</small>
            `;
            listDiv.appendChild(item);
        } catch (err) {
            console.error("Error loading token", tokenId, err);
        }
    }

    document.getElementById("nftCount").innerText = ownedCount.toString();
}

init();