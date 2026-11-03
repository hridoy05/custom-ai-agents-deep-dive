export type AgentDecision =
  | {
      type: "action";
      tool: string;
      arguments: Record<string, unknown>;
    }
  | {
      type: "final";
      answer: string;
    };

export type Message = {
  role: "user" | "model";
  parts: {
    text: string;
  }[];
};
