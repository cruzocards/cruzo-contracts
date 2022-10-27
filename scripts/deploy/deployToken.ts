import { ContractType } from "../../utils/addressTracking";
import { deployToken } from "../../utils/deployToken";

async function main() {
  await deployToken(
    {
      name: "Cruzo",
      symbol: "CRZ",
      contractURI: "https://cruzo.cards/contract-metadata",
      publiclyMintable: true,
    },
    ContractType.token
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
