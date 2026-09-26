import React from 'react';
import { BarcodeLabelConfig } from '../utils/canvasRenderer';

interface ModeBarcodeProps {
  config: BarcodeLabelConfig;
  onChange: (newConfig: BarcodeLabelConfig) => void;
}

export const ModeBarcode: React.FC<ModeBarcodeProps> = ({ config, onChange }) => {
  const presets = [
    { label: 'Asset Tag', value: 'AST-84920' },
    { label: 'Serial No', value: 'SN2026X9' },
    { label: 'Numeric', value: '12345678' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-neutral-300">
            Barcode Value
          </label>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span>Quick:</span>
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange({ ...config, data: p.value })}
                className="text-neutral-400 hover:text-white underline underline-offset-2"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          value={config.data}
          onChange={(e) => onChange({ ...config, data: e.target.value })}
          placeholder="Enter barcode text..."
          className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Barcode Standard
          </label>
          <select
            value={config.format}
            onChange={(e) => onChange({ ...config, format: e.target.value as any })}
            className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-neutral-600"
          >
            <option value="CODE128">CODE 128 (Universal)</option>
            <option value="CODE39">CODE 39 (Alphanumeric)</option>
            <option value="EAN13">EAN-13 (13 digits)</option>
            <option value="EAN8">EAN-8 (8 digits)</option>
            <option value="UPC">UPC-A (12 digits)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Barcode Height
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.3"
              max="0.85"
              step="0.05"
              value={config.barHeightRatio}
              onChange={(e) => onChange({ ...config, barHeightRatio: Number(e.target.value) })}
              className="w-full accent-neutral-300"
            />
            <span className="w-8 text-xs font-mono text-neutral-400 text-right">
              {Math.round(config.barHeightRatio * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
        <label className="text-xs text-neutral-300 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.displayValue}
            onChange={(e) => onChange({ ...config, displayValue: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-neutral-100 focus:ring-0"
          />
          Show Human-Readable Text Underneath
        </label>
      </div>
    </div>
  );
};
