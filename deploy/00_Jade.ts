import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { BigNumberish } from "ethers";
import type { DeployFunction, DeployResult } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { preDeploy } from "../utils/contracts";
import { verifyContract } from "../utils/verify";
import { isLocalhostNetwork } from "../utils/networks";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, getChainId, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await preDeploy(deployer, "Jade");
  const deployResult: DeployResult = await deploy("JadeToken", {
    from: deployer,
    args: [],
    log: true,
  });

  // You don't want to verify on localhost
  if (isLocalhostNetwork(chainId) === false) {
    const contractPath = `contracts/Jade.sol:JadeToken`;
    await verifyContract({
      contractPath: contractPath,
      contractAddress: deployResult.address,
      args: deployResult.args || [],
    });
  }
};

export default func;
func.id = "deploy_jadeToken";
func.tags = ["JadeToken"];
