// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface ERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint);
    event Transfer(address indexed from, address indexed to, uint256 value);
}

contract HorizonFaucet {
    uint256 public waitTime = 1 days;
    uint256 public tokenAmount;
    address public owner;
    bool public faucetEnabled;

    ERC20 public tokenInstance;
    
    mapping(address => uint256) public nextAccessTime;

    constructor(address _tokenInstance, uint256 _tokenAmount) {
        require(_tokenInstance != address(0) && _tokenAmount != 0);
        tokenInstance = ERC20(_tokenInstance);
        tokenAmount = _tokenAmount;
        owner = msg.sender;
    }

    function requestTokens() public  enabled {
        require(tokenAmount <= checkRemaining(), "Faucet out of supply!");
        require(allowedToWithdraw(msg.sender), "You are not allowed to withdraw!");
        tokenInstance.transfer(msg.sender, tokenAmount);
        nextAccessTime[msg.sender] = block.timestamp + waitTime;
    }

    function allowedToWithdraw(address _address) public view returns (bool) {
        if(tokenAmount <= checkRemaining()) {
            if(nextAccessTime[_address] == 0) {
                return true;
            } else if(block.timestamp >= nextAccessTime[_address]) {
                return true;
            }
        }
        return false;
    }

    function updateWaitTime(uint256 newWaitTime) public {
        require(msg.sender == owner && newWaitTime != 0);
        waitTime = newWaitTime;
    }

    function updateTokenAmount(uint256 newTokenAmount) public {
        require(msg.sender == owner && newTokenAmount != 0);
        tokenAmount = newTokenAmount;
    }

    function updateOwner(address newOwner) public {
        require(msg.sender == owner);
        owner = newOwner;
    }

    function withdrawTokens(uint256 withdrawAmount) public {
        require(msg.sender == owner);
        require(withdrawAmount <= checkRemaining(), "Token amount too high!");
        tokenInstance.transfer(msg.sender, withdrawAmount);
    }

    function checkRemaining() public view returns(uint) {
        return tokenInstance.balanceOf(address(this));
    }

    function toggleFaucetEnabled() public {
        require(msg.sender == owner);
        faucetEnabled = !faucetEnabled;        
    }

    modifier enabled() {
        require(faucetEnabled, "Faucet is suspended temporarily!");
        _;
    }
}