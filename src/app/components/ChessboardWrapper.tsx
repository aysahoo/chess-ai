import React from "react";
import { Chessboard } from "react-chessboard";

interface ChessboardWrapperProps {
  position: string;
  onPieceDrop: (sourceSquare: string, targetSquare: string) => boolean;
  onSquareClick: (square: string) => void;
  customSquareStyles: { [square: string]: React.CSSProperties };
  isAIThinking: boolean;
}

const ChessboardWrapper: React.FC<ChessboardWrapperProps> = ({
  position,
  onPieceDrop,
  onSquareClick,
  customSquareStyles,
  isAIThinking,
}) => {
  return (
    <div
      className="w-full max-w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[400px] aspect-square"
      style={{ transform: "translate(0,0)" }}
    >
      <Chessboard
        position={position}
        onPieceDrop={onPieceDrop}
        onSquareClick={onSquareClick}
        customSquareStyles={customSquareStyles}
        boardOrientation="white"
        customDarkSquareStyle={{ backgroundColor: "#779556" }}
        customLightSquareStyle={{ backgroundColor: "#eeeed2" }}
        areArrowsAllowed={false}
        arePiecesDraggable={false}
      />
    </div>
  );
};

export default ChessboardWrapper;
