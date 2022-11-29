import { ContractReceipt, Event } from "ethers";

export const getEvent = <T extends Event>(receipt: ContractReceipt, name: string): T => {
  const event = receipt.events?.filter((x) => x.event === name);
  if (!event || !event[0]) {
    throw `'${name}' event is missing, terminating`;
  }
  return event[0] as T;
};
