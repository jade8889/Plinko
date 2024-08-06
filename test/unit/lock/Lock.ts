import { shouldBehaveLikeLockContract } from "./Lock.behavior";
import { lockFixture } from "./Lock.fixture";

export function testLock(): void {
  describe("Lock", function () {
    beforeEach(async function () { });

    shouldBehaveLikeLockContract();
  });
}
