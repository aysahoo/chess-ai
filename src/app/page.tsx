"use client";

import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [model, setModel] = useState("openai:gpt-4");
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState("");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalSquares, setLegalSquares] = useState<string[]>([]);

  // Initialize game status on component mount
  useEffect(() => {
    setGameStatus("Your turn! You play as White.");
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
    setGameStatus("AI is thinking...");

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
      setGameStatus(`AI played: ${move.san}`);

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
        setGameStatus(`AI made random move: ${randomMove.san} (due to error)`);
        setTimeout(updateGameStatus, 1000);
      }
    } finally {
      setIsAIThinking(false);
    }
  }

  function updateGameStatus() {
    if (game.isCheckmate()) {
      setGameStatus(
        game.turn() === "w"
          ? "Black wins by checkmate!"
          : "White wins by checkmate!"
      );
    } else if (game.isDraw()) {
      if (game.isStalemate()) {
        setGameStatus("Game drawn by stalemate!");
      } else if (game.isInsufficientMaterial()) {
        setGameStatus("Game drawn by insufficient material!");
      } else if (game.isThreefoldRepetition()) {
        setGameStatus("Game drawn by threefold repetition!");
      } else {
        setGameStatus("Game drawn!");
      }
    } else if (game.isCheck()) {
      setGameStatus(
        game.turn() === "w" ? "White is in check!" : "Black is in check!"
      );
    } else {
      setGameStatus("");
    }
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
      setGameStatus(`You played: ${move.san}`);
      setSelectedSquare(null);
      setLegalSquares([]);

      // Check for immediate game over (checkmate, draw, etc.)
      if (newGame.isGameOver()) {
        setTimeout(() => {
          const gameInstance = new Chess(newGame.fen());
          if (gameInstance.isCheckmate()) {
            setGameStatus("White wins by checkmate!");
          } else if (gameInstance.isDraw()) {
            setGameStatus("Game drawn!");
          }
        }, 500);
      } else {
        // Let AI respond after player's move - pass the updated game state
        setTimeout(() => requestAIMove(newGame), 500);
      }
      return;
    }

    // Otherwise, select the piece and show its legal moves
    const piece = game.get(square as any);
    if (game.turn() === "w" && piece && piece.color === "w") {
      setSelectedSquare(square);
      // Cast square to any to satisfy chess.js typings
      const moves = game.moves({ square: square as any, verbose: true }) as {
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
    setGameStatus(`You played: ${move.san}`);
    setSelectedSquare(null);
    setLegalSquares([]);

    // Check for immediate game over (checkmate, draw, etc.)
    if (newGame.isGameOver()) {
      setTimeout(() => {
        const gameInstance = new Chess(newGame.fen());
        if (gameInstance.isCheckmate()) {
          setGameStatus("White wins by checkmate!");
        } else if (gameInstance.isDraw()) {
          setGameStatus("Game drawn!");
        }
      }, 500);
    } else {
      // Let AI respond after player's move - pass the updated game state
      setTimeout(() => requestAIMove(newGame), 500);
    }

    return true;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-4">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="p-2 rounded border"
          disabled={isAIThinking}
        >
          <option value="openai:gpt-4">GPT-4</option>
          {/* <option value="anthropic:claude-4">Claude 4</option> */}
        </select>
      </div>

      {/* Game Status Display */}
      <div className="mb-4 h-8 flex items-center">
        {isAIThinking && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>AI is thinking...</span>
          </div>
        )}
        {!isAIThinking && gameStatus && (
          <div
            className={`text-center font-medium ${
              gameStatus.includes("wins") || gameStatus.includes("drawn")
                ? "text-red-600"
                : gameStatus.includes("check")
                ? "text-orange-600"
                : "text-green-600"
            }`}
          >
            {gameStatus}
          </div>
        )}
      </div>

      <div style={{ width: "400px" }}>
        <Chessboard
          position={position}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick as (square: any) => void}
          customSquareStyles={getCustomSquareStyles() as any}
          boardOrientation="white"
          customDarkSquareStyle={{ backgroundColor: "#779556" }}
          customLightSquareStyle={{ backgroundColor: "#eeeed2" }}
          areArrowsAllowed={false}
        />
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-gray-600 max-w-md">
        <p className="text-sm">
          You play as White. Make your move by dragging pieces. The AI will
          respond as Black.
        </p>
        {game.isGameOver() && (
          <button
            onClick={() => {
              const newGame = new Chess();
              setGame(newGame);
              setPosition(newGame.fen());
              setGameStatus("");
            }}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
}
