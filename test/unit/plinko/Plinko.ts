import { shouldBehaveLikeLockContract } from "./Plinko.behavior";
import { plinkoFixture } from "./Plinko.fixture";

export function testLock(): void {
  describe("Lock", function () {
    beforeEach(async function () {
      const { lock, unlockTime, lockedAmount } = await this.loadFixture(plinkoFixture);
      this.contracts.lock = lock;
      this.unlockTime = unlockTime;
      this.lockedAmount = lockedAmount;
    });

    shouldBehaveLikeLockContract();
  });
}
