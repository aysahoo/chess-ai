import React, { useState } from "react";
import OpenAI from "./OpenAI";

interface ModalProps {
  isOpen: boolean;
  initialModel: string;
  onConfirm: (model: string, userName: string) => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, initialModel, onConfirm }) => {
  const [userName, setUserName] = useState("");
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const models = [
    { value: "gpt-4o-mini", label: "GPT-4o-mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ];

  const handleModelSelect = (modelValue: string) => {
    setSelectedModel(modelValue);
    setDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161619] rounded-3xl p-4 sm:p-8 w-full max-w-sm sm:max-w-md flex flex-col gap-4 sm:gap-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center ">
            <label className="flex flex-col gap-1 w-full sm:w-auto">
              <input
                type="text"
                className="p-3 w-full sm:w-40 text-center focus:outline-none text-base"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />
            </label>
            <h1 className="text-white text-xl sm:text-2xl">VS</h1>
            <div className="text-white flex items-center justify-center px-3 py-2 sm:py-1 w-full sm:w-40 h-12 sm:h-13 gap-2 relative">
              <OpenAI className="w-5 h-5 sm:w-6 sm:h-6" />
              <div className="relative w-full">
                <button
                  type="button"
                  className="w-full flex items-center justify-between bg-[#23232a] border border-gray-500 rounded px-2 py-1 text-sm text-white focus:outline-none cursor-pointer"
                  onClick={() => setDropdownOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                >
                  {models.find((m) => m.value === selectedModel)?.label ||
                    "Select Model"}
                  <svg
                    className={`ml-2 w-4 h-4 transition-transform ${
                      dropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {dropdownOpen && (
                  <ul
                    className="absolute left-0 right-0 mt-1 bg-[#23232a] border border-gray-500 rounded shadow-lg z-10 max-h-40 overflow-y-auto"
                    role="listbox"
                  >
                    {models.map((model) => (
                      <li
                        key={model.value}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#32323a] ${
                          selectedModel === model.value
                            ? "bg-[#32323a] font-semibold"
                            : ""
                        }`}
                        onClick={() => handleModelSelect(model.value)}
                        role="option"
                        aria-selected={selectedModel === model.value}
                      >
                        {model.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          {/* How to Play Instructions */}
          <div className="p-3 sm:p-4">
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
            className="rounded-3xl w-[150px] mt-2 bg-black hover:bg-white hover:text-black text-white py-2 sm:py-3 font-semibold disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={!userName.trim()}
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
