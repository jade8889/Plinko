import { expect } from "chai";
import { formatEther, parseEther } from "ethers";
import { ethers } from "hardhat";

export default function shouldBehaveLikePlay(): void {
  context("when playing Plinko", function () {
    beforeEach(async function () {
      // const LinkContract = await ethers.getContractAt("ERC20Mock", '0x514910771AF9Ca656af840dff83E8264EcF986CA');
      // const totalSupply = await LinkContract.totalSupply();
      // console.log('totalSupply', totalSupply)
      await this.contracts.jadeToken.approve(await this.contracts.plinko.getAddress(), parseEther("100"));
    });
    it("emits the Plinko_Play_Event", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          100,
          await this.contracts.jadeToken.getAddress(),
          8, //numRows,
          0, // risk,
          1, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000") // stopLoss,
        )
      ).to.emit(this.contracts.plinko, "Plinko_Play_Event");
    });

    it("reverts if numRows is invalid", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          100,
          await this.contracts.jadeToken.getAddress(),
          5, //numRows,
          0, // risk,
          1, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000") // stopLoss,
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "InvalidNumRows");
    });

    // Add more tests for edge cases and other parameters
  });
}
