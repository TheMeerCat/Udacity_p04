import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

//  contract event codes
const STATUS_CODES = [0, 10, 20, 30, 40, 50];

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));

web3.eth.defaultAccount = web3.eth.accounts[0];
let accounts = [];
const gas = 450000;
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

let oracles = [];

async function registerOracles() {
  accounts = await web3.eth.getAccounts();

  let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();

  for (let a = 1; a <= 40; a++) {
    if (typeof accounts[a] != 'undefined') {
      await flightSuretyApp.methods.registerOracle().send({ from: accounts[a], value: fee, gas: gas });
      let result = await flightSuretyApp.methods.getMyIndexes().call({ from: accounts[a] });
      console.log(`Oracle Registered: ${a} , ${accounts[a]}, ${result[0]}, ${result[1]}, ${result[2]}`);
      oracles.push({ account: accounts[a], indexes: result });
    }
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

flightSuretyApp.events.OracleRequest({
  fromBlock: "latest"
}, function (error, result) {
  if (error) {
    console.log(error);
    return;
  }
  console.log(`\nOracle Requested: index: ${result.returnValues.index}, flight:  ${result.returnValues.flight}, timestamp: ${result.returnValues.timestamp}`);
  for (let i = 0; i < oracles.length; i++) {
    if (oracles[i].indexes.includes(result.returnValues.index)) {
      const statusCode = STATUS_CODES[getRandomInt(STATUS_CODES.length)];
      console.log(`submitOracleResponse from ${oracles[i].account}, for index ${result.returnValues.index} with code ${statusCode}`);
      try {
        flightSuretyApp.methods.submitOracleResponse(result.returnValues.index, result.returnValues.airline, result.returnValues.flight, result.returnValues.timestamp, statusCode).send({ from: oracles[i].account, gas: gas });
      } catch (e) {
        console.log("Error submitOracleResponse: ", e.message);
      }
    }
  }
});


flightSuretyApp.events.allEvents({
  fromBlock: "latest"
}, function (error, result) {
  if (error) {
    console.info('allEvents error', error)
  }
})
  .on("connected", function (subscriptionId) {
    console.info("connected: ", subscriptionId);
  })
  .on('data', function (result) {
    //console.log(result); // same results as the optional callback above
    if (result.event === 'OracleRequest') {
      //console.log(`\nOracle Requested: index: ${result.returnValues.index}, flight:  ${result.returnValues.flight}, timestamp: ${result.returnValues.timestamp}`);
    } else if (result.event == 'FlightStatusInfo') {
      console.info(`\nFlight Status Available: flight: ${result.returnValues.flight}, timestamp: ${result.returnValues.timestamp}, status: ${result.returnValues.status == 10 ? 'ON TIME' : 'DELAYED'}`);

    } else if (result.event == 'OracleReport') {
      console.info(`\nOracle Report: flight: ${result.returnValues.flight}, timestamp: ${result.returnValues.timestamp}, status: ${result.returnValues.status == 10 ? 'ON TIME' : 'DELAYED'}`);
    } else if (result.event == 'InsurancePurchased') {
      console.info(`\nInsurancePurchased for Passenger: ${result.returnValues.paxAddress} ,Flight: ${result.returnValues.flight}, Amount: ${result.returnValues.amount} ETH`);

    } else {
      console.log('unknown event ', result);
    }
  })
  .on('changed', function (result) {
    // remove event from local database
  })
  .on('error', function (error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    console.error(error);
  });


const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
});

registerOracles().finally(() => { console.log(oracles) });

export default app;