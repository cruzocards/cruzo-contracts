import fs from "fs";
import { ethers } from "hardhat";

export enum ContractType {
  beacon = "beacon",
  market = "market",
  factory = "factory",
}

interface AddressTrackingEntry {
  [ContractType.beacon]?: string;
  [ContractType.market]?: string;
  [ContractType.factory]?: string;
}

type AddressTrackingMap = Map<string, AddressTrackingEntry>;

const addressMappingFileName = "networks.json";

export const getAddress = (
  chainId: number
): AddressTrackingEntry | undefined => {
  try {
    const addressMapping = getMapping(addressMappingFileName);
    return addressMapping.get(chainId.toString());
  } catch (e) {
    console.warn("Could not retrieve contract address");
  }
};

export const setAddress = (
  chainId: number,
  contract: ContractType,
  address: string
): void => {
  if (!chainId || !contract || !address) {
    throw new Error(
      `Missing one of mandatory arguments: [${chainId}, ${contract}, ${address}]`
    );
  }
  try {
    const addressMapping = getMapping(addressMappingFileName);
    const networkEntry = addressMapping.get(chainId.toString()) || {};
    networkEntry[contract] = address;
    addressMapping.set(chainId.toString(), networkEntry);
    setMapping(addressMappingFileName, addressMapping);
  } catch (e) {
    console.warn("Could not update contract address");
    console.log(e);
  }
};

const getMapping = (fileName: string): AddressTrackingMap => {
  const jsonContent = fs.readFileSync(fileName, {
    encoding: "utf8",
  });
  return new Map(Object.entries(JSON.parse(jsonContent)));
};

const setMapping = (fileName: string, mapping: AddressTrackingMap) => {
  fs.writeFileSync(
    fileName,
    JSON.stringify(Object.fromEntries(mapping), null, 2)
  );
};

export const setNewMarketAddress = (chainId: number, entry: string): void => {
  try {
    const addressMapping = getMapping(addressMappingFileName);
    let temp = addressMapping.get(chainId.toString());
    temp!.market = entry;
    addressMapping.set(chainId.toString(), temp!);
    setMapping(addressMappingFileName, addressMapping);
  } catch (e) {
    console.warn("Could not update contract address");
  }
};

export const setNewFactoryAddress = (chainId: number, entry: string): void => {
  try {
    const addressMapping = getMapping(addressMappingFileName);
    let temp = addressMapping.get(chainId.toString());
    temp!.factory = entry;
    addressMapping.set(chainId.toString(), temp!);
    setMapping(addressMappingFileName, addressMapping);
  } catch (e) {
    console.warn("Could not update contract address");
  }
};

export const setNewBeaconAddress = (chainId: number, entry: string): void => {
  try {
    const addressMapping = getMapping(addressMappingFileName);
    let temp = addressMapping.get(chainId.toString());
    temp!.beacon = entry;
    addressMapping.set(chainId.toString(), temp!);
    setMapping(addressMappingFileName, addressMapping);
  } catch (e) {
    console.warn("Could not update contract address");
  }
};

export const initialize = (chainId: number): void => {
  try {
    const addressMapping = getMapping(addressMappingFileName);
    const zeroEntry: AddressTrackingEntry = {
      market: ethers.constants.AddressZero,
      factory: ethers.constants.AddressZero,
      beacon: ethers.constants.AddressZero,
    };
    addressMapping.set(chainId.toString(), zeroEntry);
    setMapping(addressMappingFileName, addressMapping);
  } catch (e) {
    console.warn("Could not update contract address");
  }
};
