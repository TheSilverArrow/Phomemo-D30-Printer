import React, { useRef, useState, useEffect } from 'react';
import {
  LabelDimensions,
  PrintMode,
  TextLabelConfig,
  BarcodeLabelConfig,
  QrLabelConfig,
  QrTextLabelConfig,
  ImageLabelConfig,
  renderLabelDesign,
  createPrintCanvasFromDesign,
} from '../utils/canvasRenderer';

interface LabelPreviewProps {
  dimensions: LabelDimensions;
  mode: PrintMode;
  textConfig: TextLabelConfig;
  barcodeConfig: BarcodeLabelConfig;
  qrConfig: QrLabelConfig;
  qrTextConfig: QrTextLabelConfig;
  imageConfig: ImageLabelConfig;
  flipH: boolean;
  flipV: boolean;
  onFlipHChange: (val: boolean) => void;
  onFlipVChange: (val: boolean) => void;
  canvasRefCallback: (canvas: HTMLCanvasElement | null) => void;
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({
  dimensions,
  mode,
  textConfig,
  barcodeConfig,
  qrConfig,
  qrTextConfig,
  imageConfig,
  flipH,
  flipV,
  onFlipHChange,
  onFlipVChange,
  canvasRefCallback,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(2.0); // 200% default for comfortable viewing
  const [showHardwareView, setShowHardwareView] = useState<boolean>(false);
  const hardwareCanvasRef = useRef<HTMLCanvasElement>(null);

  // Re-render design preview whenever any configuration changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvasRefCallback(canvas);

    let isMounted = true;
    renderLabelDesign(
      canvas,
      dimensions,
      mode,
      textConfig,
      barcodeConfig,
      qrConfig,
      qrTextConfig,
      imageConfig
    ).then(() => {
      if (isMounted && hardwareCanvasRef.current) {
        // Update hardware vertical feed view
        const hw = createPrintCanvasFromDesign(canvas, { flipH, flipV });
        const hwCanvas = hardwareCanvasRef.current;
        hwCanvas.width = hw.width;
        hwCanvas.height = hw.height;
        const hwCtx = hwCanvas.getContext('2d');
        if (hwCtx) {
          hwCtx.drawImage(hw, 0, 0);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [
    dimensions,
    mode,
    textConfig,
    barcodeConfig,
    qrConfig,
    qrTextConfig,
    imageConfig,
    flipH,
    flipV,
    canvasRefCallback,
    showHardwareView,
  ]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `label_${dimensions.widthMm}x${dimensions.heightMm}mm.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Top bar of preview */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-200">
            {showHardwareView ? 'Hardware Feed Orientation' : 'Live Label Preview'}
          </span>
          <span className="text-[11px] text-neutral-500 ml-2 font-mono">
            {dimensions.widthMm}mm × {dimensions.heightMm}mm
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowHardwareView(!showHardwareView)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showHardwareView
                ? 'bg-neutral-700 text-white font-medium'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800'
            }`}
            title="Toggle between horizontal view and vertical printer feed view"
          >
            {showHardwareView ? 'View Horizontal' : 'View Feed'}
          </button>

          <button
            type="button"
            onClick={() => onFlipHChange(!flipH)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              flipH
                ? 'bg-neutral-700 text-white font-medium'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800'
            }`}
            title="Mirror horizontally"
          >
            Flip H
          </button>

          <button
            type="button"
            onClick={() => onFlipVChange(!flipV)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              flipV
                ? 'bg-neutral-700 text-white font-medium'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800'
            }`}
            title="Mirror vertically"
          >
            Flip V
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-2 py-1 text-xs rounded text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800 transition-colors"
            title="Download label image"
          >
            Export PNG
          </button>
        </div>
      </div>

      {/* Canvas Container Area */}
      <div className="relative min-h-[180px] sm:min-h-[220px] bg-neutral-950 border border-neutral-800/80 rounded-lg p-6 flex flex-col items-center justify-center overflow-auto">
        {!showHardwareView ? (
          <div className="flex flex-col items-center">
            {/* Horizontal simulated sticker */}
            <div
              className="bg-white p-1 rounded-sm shadow-xl border border-neutral-300 transition-transform duration-200"
              style={{
                borderRadius: '4px',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: `${dimensions.widthMm * 8 * (zoom / 2)}px`,
                  height: `${dimensions.heightMm * 8 * (zoom / 2)}px`,
                  imageRendering: 'pixelated',
                  transform: `${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}`,
                }}
                className="block bg-white"
              />
            </div>

            {/* Scale label beneath sticker */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500 font-mono w-full max-w-xs px-2">
              <span>0mm (Leading edge)</span>
              <span>{dimensions.widthMm}mm</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Vertical hardware orientation */}
            <div className="bg-white p-1 rounded-sm shadow-xl border border-neutral-300">
              <canvas
                ref={hardwareCanvasRef}
                style={{
                  width: `${dimensions.heightMm * 8 * (zoom / 2)}px`,
                  height: `${dimensions.widthMm * 8 * (zoom / 2)}px`,
                  imageRendering: 'pixelated',
                }}
                className="block bg-white"
              />
            </div>
            <span className="text-[11px] text-neutral-500 mt-2 font-mono">
              Printhead feed: {dimensions.heightMm}mm head × {dimensions.widthMm}mm roll
            </span>
          </div>
        )}
      </div>

      {/* Footer controls of preview */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span>Zoom:</span>
          {[1.0, 1.5, 2.0, 2.5].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              className={`px-1.5 py-0.5 rounded text-xs font-mono transition-colors ${
                zoom === z
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>

        <span className="text-[11px] text-neutral-500">
          203 DPI · 1-bit Monochrome
        </span>
      </div>
    </div>
  );
};
