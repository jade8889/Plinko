import shouldBehaveLikePlay from "./effects/play";
import shouldBehaveLikeMultiplier from "./effects/multiplier";
import shouldBehaveLikeClaim from "./effects/claim";
import shouldBehaveLikeOwner from "./view/owner";

export function shouldBehaveLikePlinkoContract(): void {
  describe("View Functions", function () {
    describe("#owner", function () {
      shouldBehaveLikeOwner();
    });
  });

  describe("Effects Functions", function () {
    describe("#multiplier", function () {
      shouldBehaveLikeMultiplier();
    });
    describe("#play", function () {
      shouldBehaveLikePlay();
    });
    describe("#claim", function () {
      shouldBehaveLikeClaim();
    });
  });
}
