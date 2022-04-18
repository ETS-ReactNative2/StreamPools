const hre = require('hardhat');
require('dotenv').config();

const EULER_MAINNET = '0x27182842E098f60e3D576794A5bFFb0777E025d3';
const EULER_ROPSTEN = '0xfC3DD73e918b931be7DEfd0cc616508391bcc001';

async function main() {
  const StreamPools = await hre.ethers.getContractFactory('StreamPools');
  const streamPools = await StreamPools.deploy(process.env.IS_MAINNET ? EULER_MAINNET : EULER_ROPSTEN);
  await streamPools.deployed();

  console.log(`StreamPools contract deployed to ${process.env.IS_MAINNET ? 'MAINNET' : 'ROPSTEN'}`, streamPools.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
