import React from 'react';
import { LabelDimensions } from '../utils/canvasRenderer';

interface SizePresetsProps {
  dimensions: LabelDimensions;
  onChange: (dims: LabelDimensions) => void;
}

const PRESETS: { label: string; width: number; height: number }[] = [
  { label: '40 × 12 mm (Standard)', width: 40, height: 12 },
  { label: '30 × 12 mm', width: 30, height: 12 },
  { label: '50 × 14 mm', width: 50, height: 14 },
  { label: '40 × 14 mm', width: 40, height: 14 },
  { label: '30 × 15 mm', width: 30, height: 15 },
];

export const SizePresets: React.FC<SizePresetsProps> = ({ dimensions, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-300">
          Label Size (mm)
        </label>
        <span className="text-[11px] text-neutral-500 font-mono">
          {dimensions.widthMm * 8} × {dimensions.heightMm * 8} dots (203 DPI)
        </span>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const isSelected =
            dimensions.widthMm === preset.width && dimensions.heightMm === preset.height;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ widthMm: preset.width, heightMm: preset.height })}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                isSelected
                  ? 'bg-neutral-200 text-neutral-900 font-semibold shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom mm inputs */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] text-neutral-400 mb-1">
            Length (Width mm)
          </label>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="150"
              value={dimensions.widthMm}
              onChange={(e) =>
                onChange({ ...dimensions, widthMm: Math.max(10, Number(e.target.value) || 10) })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-neutral-600 font-mono pr-8"
            />
            <span className="absolute right-2.5 top-1.5 text-[11px] text-neutral-500 pointer-events-none">
              mm
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-neutral-400 mb-1">
            Tape Width (Height mm)
          </label>
          <div className="relative">
            <input
              type="number"
              min="6"
              max="16"
              value={dimensions.heightMm}
              onChange={(e) =>
                onChange({ ...dimensions, heightMm: Math.max(6, Number(e.target.value) || 6) })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-neutral-600 font-mono pr-8"
            />
            <span className="absolute right-2.5 top-1.5 text-[11px] text-neutral-500 pointer-events-none">
              mm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
