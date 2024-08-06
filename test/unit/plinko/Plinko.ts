import { shouldBehaveLikePlinkoContract } from "./Plinko.behavior";

export function testPlinko(): void {
  describe("Plinko", function () {
    beforeEach(async function () { });

    shouldBehaveLikePlinkoContract();
  });
}
