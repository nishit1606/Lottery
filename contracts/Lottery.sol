pragma solidity ^0.4.17;

contract Lottery {
  address public manager;
  address[] public players;

  function Lottery() public {
    // Creator of this Lottery is its manager
    manager = msg.sender;
  }

  function enter() public payable {
    // If playar sends along .01 ETH or more
    require(msg.value > .01 ether);
    // Push his address to the players array
    players.push(msg.sender);
  }

  function random() private view returns (uint) {
    // SHA3 of block difficulty, current time and players' addresses
    return uint(keccak256(block.difficulty, now, players));
  }

  function pickWinner() public restricted {
    // Pseudo-randomly pick winner's index
    uint index = random() % players.length;
    // Transfer all the ether from the pool to the winner
    players[index].transfer(this.balance);
    // Reset contract state
    players = new address[](0);
  }

  modifier restricted() {
    // Only manager can pick a winner
    require(msg.sender == manager);
    _;
  }

  function getPlayers() public view returns (address[]) {
    return players;
  }
}
