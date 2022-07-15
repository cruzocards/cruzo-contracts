import fs from "fs";

interface AddressTrackingEntry {
  token: string;
  market: string;
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
  entry: AddressTrackingEntry
): void => {
  try {
    const addressMapping = getMapping(addressMappingFileName);
    addressMapping.set(chainId.toString(), entry);
    setMapping(addressMappingFileName, addressMapping);
  } catch (e) {
    console.warn("Could not update contract address");
  }
};

const getMapping = (fileName: string): AddressTrackingMap => {
  const jsonContent = fs.readFileSync(fileName, {
    encoding: "utf8",
  });
  return new Map(Object.entries(JSON.parse(jsonContent)));
};

const setMapping = (fileName: string, mapping: AddressTrackingMap) => {
  fs.writeFileSync(fileName, JSON.stringify(Object.fromEntries(mapping)));
};
