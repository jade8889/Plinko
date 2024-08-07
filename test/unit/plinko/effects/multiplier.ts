import { expect } from "chai";

export default function shouldBehaveLikeMultiplier(): void {
  context("Plinko Multiplier", function () {
    const multipliers = [
      [
        [2050, 400, 90, 60, 40, 60, 90, 400, 2050], // numRows 8, length 9
        [4500, 800, 90, 60, 40, 40, 60, 90, 800, 4500], // numRows 9, length 10
        [4700, 800, 200, 90, 60, 40, 60, 90, 200, 800, 4700], // numRows 10, length 11
        [6500, 1700, 400, 90, 60, 40, 40, 60, 90, 400, 1700, 6500], // numRows 11, length 12
        [7000, 1600, 300, 200, 90, 60, 40, 60, 90, 200, 300, 1600, 7000], // numRows 12, length 13
        [8000, 1700, 600, 400, 90, 60, 40, 40, 60, 90, 400, 600, 1700, 8000], // numRows 13, length 14
        [10000, 4500, 900, 300, 110, 90, 60, 40, 60, 90, 110, 300, 900, 4500, 10000], // numRows 14, length 15
        [11000, 4500, 1300, 900, 110, 90, 60, 40, 40, 60, 90, 110, 900, 1300, 4500, 11000], // numRows 15, length 16
        [12000, 2800, 2400, 800, 200, 90, 90, 60, 40, 60, 90, 90, 200, 800, 2400, 2800, 12000], // numRows 16, length 17
      ],
      [
        [5000, 400, 50, 40, 20, 40, 50, 400, 5000], // numRows 8, length 9
        [6600, 1200, 50, 40, 20, 20, 40, 50, 1200, 6600], // numRows 9, length 10
        [9500, 1000, 200, 90, 40, 20, 40, 90, 200, 1000, 9500], // numRows 10, length 11
        [15000, 2000, 500, 60, 50, 20, 20, 50, 60, 500, 2000, 15000], // numRows 11, length 12
        [17500, 3500, 400, 200, 60, 40, 20, 40, 60, 200, 400, 3500, 17500], // numRows 12, length 13
        [25000, 4400, 700, 400, 90, 40, 20, 20, 40, 90, 400, 700, 4400, 25000], // numRows 13, length 14
        [39000, 5500, 1500, 400, 90, 80, 40, 20, 40, 80, 90, 400, 1500, 5500, 39000], // numRows 14, length 15
        [50000, 6000, 2200, 800, 200, 90, 40, 20, 20, 40, 90, 200, 800, 2200, 6000, 50000], // numRows 15, length 16
        [52000, 8000, 1500, 1000, 300, 200, 50, 30, 20, 30, 50, 200, 300, 1000, 1500, 8000, 52000], // numRows 16, length 17
      ],
      [
        [10000, 60, 20, 20, 10, 20, 20, 60, 10000], // numRows 8, length 9
        [14300, 500, 70, 30, 10, 10, 30, 70, 500, 14300], // numRows 9, length 10
        [17000, 1500, 200, 30, 20, 10, 20, 30, 200, 1500, 17000], // numRows 10, length 11
        [29000, 1500, 200, 80, 50, 30, 30, 50, 80, 200, 1500, 29000], // numRows 11, length 12
        [38000, 2000, 400, 200, 80, 30, 10, 30, 80, 200, 400, 2000, 38000], // numRows 12, length 13
        [50000, 6800, 700, 200, 90, 40, 20, 20, 40, 90, 200, 700, 6800, 50000], // numRows 13, length 14
        [77000, 6500, 1300, 300, 200, 50, 30, 10, 30, 50, 200, 300, 1300, 6500, 77000], // numRows 14, length 15
        [80000, 20000, 5000, 500, 80, 50, 30, 10, 10, 30, 50, 80, 500, 5000, 20000, 80000], // numRows 15, length 16
        [
          100000, 28000, 3000, 1500, 150, 60, 50, 40, 10, 40, 50, 60, 150, 1500, 3000, 28000,
          100000,
        ], // numRows 16, length 17
      ],
    ];

    const risks = [0, 1, 2];
    const numRowsArray = [8, 9, 10, 11, 12, 13, 14, 15, 16];

    beforeEach(async function () {
      for (let risk = 0; risk < risks.length; risk++) {
        for (let numRows = 0; numRows < numRowsArray.length; numRows++) {
          const multipliersToSet = multipliers[risk][numRows];
          await this.contracts.plinko.setPlinkoMultipliers(
            multipliersToSet,
            numRowsArray[numRows],
            risk
          );
        }
      }
    });

    it("check Multiplier", async function () {
      const multiplier = await this.contracts.plinko.Plinko_GetMultipliers();
      expect(multiplier.length).to.be.equal(3);
      expect(multiplier[0].length).to.be.equal(9);
      expect(multiplier[0][0].length).to.be.equal(17);
      // Convert BigNumbers to numbers for comparison
      const expectedMultipliers = multiplier[0][8].map((num) => Number(num));
      for (let i = 0; i < expectedMultipliers.length; i++) {
        expect(multipliers[0][8][i]).to.equal(expectedMultipliers[i]);
      }
      // console.log("multiplier", multiplier[0]);
    });
  });
}
