import type { AddressLike, BigNumberish } from "ethers";
import type { DeployFunction, DeployResult } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { preDeploy } from "../utils/contracts";
import { generateSalt } from "../utils/misc";
import { isLocalhostNetwork } from "../utils/networks";
import { verifyContract } from "../utils/verify";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, getChainId, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await preDeploy(deployer, "JadeCoreBankroll");
  const deployResult: DeployResult = await deploy("JadeCoreBankroll", {
    from: deployer,
    args: [],
    log: true,
  });

  if (isLocalhostNetwork(chainId) === false) {
    const contractPath = `contracts/JadeCoreBankRoll.sol:JadeCoreBankroll`;
    await verifyContract({
      contractPath: contractPath,
      contractAddress: deployResult.address,
      args: deployResult.args || [],
    });
  }
};

export default func;
func.id = "deploy_jadeCoreBankRoll";
func.tags = ["JadeCoreBankRoll"];
