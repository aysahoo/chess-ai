import React, { useState } from "react";
import OpenAI from "./OpenAI";

interface ModalProps {
  isOpen: boolean;
  initialModel: string;
  onConfirm: (model: string, userName: string) => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, initialModel, onConfirm }) => {
  const [userName, setUserName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-black border border-gray-300 p-4 sm:p-8 w-full max-w-sm sm:max-w-md flex flex-col gap-4 sm:gap-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <label className="flex flex-col gap-1 w-full sm:w-auto">
              <input
                type="text"
                className="p-3 border w-full sm:w-40 text-center border-gray-300 focus:outline-none text-base"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />
            </label>
            <h1 className="text-white text-xl sm:text-2xl">VS</h1>
            <div className="text-white border border-gray-300 flex items-center justify-center px-3 py-2 sm:py-1 w-full sm:w-40 h-12 sm:h-13 gap-2">
              <OpenAI className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm">GPT-4o-mini</span>
            </div>
          </div>
          {/* How to Play Instructions */}
          <div className="bg-black border border-gray-300 p-3 sm:p-4">
            <h3 className="font-semibold text-amber-200 mb-2 text-sm sm:text-base">
              How to Play!
            </h3>
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
              You play as{" "}
              <strong>
                <span className="text-red-300">White</span>
              </strong>
              . Make your move by clicking and dragging pieces or by clicking to
              select and then clicking the destination square. The AI will
              respond as{" "}
              <strong>
                <span className="text-red-300">Black</span>
              </strong>
              .
            </p>
          </div>

          <button
            className="mt-2 bg-black border-white border hover:bg-white hover:text-black text-white py-2 sm:py-3 font-semibold disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={!userName.trim()}
            onClick={() => onConfirm(initialModel, userName.trim())}
          >
            Start Game
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default Modal;
