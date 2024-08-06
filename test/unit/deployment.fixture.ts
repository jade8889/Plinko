import { deployments, ethers } from "hardhat";

import { Contracts } from "../shared/types";

export async function loadDeploymentFixture(): Promise<Contracts> {
  const deploymentSummary = await deployments.fixture();

  console.log('deploymentSummary', deploymentSummary)

  const lock = await ethers.getContractAt("Lock", deploymentSummary.Lock.address);
  const jadeCoreBankroll = await ethers.getContractAt("JadeCoreBankroll", deploymentSummary.JadeCoreBankroll.address);
  const plinko = await ethers.getContractAt("Plinko", deploymentSummary.Plinko.address);

  return {
    lock,
    jadeCoreBankroll,
    plinko,
  };
}
