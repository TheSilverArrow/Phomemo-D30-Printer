import React from 'react';
import { PrintMode } from '../utils/canvasRenderer';

interface HeaderProps {
  currentMode: PrintMode;
  onSelectMode: (mode: PrintMode) => void;
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  isConnected,
  isConnecting,
  deviceName,
  onConnect,
  onDisconnect,
}) => {
  const modes: { id: PrintMode; label: string }[] = [
    { id: 'text', label: 'Text' },
    { id: 'barcode', label: 'Barcode' },
    { id: 'qr', label: 'QR Code' },
    { id: 'qr-text', label: 'QR + Text' },
    { id: 'image', label: 'Image' },
  ];

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark - strictly NO icon beside title */}
        <div className="flex items-center">
          <span className="text-lg font-bold tracking-tight text-white select-none">
            Phomemo D30 Studio
          </span>
        </div>

        {/* Zone 2: Navigation mode tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
          {modes.map((mode) => {
            const active = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Connection status & actions */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="max-w-[120px] sm:max-w-[180px] truncate">
                  {deviceName || 'D30 Connected'}
                </span>
              </div>
              <button
                onClick={onDisconnect}
                className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
                title="Disconnect printer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-white hover:bg-neutral-200 rounded-md transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isConnecting ? 'Connecting...' : 'Connect Printer'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile mode tabs */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-neutral-900 gap-1 bg-neutral-950 scrollbar-none">
        {modes.map((mode) => {
          const active = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                active
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
