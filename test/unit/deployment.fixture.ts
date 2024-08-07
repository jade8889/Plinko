import { deployments, ethers } from "hardhat";

import { Contracts } from "../shared/types";

export async function loadDeploymentFixture(): Promise<Contracts> {
  const deploymentSummary = await deployments.fixture();

  const jadeToken = await ethers.getContractAt("JadeToken", deploymentSummary.JadeToken.address);
  const jadeCoreBankroll = await ethers.getContractAt("JadeCoreBankroll", deploymentSummary.JadeCoreBankroll.address);
  const plinko = await ethers.getContractAt("Plinko", deploymentSummary.Plinko.address);

  return {
    jadeToken,
    jadeCoreBankroll,
    plinko,
  };
}
