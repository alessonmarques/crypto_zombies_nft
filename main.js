var cryptoZombies;
var accounts;
var userAccount;

var cryptoZombiesAddress = "0x7812b7bab9D4129fDC701874a497472e607AA967";

cryptoZombies = new web3.eth.Contract(cryptoZombiesABI, cryptoZombiesAddress);

function startApp() {
  var accountInterval = setInterval(function () {
    if (Web3.eth.accounts[0] !== userAccount) {
      userAccount = accounts[0];

      getZombiesByOwner(userAccount)
        .then(displayZombies);
    }
  }, 100);

  cryptoZombies.events.Transfer({ filter: { _to: userAccount } })
    .on("data", function (event) {
      let data = event.returnValues;
      getZombiesByOwner(userAccount).then(displayZombies);
    }).on("error", console.error);
}


function displayZombies(ids) {
  $("#zombies").empty();
  for (id of ids) {

    getZombieDetails(id)
      .then(function (zombie) {


        $("#zombies").append(`<div class="zombie">
        <ul>
          <li>Name: ${zombie.name}</li>
          <li>DNA: ${zombie.dna}</li>
          <li>Level: ${zombie.level}</li>
          <li>Wins: ${zombie.winCount}</li>
          <li>Losses: ${zombie.lossCount}</li>
          <li>Ready Time: ${zombie.readyTime}</li>
        </ul>
      </div>`);
      });
  }
}

function createRandomZombie(name) {
  $("#txStatus").text("Creating new zombie on the blockchain. This may take a while...");
  return cryptoZombies.methods.createRandomZombie(name)
    .send({ from: userAccount })
    .on("receipt", function (receipt) {
      $("#txStatus").text("Successfully created " + name + "!");

      getZombiesByOwner(userAccount).then(displayZombies);
    })
    .on("error", function (error) {

      $("#txStatus").text(error);
    });
}

function feedOnKitty(zombieId, kittyId) {
  $("#txStatus").text("Eating a kitty. This may take a while...");
  return cryptoZombies.methods.feedOnKitty(zombieId, kittyId)
    .send({ from: userAccount })
    .on("receipt", function (receipt) {
      $("#txStatus").text("Ate a kitty and spawned a new Zombie!");
      getZombiesByOwner(userAccount).then(displayZombies);
    })
    .on("error", function (error) {
      $("#txStatus").text(error);
    });
}

function levelUp(zombieId) {
  $("#txStatus").text("Leveling up your zombie...");
  return cryptoZombies.methods.levelUp(zombieId)
    .send({ from: userAccount, value: web3.utils.toWei("0.001", "ether") })
    .on("receipt", function (receipt) {
      $("#txStatus").text("Power overwhelming! Zombie successfully leveled up");
    })
    .on("error", function (error) {
      $("#txStatus").text(error);
    });
}

function getZombieDetails(id) {
  return cryptoZombies.methods.zombies(id).call()
}

function zombieToOwner(id) {
  return cryptoZombies.methods.zombieToOwner(id).call()
}

function getZombiesByOwner(owner) {
  ethereum
    .request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: owner,
          to: cryptoZombiesAddress,
          value: '0x29a2241af62c0000',
          gasPrice: '0x09184e72a000',
          gas: '0x2710',
        },
      ],
    })
  return cryptoZombies.methods.getZombiesByOwner(owner).call()
}

async function getAccount() {
  ethereum.request({ method: 'eth_requestAccounts' });
  accounts = await ethereum.request({ method: 'eth_accounts' });
}

ethereum.on('accountsChanged', function (accounts) {
  getAccount();
});


window.addEventListener('load', function () {

  if (typeof window.web3 !== 'undefined') {
    getAccount();
  }
  else {
    console.log('install metamask');
  }


  startApp()

})