import "dotenv/config";

import { Agent } from "./agent";

async function main() {
  const agent = new Agent();

  const question =
    "Tell me the current weather and current time in Dhaka.";

  console.log("User:");
  console.log(question);

  const answer = await agent.run(question);

  console.log("\nFinal Answer:");
  console.log(answer);
}

main().catch((error) => {
  console.error("\nApplication Error:");
  console.error(error);

  process.exit(1);
});
