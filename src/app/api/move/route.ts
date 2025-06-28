// app/api/move/route.ts (Next.js App Router)
import { streamText } from "ai";
import { registry } from "@/registry";

export const runtime = "edge";

export async function POST(req: Request) {
  const { fen, legalMoves, model } = await req.json();
  const llm = registry.languageModel(model);

  const prompt = `
You are a chess grandmaster playing as Black. The user is playing as White.
It is Black's turn to move.
Current board (FEN): ${fen}
Legal moves for Black (UCI): ${legalMoves.join(", ")}
You must respond with one of the provided UCI move strings, and nothing else. Do NOT use algebraic notation like e5, Nxe5, exf6, etc. For example, if the move is pawn from e7 to e5, respond with 'e7e5'. If the move is knight from g8 to f6, respond with 'g8f6'. Do not include any explanation, prefix, or extra text. Only output the move string itself.
`;

  const aiStream = streamText({
    model: llm,
    prompt,
    system: "Choose only from the provided legal moves.",
  });

  return aiStream.toTextStreamResponse();
}
