"use client";

import React, { useState, useEffect } from "react";
import { UserRound, Brain } from "lucide-react";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
// If the above import fails, fallback:
// type Square = string;
import ChessboardWrapper from "./components/ChessboardWrapper";
import Modal from "./components/Modal";
import OpenAI from "./components/OpenAI";
import GameStatusMessages, {
  getGameStatusMessage,
} from "./components/GameStatusMessages";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [model, setModel] = useState("openai:gpt-4o-mini");
  const [userName, setUserName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState("");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalSquares, setLegalSquares] = useState<string[]>([]);

  // Initialize game status on component mount
  useEffect(() => {
    setGameStatus(""); // Don't show turn messages
  }, []);

  async function requestAIMove(gameInstance?: Chess) {
    // Use provided game instance or current game state
    const currentGame = gameInstance || game;

    if (currentGame.isGameOver()) {
      updateGameStatus();
      return;
    }

    // Ensure it's Black's turn
    if (currentGame.turn() !== "b") {
      console.error("Error: AI called when it's not Black's turn");
      return;
    }

    setIsAIThinking(true);
    setGameStatus(""); // Don't show thinking messages

    try {
      const requestData = {
        fen: currentGame.fen(),
        legalMoves: currentGame.moves({ verbose: false }),
        model,
      };

      console.log("Sending to AI:", {
        turn: currentGame.turn(),
        fen: requestData.fen,
        legalMovesCount: requestData.legalMoves.length,
        sampleMoves: requestData.legalMoves.slice(0, 5),
      });

      const res = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }

      // Read the streamed response
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let text = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and add to accumulated text
          const chunk = new TextDecoder().decode(value);
          text += chunk;
        }
      } finally {
        reader.releaseLock();
      }

      console.log("AI response:", text);

      // Clean up the AI response - remove common prefixes and extra whitespace
      let moveString = text
        .replace(/^Move:\s*/i, "")
        .replace(/^AI Move:\s*/i, "")
        .replace(/^Black plays:\s*/i, "")
        .trim();

      // Extract just the move part if there's additional text
      const moveMatch = moveString.match(
        /\b([a-h][1-8][a-h][1-8][qrbnQRBN]?)\b/
      );
      if (moveMatch) {
        moveString = moveMatch[1].toLowerCase();
      }

      console.log("Parsed move:", moveString);

      // Create new game instance and try to make the move
      const newGame = new Chess(currentGame.fen());

      // Try UCI only if the moveString matches UCI format
      let move;
      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(moveString)) {
        const from = moveString.slice(0, 2);
        const to = moveString.slice(2, 4);
        const promotion = moveString.length === 5 ? moveString[4] : undefined;

        move = newGame.move({
          from,
          to,
          promotion: promotion || "q", // Default to queen promotion
        });
      }

      // If UCI fails, try robust SAN (algebraic) matching
      if (!move) {
        const legalMoves = newGame.moves({ verbose: true });

        // 1. Exact SAN match
        let sanMatches = legalMoves.filter((m) => m.san === moveString);

        // 2. Case-insensitive SAN match
        if (sanMatches.length !== 1) {
          sanMatches = legalMoves.filter(
            (m) => m.san.toLowerCase() === moveString.toLowerCase()
          );
        }

        // 3. Ignore whitespace and symbols (e.g., "Nf6", "Nxf6", "N f6")
        if (sanMatches.length !== 1) {
          const cleaned = moveString.replace(/[^a-z0-9]/gi, "").toLowerCase();
          sanMatches = legalMoves.filter(
            (m) => m.san.replace(/[^a-z0-9]/gi, "").toLowerCase() === cleaned
          );
        }

        if (sanMatches.length === 1) {
          move = newGame.move(sanMatches[0]);
        }
      }

      if (!move) {
        throw new Error(
          `Illegal, ambiguous, or unrecognized move: ${moveString}`
        );
      }

      // Update the game state
      setGame(newGame);
      setPosition(newGame.fen());

      // Log the successful move
      console.log("AI played:", move.san);
      setGameStatus(""); // Don't show move messages

      // Check for game over conditions
      setTimeout(() => {
        updateGameStatus();
      }, 1000);
    } catch (error) {
      console.error("Error making AI move:", error);
      setGameStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );

      // Try to make a random legal move as fallback
      const legalMoves = currentGame.moves({ verbose: true });
      if (legalMoves.length > 0) {
        const randomMove =
          legalMoves[Math.floor(Math.random() * legalMoves.length)];
        const newGame = new Chess(currentGame.fen());
        newGame.move(randomMove);
        setGame(newGame);
        setPosition(newGame.fen());
        setGameStatus(""); // Don't show move messages
        setTimeout(updateGameStatus, 1000);
      }
    } finally {
      setIsAIThinking(false);
    }
  }

  function updateGameStatus() {
    const status = getGameStatusMessage(game);
    setGameStatus(status);
  }

  function newGame() {
    const newGameInstance = new Chess();
    setGame(newGameInstance);
    setPosition(newGameInstance.fen());
    setGameStatus(""); // Don't show turn messages
    setSelectedSquare(null);
    setLegalSquares([]);
    setIsAIThinking(false);
  }

  function onSquareClick(square: string) {
    // If a piece is already selected and the clicked square is a legal move, make the move
    if (selectedSquare && legalSquares.includes(square)) {
      // Prevent moves if AI is thinking or game is over
      if (isAIThinking || game.isGameOver()) return;
      // Only allow user to move if it's White's turn
      if (game.turn() !== "w") return;

      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });
      if (move === null) {
        setSelectedSquare(null);
        setLegalSquares([]);
        return;
      }
      setGame(newGame);
      setPosition(newGame.fen());
      setGameStatus(""); // Don't show move messages
      setSelectedSquare(null);
      setLegalSquares([]);

      // Check for immediate game over (checkmate, draw, etc.)
      if (newGame.isGameOver()) {
        setTimeout(() => {
          const gameInstance = new Chess(newGame.fen());
          const status = getGameStatusMessage(gameInstance);
          setGameStatus(status);
        }, 500);
      } else {
        // Let AI respond after player's move - pass the updated game state
        setTimeout(() => requestAIMove(newGame), 500);
      }
      return;
    }

    // Otherwise, select the piece and show its legal moves
    const piece = game.get(square as Square);
    if (game.turn() === "w" && piece && piece.color === "w") {
      setSelectedSquare(square);
      // Cast square to Square to satisfy chess.js typings
      const moves = game.moves({ square: square as Square, verbose: true }) as {
        to: string;
      }[];
      setLegalSquares(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalSquares([]);
    }
  }

  function getCustomSquareStyles() {
    const highlightStyle = {
      background:
        "radial-gradient(circle, rgba(0, 0, 0, 0.5) 20%, transparent 20%)",
      borderRadius: "50%",
    };
    const selectedStyle = {
      background: "rgba(0, 0, 0, 0.7)",
    };
    const styles: { [square: string]: React.CSSProperties } = {};
    if (selectedSquare) styles[selectedSquare] = selectedStyle;
    legalSquares.forEach((sq) => {
      styles[sq] = highlightStyle;
    });
    return styles;
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    // Prevent moves if AI is thinking or game is over
    if (isAIThinking || game.isGameOver()) return false;

    // Only allow user to move if it's White's turn
    if (game.turn() !== "w") return false;

    const newGame = new Chess(game.fen());
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move === null) return false;

    setGame(newGame);
    setPosition(newGame.fen());
    setGameStatus(""); // Don't show move messages
    setSelectedSquare(null);
    setLegalSquares([]);

    // Check for immediate game over (checkmate, draw, etc.)
    if (newGame.isGameOver()) {
      setTimeout(() => {
        const gameInstance = new Chess(newGame.fen());
        const status = getGameStatusMessage(gameInstance);
        setGameStatus(status);
      }, 500);
    } else {
      // Let AI respond after player's move - pass the updated game state
      setTimeout(() => requestAIMove(newGame), 500);
    }

    return true;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-2 sm:p-4">
      <GameStatusMessages
        game={game}
        gameStatus={gameStatus}
        setGameStatus={setGameStatus}
      />
      <Modal
        isOpen={isModalOpen}
        initialModel={model}
        onConfirm={(selectedModel, enteredName) => {
          setModel(selectedModel);
          setUserName(enteredName);
          setIsModalOpen(false);
        }}
      />

      {!isModalOpen && (
        <>
          {/* Chess board with player info on sides */}
          <div className="flex flex-col items-center w-full max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-md gap-1">
            {/* Black player info (top) with thinking status */}
            <div className="flex items-center justify-between bg-black text-white px-2 sm:px-3 py-2 gap-2 sm:gap-3 w-full border border-white/20">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center">
                  <OpenAI className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm sm:text-lg">
                    {model === "openai:gpt-4o-mini" ? "GPT-4o-mini" : model}
                  </span>
                </div>
              </div>
              {isAIThinking && (
                <div className="text-xs text-emerald-200 animate-pulse flex items-center gap-1">
                  <Brain className="w-4 h-4 sm:w-6 sm:h-6" />
                  <span className="hidden sm:inline">Thinking..</span>
                  <span className="sm:hidden">Thinking..</span>
                </div>
              )}
            </div>

            {/* Chess board container */}
            <div className="bg-black p-2 sm:p-4 border border-white/50 w-full">
              <ChessboardWrapper
                position={position}
                onPieceDrop={onDrop}
                onSquareClick={onSquareClick}
                customSquareStyles={getCustomSquareStyles()}
                isAIThinking={isAIThinking}
              />
            </div>

            {/* White player info (bottom) */}
            <div className="flex items-center justify-between bg-black text-white px-2 sm:px-3 py-2 gap-2 sm:gap-3 w-full border border-white/20">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center">
                  <UserRound className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm sm:text-lg">
                    {userName}
                  </span>
                </div>
              </div>
              {game.turn() === "w" && !game.isGameOver() && !isAIThinking && (
                <div className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse"></div>
              )}
            </div>

            {/* New Game Button */}
            <div className="w-full mt-4">
              <button
                onClick={newGame}
                className="w-full bg-transparent border border-white/30 hover:border-white hover:bg-white/10 text-white py-2 sm:py-3 px-4 transition-all duration-200 text-sm sm:text-base font-medium"
                disabled={isAIThinking}
              >
                New Game
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
