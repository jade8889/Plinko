export function shouldBehaveLikePlinkoContract(): void {
  describe("Plinko Contract Behavior", function () {
    it("should set the correct initial values", async function () {
      const lightningModeActive = await this.contracts.plinko.lightningModeActive();
      assert.equal(lightningModeActive, false, "Lightning mode should be initially inactive");

      const lightningModeFee = await this.contracts.plinko.lightningModeFee();
      assert.equal(lightningModeFee.toString(), ethers.utils.parseEther("0.01").toString(), "Lightning mode fee should be 0.01 ether");
    });

    // Add more tests to cover all functionalities and edge cases
  });
}
