import shouldBehaveLikePlay from "./effects/play";
import shouldBehaveLikeWithdraw from "./effects/withdraw";
import shouldBehaveLikeOwner from "./view/owner";

export function shouldBehaveLikePlinkoContract(): void {
  describe("View Functions", function () {
    describe("#owner", function () {
      shouldBehaveLikeOwner();
    });
  });

  describe("Effects Functions", function () {
    // describe("#play", function () {
    //   shouldBehaveLikePlay();
    // });
    describe("#withdraw", function () {
      shouldBehaveLikeWithdraw();
    });
  });
}
