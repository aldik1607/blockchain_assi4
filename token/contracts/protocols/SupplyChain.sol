// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    struct Item {
        string name;
        string status;
    }

    Item[] public items;
    mapping(uint256 => address) public itemOwner;

    // Добавить новый товар
    function registerItem(string memory name) external {
        items.push(Item(name, "Registered"));
        itemOwner[items.length - 1] = msg.sender;
    }

    // Обновить статус товара
    function updateStatus(uint256 itemId, string memory status) external {
        require(itemOwner[itemId] == msg.sender, "Not owner");
        items[itemId].status = status;
    }

    // Получить информацию о товаре
    function getItem(uint256 itemId) external view returns (string memory, string memory, address) {
        Item memory item = items[itemId];
        return (item.name, item.status, itemOwner[itemId]);
    }

    // Общее количество товаров
    function totalItems() external view returns (uint256) {
        return items.length;
    }
}
