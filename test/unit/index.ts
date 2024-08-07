import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network } from "hardhat";

import type { Contracts, Signers } from "../shared/types";
import { loadDeploymentFixture } from "./deployment.fixture";
import { testPlinko } from "./plinko/Plinko";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;
    this.contracts = {} as Contracts;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.deployer = signers[0];
    this.signers.accounts = signers.slice(1);

    this.loadFixture = loadFixture;
    this.contracts = await this.loadFixture(loadDeploymentFixture);
  });

  testPlinko();
});
