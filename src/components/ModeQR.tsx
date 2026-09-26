import React from 'react';
import { QrLabelConfig } from '../utils/canvasRenderer';

interface ModeQRProps {
  config: QrLabelConfig;
  onChange: (newConfig: QrLabelConfig) => void;
}

export const ModeQR: React.FC<ModeQRProps> = ({ config, onChange }) => {
  const presets = [
    { label: 'URL', value: 'https://github.com' },
    { label: 'Wi-Fi', value: 'WIFI:S:Office-Guest;T:WPA;P:secret123;;' },
    { label: 'Inventory', value: 'BOX-BIN-04-SHELF-B' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-neutral-300">
            QR Code Payload
          </label>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span>Examples:</span>
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
          placeholder="https://... or raw data"
          className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Error Correction
          </label>
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            {(['L', 'M', 'Q', 'H'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ ...config, errorCorrectionLevel: level })}
                className={`flex-1 py-1 text-xs rounded-md font-mono font-medium transition-colors ${
                  config.errorCorrectionLevel === level
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Quiet Zone Margin
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={config.margin}
              onChange={(e) => onChange({ ...config, margin: Number(e.target.value) })}
              className="w-full accent-neutral-300"
            />
            <span className="w-6 text-xs font-mono text-neutral-400 text-right">
              {config.margin}px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
