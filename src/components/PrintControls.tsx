import React from 'react';
import { PrintProgressInfo } from '../utils/phomemoD30';

interface PrintControlsProps {
  copies: number;
  onCopiesChange: (copies: number) => void;
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  progress: PrintProgressInfo | null;
  onPrint: () => void;
  onCancelPrint: () => void;
  onConnect: () => void;
  deviceName: string | null;
}

export const PrintControls: React.FC<PrintControlsProps> = ({
  copies,
  onCopiesChange,
  isConnected,
  isConnecting,
  isPrinting,
  progress,
  onPrint,
  onCancelPrint,
  onConnect,
  deviceName,
}) => {
  const quickCopies = [1, 2, 3, 5, 10];

  return (
    <div className="space-y-4 bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl">
      {/* Copies Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-neutral-300">
            Number of Copies
          </label>
          <div className="flex items-center gap-1">
            {quickCopies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onCopiesChange(q)}
                disabled={isPrinting}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  copies === q
                    ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={copies <= 1 || isPrinting}
            onClick={() => onCopiesChange(Math.max(1, copies - 1))}
            className="w-9 h-9 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-neutral-200 font-bold text-sm transition-colors"
          >
            -
          </button>

          <div className="flex-1 relative">
            <input
              type="number"
              min="1"
              max="99"
              value={copies}
              disabled={isPrinting}
              onChange={(e) => onCopiesChange(Math.min(99, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full h-9 text-center bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-semibold text-white focus:outline-none focus:border-neutral-600 font-mono"
            />
            <span className="absolute right-3 top-2 text-xs text-neutral-500 pointer-events-none">
              {copies === 1 ? 'copy' : 'copies'}
            </span>
          </div>

          <button
            type="button"
            disabled={copies >= 99 || isPrinting}
            onClick={() => onCopiesChange(Math.min(99, copies + 1))}
            className="w-9 h-9 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-neutral-200 font-bold text-sm transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Printing Progress Overlay / Status */}
      {isPrinting && progress && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium">
              {progress.message || `Printing copy ${progress.currentCopy} of ${progress.totalCopies}`}
            </span>
            <span className="font-mono text-neutral-400">
              {progress.percent}%
            </span>
          </div>

          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-150 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-neutral-500">
              Copy {progress.currentCopy} / {progress.totalCopies}
            </span>
            <button
              type="button"
              onClick={onCancelPrint}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              Cancel Print
            </button>
          </div>
        </div>
      )}

      {/* Print Action Button */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onPrint}
          disabled={isPrinting || isConnecting}
          className="w-full py-3 px-4 bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-sm rounded-lg transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPrinting ? (
            <>
              <span className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              <span>Printing {copies > 1 ? `${progress?.currentCopy || 1} of ${copies}...` : '...'}</span>
            </>
          ) : isConnecting ? (
            <>
              <span className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              <span>Connecting to D30...</span>
            </>
          ) : !isConnected ? (
            <span>Connect &amp; Print ({copies} {copies === 1 ? 'copy' : 'copies'})</span>
          ) : (
            <span>Print Label {copies > 1 ? `(${copies} copies)` : ''}</span>
          )}
        </button>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400' : 'bg-neutral-600'
              }`}
            />
            <span>
              {isConnected
                ? `${deviceName || 'Phomemo D30'} paired & ready`
                : 'Not connected'}
            </span>
          </div>

          {!isConnected && (
            <button
              type="button"
              onClick={onConnect}
              className="text-neutral-300 hover:text-white underline underline-offset-2"
            >
              Pair once now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
