import React from "react";

interface InstructionsProps {
  isGameOver: boolean;
}

const Instructions: React.FC<InstructionsProps> = ({ isGameOver }) => (
  <div className="text-center text-gray-300 max-w-sm sm:max-w-md px-4">
    <h3 className="font-semibold text-white mb-2 flex items-center justify-center gap-2">
      <span className="text-base sm:text-lg">ℹ️</span>
      <span className="text-sm sm:text-base">How to Play</span>
    </h3>
    <p className="text-xs sm:text-sm leading-relaxed">
      You play as <strong className="text-gray-100">White</strong>. Make your
      move by clicking and dragging pieces or by clicking to select and then
      clicking the destination square. The AI will respond as{" "}
      <strong className="text-gray-100">Black</strong>.
    </p>
    {isGameOver && (
      <p className="text-xs text-gray-400 mt-2 italic">
        Game over! Click "New Game" to start again.
      </p>
    )}
  </div>
);

export default Instructions;
