import React from 'react';
import { TextLabelConfig } from '../utils/canvasRenderer';

interface ModeTextProps {
  config: TextLabelConfig;
  onChange: (newConfig: TextLabelConfig) => void;
}

export const ModeText: React.FC<ModeTextProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-neutral-300">
            Label Text
          </label>
          <span className="text-[11px] text-neutral-500">Supports multi-line</span>
        </div>
        <textarea
          rows={3}
          value={config.text}
          onChange={(e) => onChange({ ...config, text: e.target.value })}
          placeholder="Type label text here..."
          className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 resize-none font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Font Size (px)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="14"
              max="96"
              step="2"
              value={config.fontSize}
              onChange={(e) => onChange({ ...config, fontSize: Number(e.target.value) })}
              className="w-full accent-neutral-300"
            />
            <span className="w-10 text-xs font-mono text-neutral-400 text-right">
              {config.fontSize}px
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Font Weight
          </label>
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onChange({ ...config, fontWeight: 'normal' })}
              className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors ${
                config.fontWeight === 'normal'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Regular
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, fontWeight: 'bold' })}
              className={`flex-1 py-1 text-xs rounded-md font-bold transition-colors ${
                config.fontWeight === 'bold'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Bold
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Font Style
          </label>
          <select
            value={config.fontFamily}
            onChange={(e) => onChange({ ...config, fontFamily: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-neutral-600"
          >
            <option value="sans-serif">Modern Sans-Serif</option>
            <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
            <option value="'JetBrains Mono', monospace">Monospace / Code</option>
            <option value="Impact, sans-serif">Impact / Condensed</option>
            <option value="Georgia, serif">Classic Serif</option>
            <option value="'Courier New', monospace">Typewriter</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Text Alignment
          </label>
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => onChange({ ...config, textAlign: align })}
                className={`flex-1 py-1 text-xs rounded-md capitalize font-medium transition-colors ${
                  config.textAlign === align
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
        <label className="text-xs text-neutral-300 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.invertColors}
            onChange={(e) => onChange({ ...config, invertColors: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-neutral-100 focus:ring-0"
          />
          Invert Colors (White text on black tape)
        </label>
      </div>
    </div>
  );
};
