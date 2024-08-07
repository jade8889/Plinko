import { parseEther } from "ethers";
import { ethers, getNamedAccounts, getUnnamedAccounts, network } from "hardhat";

import { shouldBehaveLikePlinkoContract } from "./Plinko.behavior";

export function testPlinko(): void {
  describe("Plinko", function () {
    // beforeEach(async function () {
    //   await this.contracts.jadeToken.mint(
    //     this.contracts.jadeCoreBankroll.getAddress(),
    //     parseEther("100000")
    //   );
    //   await this.contracts.jadeToken.mint(this.signers.deployer.address, parseEther("100000"));
    // });

    before(async function () {
      this.utils = {
        revertToInitialSnapshot: async () => {
          await network.provider.send("evm_revert", [this.initialSnapshotId]);
        },
      };
      this.initialSnapshotId = await network.provider.send("evm_snapshot", []);
      this.snapshotId = this.initialSnapshotId;
    });

    beforeEach(async function () {
      this.snapshotId = await network.provider.send("evm_snapshot");
      this.users = [];

      await this.contracts.jadeToken.mint(
        await this.contracts.jadeCoreBankroll.getAddress(),
        parseEther("100000")
      );
      await this.contracts.jadeToken.mint(this.signers.deployer.address, parseEther("100000"));
    });

    afterEach(async function () {
      await network.provider.send("evm_revert", [this.snapshotId]);
    });

    after(async function () {
      await this.utils.revertToInitialSnapshot();
    });

    shouldBehaveLikePlinkoContract();
  });
}
