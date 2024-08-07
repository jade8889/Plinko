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

  const jadeCoreBankRollDeployment = await deployments.get("JadeCoreBankroll");

  await preDeploy(deployer, "Plinko");

  const _forwarder = deployer;
  const _oracle = "0xc287d52DFF95A6A49bdd2c3BB985c0E581b33d9c";
  const _jobId = "04b672c3f6ea455184c7d8700dd71851";
  const _fee = 0;

  const deployResult: DeployResult = await deploy("Plinko", {
    from: deployer,
    args: [jadeCoreBankRollDeployment.address, _forwarder, _oracle, _jobId, _fee],
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
func.id = "deploy_plinko";
func.tags = ["Plinko"];
