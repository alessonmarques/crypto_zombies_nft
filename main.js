var cryptoZombies;
var clientStatus = 0; // Offline
var accounts;
var userAccount;
var currentChain;
var web3;
var cryptoZombiesContract;

var cryptoZombiesAddress = "0x7812b7bab9D4129fDC701874a497472e607AA967";

let destroy = () => {
  $('html').empty();
  clientStatus = 2; // Destroyed.
  requestChain();
}

let requestChain = async () => {
  await ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x61' }],
  });
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
    myZombies.forEach(async (tokenId) => {
      let Zombie = await callMethod('zombies', [tokenId]);
      console.log(Zombie);
    });
  }

}

ethereum.on('chainChanged', (chainId) => {
  currentChain = chainId;

  if (currentChain != 97) {
    destroy();
  }
  else if (currentChain == 97 && clientStatus == 2) {
    startApp();
  }

});

ethereum.on('accountsChanged', function (accounts) {
  userAccount = accounts[0];
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
