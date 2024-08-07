import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import type { JadeToken, PlinkoMock, JadeCoreBankroll } from "../../types/";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    contracts: Contracts;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Contracts {
  jadeToken: JadeToken;
  plinko: PlinkoMock;
  jadeCoreBankroll: JadeCoreBankroll;
}

export interface Signers {
  deployer: SignerWithAddress;
  accounts: SignerWithAddress[];
}
