var cryptoZombies;
var clientStatus = 0; // Offline
var accounts;
var userAccount;
var currentChain;
var web3;
var cryptoZombiesContract;

var Zombie;

// https://testnet.bscscan.com/address/0x7812b7bab9d4129fdc701874a497472e607aa967
var cryptoZombiesAddress = "0x7812b7bab9D4129fDC701874a497472e607AA967";

let destroy = () => {
  $('#txStatus, #zombies').empty();
  clientStatus = 2; // Destroyed.
}

let requestChain = async () => {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x61' }],
    });
  } catch (switchError) {
    let bscTestNetParams = {
      chainId: web3.utils.toHex(97),// string; // A 0x-prefixed hexadecimal string
      chainName: 'BSC TESTNET',// string;
      nativeCurrency: {
        name: 'Test BNB', // string;
        symbol: 'tBNB', // string; // 2-6 characters long
        decimals: 18,
      },
      rpcUrls: 'https://data-seed-prebsc-1-s1.binance.org:8545/', //string[];
      blockExplorerUrls: 'https://testnet.bscscan.com/',// string[];
    };
    switch (switchError.code) {
      // This error code indicates that the chain has not been added to MetaMask.
      case 4902:
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [bscTestNetParams],
          });
        } catch (addError) {
          console.log(addError);
        }
        break;
      default:
        console.log("Error: ", switchError.code);
        break;
    }
  }
}

let requestAccounts = async () => {
  return await ethereum.request({ method: 'eth_requestAccounts' });
}

let getAccounts = async () => {
  accounts = await ethereum.request({ method: 'eth_accounts' });
  userAccount = accounts[0];
  clientStatus = 1; // Connected
}

let callMethod = async (method, params) => {
  return await cryptoZombiesContract.methods[method](...params).call({ from: userAccount })
    .then(function (receipt) {
      return receipt;
    });
}

let sendTransaction = async (method, params) => {
  cryptoZombiesContract.methods[method](...params).send({ from: userAccount })
    .then(function (receipt) {
      console.log(receipt);
    });
}

let createRandomZombie = async (zombieName) => {
  return await sendTransaction('createRandomZombie', [zombieName]);
}

let getZombiesByOwner = async (address) => {
  let myZombies = await callMethod('getZombiesByOwner', [address]);
  if (myZombies) {
    myZombies = [myZombies[0]];
    myZombies.forEach(async (tokenId) => {
      Zombie = await callMethod('zombies', [tokenId]);
      Zombie.id = tokenId;
      $("#zombies").append(`<div class="zombie">
        <ul>
          <li>Id: ${tokenId}</li>
          <li>Name: ${Zombie.name}</li>
          <li>DNA: ${Zombie.dna}</li>
          <li>Level: ${Zombie.level}</li>
          <li>Wins: ${Zombie.winCount}</li>
          <li>Losses: ${Zombie.lossCount}</li>
          <li>Ready Time: ${Zombie.readyTime}</li>
        </ul>
      </div>`);
    });
  }
}


let feedOnKitty = async (zombieId, kittyId) => {
  $("#txStatus").text("Eating a kitty. This may take a while...");
  return await sendTransaction('feedOnKitty', [zombieId, kittyId]);
}

let levelUp = async (zombieId) => {
  $("#txStatus").text("Leveling up your zombie...");
  return await sendTransaction('levelUp', [zombieId]);
}

// A $( document ).ready() block.
$(document).ready(function () {
  $("#feedZombie").click(async () => {
    let kittyId = $('#kittyId').val();
    if (kittyId) {
      let response = await feedOnKitty(Zombie.id, kittyId);
      if (response) {
        await getZombiesByOwner();
        $("#txStatus").text("Ate a kitty and spawned a new Zombie!");
      }
    } else {
      $("#txStatus").text("Please define a kittyId");
    }
  });

  $("#levelUp").click(async () => {
    console.log(Zombie);
    let response = await levelUp(Zombie.id);
    if (response) {
      await getZombiesByOwner();
      $("#txStatus").text("Leveled up!");
    }
  });
});


ethereum.on('chainChanged', (chainId) => {
  currentChain = chainId;

  if (currentChain != 97) {
    destroy();
    requestChain();
  }
  else if (currentChain == 97 && clientStatus == 2) {
    startApp();
  }

});

ethereum.on('accountsChanged', function (accounts) {
  userAccount = accounts[0];
  destroy();
  startApp();
});

let startApp = async () => {
  await requestChain();
  await requestAccounts();
  await getAccounts();
  if (clientStatus) {
    loadContract();
    getZombiesByOwner(userAccount);
  }
}

let loadContract = async () => {
  web3 = new Web3(window.ethereum);
  cryptoZombiesContract = new web3.eth.Contract(cryptoZombiesABI, cryptoZombiesAddress);
}

if (typeof window.ethereum !== 'undefined') {
  startApp();
}
