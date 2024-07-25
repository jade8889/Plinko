import { ethers } from "hardhat";
import { Plinko } from "../../../types";

export async function plinkoFixture(): Promise<{ plinko: Plinko }> {
    const Bankroll = await ethers.getContractFactory("Bankroll");
    const bankroll = await Bankroll.deploy();
    await bankroll.waitForDeployment();

    const VRF = await ethers.getContractFactory("VRF");
    const vrf = await VRF.deploy();
    await vrf.waitForDeployment();

    const LinkEthFeed = await ethers.getContractFactory("LinkEthFeed");
    const linkEthFeed = await LinkEthFeed.deploy();
    await linkEthFeed.waitForDeployment();

    const Forwarder = await ethers.getContractFactory("Forwarder");
    const forwarder = await Forwarder.deploy();
    await forwarder.waitForDeployment();

    const Plinko = await ethers.getContractFactory("Plinko");
    const plinko = await Plinko.deploy(
        bankroll.address,
        vrf.address,
        linkEthFeed.address,
        forwarder.address
    );
    await plinko.deployed();

    return { plinko };
}
