import { expect } from "chai";
import { formatEther, parseEther } from "ethers";
import { ethers } from "hardhat";

export default function shouldBehaveLikePlay(): void {
  context("when asset is ETH", function () {
    beforeEach(async function () {
      const [owner] = await ethers.getSigners();
      const targetAddress = await this.contracts.jadeCoreBankroll.getAddress(); // Replace with your target address
      const tx = await owner.sendTransaction({
        to: targetAddress,
        value: ethers.parseEther("10.0"), // Replace with the amount of ETH you want to send
      });
      await tx.wait();
    });

    it("numRows should >= 8 && <=16", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("10"),
          "0x0000000000000000000000000000000000000000",
          5, //numRows,
          0, // risk,
          1, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
          { value: parseEther("10") }
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "InvalidNumRows");
    });

    it("risk should <3", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("10"),
          "0x0000000000000000000000000000000000000000",
          8, //numRows,
          3, // risk,
          1, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
          { value: parseEther("10") }
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "InvalidRisk");
    });

    it("numBets should >= 1 && <=100", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("10"),
          "0x0000000000000000000000000000000000000000",
          8, //numRows,
          0, // risk,
          101, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
          { value: parseEther("1010") }
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "InvalidNumBets");
    });

    it("bank roll should have enough amount", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("10"),
          "0x0000000000000000000000000000000000000000",
          8, //numRows,
          0, // risk,
          10, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
          { value: parseEther("100") }
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "WagerAboveLimit");
    });
    it("emits the Plinko_Play_Event", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("0.05"),
          "0x0000000000000000000000000000000000000000",
          8, //numRows,
          0, // risk,
          1, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
          { value: parseEther("0.05") }
        )
      ).to.emit(this.contracts.plinko, "Plinko_Play_Event");
    });
  });

  context("when asset is Token", function () {
    beforeEach(async function () {
      await this.contracts.jadeToken.mint(
        await this.contracts.jadeCoreBankroll.getAddress(),
        parseEther("10")
      );
      await this.contracts.jadeToken.approve(
        await this.contracts.plinko.getAddress(),
        parseEther("1000")
      );
    });

    it("numRows should >= 8 && <=16", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("10"),
          await this.contracts.jadeToken.getAddress(),
          5, //numRows,
          0, // risk,
          1, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "InvalidNumRows");
    });

    it("risk should <3", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("10"),
          await this.contracts.jadeToken.getAddress(),
          8, //numRows,
          3, // risk,
          1, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "InvalidRisk");
    });

    it("numBets should >= 1 && <=100", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("10"),
          await this.contracts.jadeToken.getAddress(),
          8, //numRows,
          0, // risk,
          101, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "InvalidNumBets");
    });

    it("bank roll should have enough amount", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("10"),
          await this.contracts.jadeToken.getAddress(),
          8, //numRows,
          0, // risk,
          10, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
        )
      ).to.be.revertedWithCustomError(this.contracts.plinko, "WagerAboveLimit");
    });
    it("emits the Plinko_Play_Event", async function () {
      await expect(
        this.contracts.plinko.Plinko_Play(
          parseEther("0.05"),
          await this.contracts.jadeToken.getAddress(),
          8, //numRows,
          0, // risk,
          1, // numBets,
          parseEther("1000"), // stopGain,
          parseEther("1000"), // stopLoss,
        )
      ).to.emit(this.contracts.plinko, "Plinko_Play_Event");
    });

    // it("emits the Plinko_Play_Event", async function () {
    //   await expect(
    //     this.contracts.plinko.Plinko_Play(
    //       parseEther("10"),
    //       await this.contracts.jadeToken.getAddress(),
    //       8, //numRows,
    //       0, // risk,
    //       1, // numBets,
    //       parseEther("1000"), // stopGain,
    //       parseEther("1000") // stopLoss,
    //     )
    //   ).to.emit(this.contracts.plinko, "Plinko_Play_Event");
    // });

  });
}
