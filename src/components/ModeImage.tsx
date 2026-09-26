import React, { useRef } from 'react';
import { ImageLabelConfig } from '../utils/canvasRenderer';

interface ModeImageProps {
  config: ImageLabelConfig;
  onChange: (newConfig: ImageLabelConfig) => void;
}

export const ModeImage: React.FC<ModeImageProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange({
        ...config,
        imageDataUrl: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Built-in monochrome SVG sample stamps to quickly test printing graphics
  const loadPresetGraphic = (type: 'warning' | 'heart' | 'box' | 'star') => {
    let svg = '';
    if (type === 'warning') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,10 90,85 10,85" fill="black"/><circle cx="50" cy="72" r="5" fill="white"/><rect x="46" y="38" width="8" height="24" rx="3" fill="white"/></svg>`;
    } else if (type === 'heart') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 85 C20 60, 5 45, 5 25 C5 12, 16 5, 29 5 C38 5, 46 11, 50 18 C54 11, 62 5, 71 5 C84 5, 95 12, 95 25 C95 45, 80 60, 50 85 Z" fill="black"/></svg>`;
    } else if (type === 'box') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,15 85,35 50,55 15,35" fill="black"/><polygon points="15,40 50,60 50,85 15,65" fill="black"/><polygon points="55,60 85,40 85,65 55,85" fill="black"/></svg>`;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,5 64,36 98,39 72,62 80,95 50,77 20,95 28,62 2,39 36,36" fill="black"/></svg>`;
    }

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    onChange({
      ...config,
      imageDataUrl: dataUrl,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          Upload Image or Icon
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 hover:bg-neutral-900 rounded-lg p-4 text-center cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-xs text-neutral-300 font-medium">
            {config.imageDataUrl ? 'Change image file' : 'Click to browse PNG, JPG, or SVG'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Thermal printers print in pure black & white
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">Sample Symbols:</span>
        <div className="flex gap-2">
          {(['warning', 'heart', 'box', 'star'] as const).map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => loadPresetGraphic(sym)}
              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 capitalize transition-colors text-xs"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Binarize Threshold
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="20"
              max="240"
              step="5"
              value={config.threshold}
              onChange={(e) => onChange({ ...config, threshold: Number(e.target.value) })}
              className="w-full accent-neutral-300"
            />
            <span className="w-8 text-xs font-mono text-neutral-400 text-right">
              {config.threshold}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Scale Mode
          </label>
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            {(['fit', 'fill'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ ...config, scaleMode: mode })}
                className={`flex-1 py-1 text-xs rounded-md capitalize font-medium transition-colors ${
                  config.scaleMode === mode
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
        <label className="text-xs text-neutral-300 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.invert}
            onChange={(e) => onChange({ ...config, invert: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-neutral-100 focus:ring-0"
          />
          Invert Black / White
        </label>
        {config.imageDataUrl && (
          <button
            type="button"
            onClick={() => onChange({ ...config, imageDataUrl: null })}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Remove Image
          </button>
        )}
      </div>
    </div>
  );
};
