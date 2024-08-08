import { expect } from "chai";
import { parseEther } from "ethers";
import { ethers } from "hardhat";

export default function shouldBehaveLikePlay(): void {
  beforeEach(async function () {
    // Grant the GAME_ROLE to the plinko contract so that plinko contract can send payout to user
    const GAME_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GAME_ROLE"));

    // const roleAdmin = await this.contracts.jadeCoreBankroll.getRoleAdmin(GAME_ROLE);
    // console.log("roleAdmin", roleAdmin);

    await this.contracts.jadeCoreBankroll.grantRole(
      GAME_ROLE,
      await this.contracts.plinko.getAddress()
    );

    // Set Multipliers

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

    for (let risk = 0; risk < risks.length; risk++) {
      for (let numRows = 0; numRows < numRowsArray.length; numRows++) {
        const multipliersToSet = multipliers[risk][numRows];
        // console.log("multipliersToSet", multipliersToSet);
        // console.log("numRowsArray[numRows]", numRowsArray[numRows]);
        await this.contracts.plinko.setPlinkoMultipliers(
          multipliersToSet,
          numRowsArray[numRows],
          risk
        );
        // console.log(`Set multipliers for risk ${risk} and numRows ${numRowsArray[numRows]}`);
      }
    }
  });

  context("when asset is ETH", function () {
    beforeEach(async function () {
      const [owner] = await ethers.getSigners();
      const targetAddress = await this.contracts.jadeCoreBankroll.getAddress(); // Replace with your target address
      let tx = await owner.sendTransaction({
        to: targetAddress,
        value: ethers.parseEther("100.0"), // Replace with the amount of ETH you want to send
      });
      await tx.wait();

      tx = await this.contracts.plinko.Plinko_Play(
        parseEther("0.05"),
        "0x0000000000000000000000000000000000000000",
        16, //numRows,
        1, // risk,
        13, // numBets,
        parseEther("1000"), // stopGain,
        parseEther("1000"), // stopLoss,
        { value: parseEther("0.65") }
      );

      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log) =>
          log.topics[0] ===
          ethers.id(
            "Plinko_Play_Event(bytes32,address,uint256,address,uint8,uint8,uint256,uint256,uint256,uint256)"
          )
      );

      this.id = (event as any)?.args[0];
    });
    it("check fulfillRandomWords", async function () {
      console.log("id", this.id);
      const tx = await this.contracts.plinko.fulfillRandomWords(this.id, [
        "75481731650017781380264719787662827019967645306527464693911132476087797796717",
        "48945439137839300590731463245030068163698895831140877591121048375487323771740",
        "105279910279932050870035666471522232600529977090637709999301522630628384758490",
        "32756441928204883217615961535924921496034064228404831672196221623534676889691",
        "72467046906933259272189524266808279922417608594764398281336838618223242957768",
        "23453232219388364107216558609517140583649625343489366472496910435302654073139",
        "7699460520285911211894908471302862206942361246979306043075262189287731929962",
        "21794514614313139377481605338303560919574886824232531216250660598909067882218",
        "88747972169122641097541951690473122036564852220089310638590544624145512295565",
        "63573426162613279468367278135201819485073221339625538630754455604779333884866",
        "32997704113899232572221714555230069376807048867191487828594057818625645837930",
        "23516293811000893670935038800633363548959211289580438367365703741133277014760",
        "66480520346933239042070093246942340490678772556991717571159121041669288559409",
      ]);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log) =>
          log.topics[0] ===
          ethers.keccak256(
            ethers.toUtf8Bytes(
              "Plinko_Outcome_Event(address,uint256,uint256,address,uint16[],bool[],uint8,uint8,uint256[],uint32)"
            )
          )
      );
      if (event) {
        const decodedEvent = this.contracts.plinko.interface.decodeEventLog(
          "Plinko_Outcome_Event",
          event.data,
          event.topics
        );

        const {
          playerAddress,
          wager,
          payout,
          tokenAddress,
          paths,
          lightningModes,
          numRows,
          risk,
          payouts,
          numGames,
        } = decodedEvent;

        console.log("Outcome Event");
        console.log("playerAddress", playerAddress);
        console.log("wager", wager.toString());
        console.log("payout", payout.toString());
        console.log("tokenAddress", tokenAddress);
        console.log("paths", paths);
        console.log("lightningModes", lightningModes);
        console.log("numRows", numRows);
        console.log("risk", risk);
        console.log("payouts", payouts);
        console.log("numGames", numGames);
      } else {
        console.log("No Plinko_Outcome_Event found");
      }
    });

    // Add more tests for edge cases and other parameters
  });
}
