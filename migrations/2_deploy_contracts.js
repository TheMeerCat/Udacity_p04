const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async (deployer) => {

    let firstAirline = '0x30570d8b5fe851542c4032679c96d905aa3b42de'; // address[1] from ganache

    await deployer.deploy(FlightSuretyData, firstAirline, 'This is the first aierline');
    let data = await FlightSuretyData.deployed();

    await deployer.deploy(FlightSuretyApp, data.address);
    let app = await FlightSuretyApp.deployed();

    await data.authorizeContract(app.address);

    let config = {
        localhost: {
            url: 'http://127.0.0.1:9545',
            dataAddress: FlightSuretyData.address,
            appAddress: FlightSuretyApp.address
        }
    }
    fs.writeFileSync(__dirname + '/../src/dapp/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
    fs.writeFileSync(__dirname + '/../src/server/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
}