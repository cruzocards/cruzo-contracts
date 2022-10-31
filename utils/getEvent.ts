import { ContractReceipt, Event } from "ethers";

export const getEvent = (receipt: ContractReceipt, name: string): Event => {
  const event = receipt.events?.filter((x) => x.event === name);
  if (!event || !event[0]) {
    throw `'${name}' event is missing, terminating`;
  }
  return event[0];
};
