import { askGemini } from "./gemini";
import { executeTool } from "./tools";

import type {
  AgentDecision,
  Message,
} from "./types";

function parseDecision(text: string): AgentDecision {
  const parsed: unknown = JSON.parse(text);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Gemini returned an invalid JSON object");
  }

  const decision = parsed as Record<string, unknown>;

  if (decision.type === "final") {
    if (typeof decision.answer !== "string") {
      throw new Error("Final decision must contain an answer");
    }

    return {
      type: "final",
      answer: decision.answer,
    };
  }

  if (decision.type === "action") {
    if (
      typeof decision.tool !== "string" ||
      typeof decision.arguments !== "object" ||
      decision.arguments === null ||
      Array.isArray(decision.arguments)
    ) {
      throw new Error("Invalid action decision");
    }

    return {
      type: "action",
      tool: decision.tool,
      arguments: decision.arguments as Record<string, unknown>,
    };
  }

  throw new Error("Unknown decision type");
}


// The Agent Loop coordinates the entire process:
// 1. Send the conversation to the LLM.
// 2. Receive its decision.
// 3. Parse the JSON response.
// 4. Execute a Tool if requested.
// 5. Add the Tool result as an Observation.
// 6. Call the LLM again.
// 7. Stop when a final answer is received

export class Agent {
  private messages: Message[] = [];

  private maxSteps = 5;

  async run(userInput: string): Promise<string> {
    this.messages = [
      {
        role: "user",
        parts: [
          {
            text: userInput,
          },
        ],
      },
    ];

    for (let step = 1; step <= this.maxSteps; step++) {
      console.log(`\n--- Agent Step ${step} ---`);

      // THINK: Ask Gemini to make a decision
      const response = await askGemini(this.messages);

      console.log("Gemini Decision:");
      console.log("think response", response);

      // Parse and validate Gemini's decision
      const decision = parseDecision(response);

      // Save Gemini's response in conversation history
      this.messages.push({
        role: "model",
        parts: [
          {
            text: response,
          },
        ],
      });

      // FINAL ANSWER: Stop the loop
      if (decision.type === "final") {
        console.log("\nAgent completed.");

        return decision.answer;
      }

      // ACTION: Execute the selected tool
      console.log(`\nExecuting Tool: ${decision.tool}`);

      let observation: string;

      try {
        observation = await executeTool(
          decision.tool,
          decision.arguments
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown tool execution error";

        observation = JSON.stringify({
          success: false,
          error: errorMessage,
        });
      }

      console.log("\nObservation:");
      console.log(observation);

      // OBSERVATION: Add the tool result to conversation history
      this.messages.push({
        role: "user",
        parts: [
          {
            text: `
The tool "${decision.tool}" has finished execution.

Tool Observation:
${observation}

Use this observation to decide your next action,
or provide the final answer if enough information is available.
            `,
          },
        ],
      });
    }

    throw new Error("Maximum agent steps reached");
  }
}
