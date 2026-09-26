import React from 'react';
import { QrTextLabelConfig } from '../utils/canvasRenderer';

interface ModeQRTextProps {
  config: QrTextLabelConfig;
  onChange: (newConfig: QrTextLabelConfig) => void;
}

export const ModeQRText: React.FC<ModeQRTextProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          QR Code Link / Data
        </label>
        <input
          type="text"
          value={config.qrData}
          onChange={(e) => onChange({ ...config, qrData: e.target.value })}
          placeholder="https://example.com"
          className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-neutral-300">
            Adjacent Text
          </label>
          <span className="text-[11px] text-neutral-500">Prints next to QR code</span>
        </div>
        <textarea
          rows={2}
          value={config.text}
          onChange={(e) => onChange({ ...config, text: e.target.value })}
          placeholder="Product Name or ID"
          className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 resize-none font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Text Font Size
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="48"
              step="1"
              value={config.fontSize}
              onChange={(e) => onChange({ ...config, fontSize: Number(e.target.value) })}
              className="w-full accent-neutral-300"
            />
            <span className="w-8 text-xs font-mono text-neutral-400 text-right">
              {config.fontSize}px
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            QR Size Proportion
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.6"
              max="1.0"
              step="0.05"
              value={config.qrSizeRatio}
              onChange={(e) => onChange({ ...config, qrSizeRatio: Number(e.target.value) })}
              className="w-full accent-neutral-300"
            />
            <span className="w-8 text-xs font-mono text-neutral-400 text-right">
              {Math.round(config.qrSizeRatio * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
