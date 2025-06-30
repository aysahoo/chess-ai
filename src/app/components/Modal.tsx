import React, { useState } from "react";
import OpenAI from "./OpenAI";
import ModelDropdown from "./ModelDropdown";
import { UserRound } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  initialModel: string;
  onConfirm: (model: string, userName: string) => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, initialModel, onConfirm }) => {
  const [userName, setUserName] = useState("");
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const models = [
    { value: "openai:gpt-4o-mini", label: "GPT-4o-mini", logo: OpenAI },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-black border border-white/50 w-full max-w-sm sm:max-w-md flex flex-col gap-4 relative">
        <div className="p-4 sm:p-6">
          <h2 className="text-white text-xl sm:text-2xl font-bold text-center mb-6">
            New Game
          </h2>

          {/* Player Setup */}
          <div className="flex flex-col gap-4">
            {/* White Player (User) */}
            <div className="flex items-center justify-between bg-black text-white px-3 py-3 gap-3 border border-white/20">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center">
                  <UserRound className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <input
                  type="text"
                  className="bg-transparent text-white font-bold text-sm sm:text-lg focus:outline-none placeholder-white/50"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                />
              </div>
              <div className="text-xs text-white/70">White</div>
            </div>

            {/* VS Divider */}
            <div className="flex items-center justify-center py-2">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="px-4 text-white/70 text-sm">VS</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            {/* Black Player (AI) */}
            <div className="flex items-center justify-between bg-black text-white px-3 py-3 gap-3 border border-white/20">
              <ModelDropdown
                models={models}
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
              />
              <div className="text-xs text-white/70">Black</div>
            </div>
          </div>

          {/* How to Play Instructions */}
          <div className="mt-6 p-3 border border-white/20">
            <h3 className="font-bold text-white mb-2 text-sm">How to Play</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              You play as <strong className="text-white">White</strong>. Make
              your move by clicking and dragging pieces or by clicking to select
              and then clicking the destination square. The AI will respond as{" "}
              <strong className="text-white">Black</strong>.
            </p>
            <p className="text-xs text-white/50 mt-2 italic">
              Enter your name and choose an AI model to start playing.
            </p>
          </div>

          {/* Start Game Button */}
          <button
            className="w-full mt-6 bg-transparent border border-white/30 hover:border-white hover:bg-white/10 text-white py-2 sm:py-3 px-4 transition-all duration-200 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!userName.trim() || !selectedModel.trim()}
            onClick={() => onConfirm(selectedModel, userName.trim())}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
