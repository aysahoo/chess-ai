import React, { useState } from "react";

interface ModelDropdownProps {
  models: {
    value: string;
    label: string;
    logo?: React.ComponentType<{ className?: string }>;
  }[];
  selectedModel: string;
  onSelect: (model: string) => void;
}

const ModelDropdown: React.FC<ModelDropdownProps> = ({
  models,
  selectedModel,
  onSelect,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleModelSelect = (modelValue: string) => {
    onSelect(modelValue);
    setDropdownOpen(false);
  };

  const selected = models.find((m) => m.value === selectedModel);
  const SelectedLogo = selected?.logo;

  return (
    <div className="relative flex items-center gap-2 flex-1">
      <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center">
        {SelectedLogo && <SelectedLogo className="w-4 h-4 sm:w-6 sm:h-6" />}
      </div>
      <div className="relative flex-1">
        <button
          type="button"
          className="w-full flex items-center justify-between bg-transparent text-white font-bold text-sm sm:text-lg focus:outline-none cursor-pointer"
          onClick={() => setDropdownOpen((open) => !open)}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <span className={!selected ? "text-white/60" : ""}>
            {selected?.label || "Choose AI Model"}
          </span>
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
            className="absolute left-0 right-0 mt-1 bg-black border border-white/50 shadow-lg z-10 max-h-40 overflow-y-auto"
            role="listbox"
          >
            {models.map((model) => {
              const Logo = model.logo;
              return (
                <li
                  key={model.value}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-white/10 flex items-center gap-2 ${
                    selectedModel === model.value ? "bg-white/10 font-bold" : ""
                  }`}
                  onClick={() => handleModelSelect(model.value)}
                  role="option"
                  aria-selected={selectedModel === model.value}
                >
                  {Logo && <Logo className="w-4 h-4" />}
                  {model.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ModelDropdown;
