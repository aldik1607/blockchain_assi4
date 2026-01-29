const hre = require("hardhat");

async function main() {
  const [owner, supplier] = await hre.ethers.getSigners();

  const supplyChainAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; 
  const supplyChain = await hre.ethers.getContractAt("SupplyChain", supplyChainAddress);

  console.log("Регистрируем товары...");
  await supplyChain.connect(owner).registerItem("Item A");
  await supplyChain.connect(supplier).registerItem("Item B");

  console.log("Обновляем статус товаров...");
  await supplyChain.connect(owner).updateStatus(0, "In Transit");
  await supplyChain.connect(supplier).updateStatus(1, "In Transit");

  console.log("Доставляем товары...");
  await supplyChain.connect(owner).updateStatus(0, "Delivered");
  await supplyChain.connect(supplier).updateStatus(1, "Delivered");

  console.log("Итоговое состояние:");
  const item0 = await supplyChain.getItem(0);
  const item1 = await supplyChain.getItem(1);

  console.log(`Item 0: ${item0[0]}, Status: ${item0[1]}, Owner: ${item0[2]}`);
  console.log(`Item 1: ${item1[0]}, Status: ${item1[1]}, Owner: ${item1[2]}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
