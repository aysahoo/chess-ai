import React, { forwardRef, useImperativeHandle } from "react";
import { Chess } from "chess.js";

interface GameStatusMessagesProps {
  game: Chess;
  gameStatus: string;
  setGameStatus: (status: string) => void;
}

const GameStatusMessages = forwardRef(function GameStatusMessages(
  { game, gameStatus, setGameStatus }: GameStatusMessagesProps,
  ref
) {
  const updateGameStatus = () => {
    if (game.isCheckmate()) {
      setGameStatus(
        game.turn() === "w"
          ? "Black wins by checkmate! Game over."
          : "White wins by checkmate! Game over."
      );
    } else if (game.isDraw()) {
      if (game.isStalemate()) {
        setGameStatus("Game drawn by stalemate! No legal moves available.");
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
  };

  useImperativeHandle(ref, () => ({
    updateGameStatus,
  }));

  // Render the game status message if present
  if (!gameStatus) return null;
  return (
    <div className="fixed top-10 sm:top-16 left-0 right-0 mx-4 sm:mx-0">
      <div className="bg-black/90 text-white rounded p-2 sm:p-4 text-center text-sm sm:text-base font-normal max-w-md mx-auto">
        {gameStatus}
      </div>
    </div>
  );
});

export default GameStatusMessages;

// Export the update function for direct use
export const getGameStatusMessage = (game: Chess): string => {
  if (game.isCheckmate()) {
    return game.turn() === "w"
      ? "Black wins by checkmate! Game over."
      : "White wins by checkmate! Game over.";
  } else if (game.isDraw()) {
    if (game.isStalemate()) {
      return "Game drawn by stalemate! No legal moves available.";
    } else if (game.isInsufficientMaterial()) {
      return "Game drawn by insufficient material!";
    } else if (game.isThreefoldRepetition()) {
      return "Game drawn by threefold repetition!";
    } else {
      return "Game drawn!";
    }
  } else {
    // Only show critical game states, not turn-based or check messages
    return "";
  }
};
