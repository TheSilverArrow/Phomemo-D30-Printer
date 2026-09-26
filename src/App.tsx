import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { LabelPreview } from './components/LabelPreview';
import { PrintControls } from './components/PrintControls';
import { SizePresets } from './components/SizePresets';
import { ModeText } from './components/ModeText';
import { ModeBarcode } from './components/ModeBarcode';
import { ModeQR } from './components/ModeQR';
import { ModeQRText } from './components/ModeQRText';
import { ModeImage } from './components/ModeImage';
import { Toast, ToastMessage } from './components/Toast';
import {
  LabelDimensions,
  PrintMode,
  TextLabelConfig,
  BarcodeLabelConfig,
  QrLabelConfig,
  QrTextLabelConfig,
  ImageLabelConfig,
  createPrintCanvasFromDesign,
} from './utils/canvasRenderer';
import {
  PhomemoPrinterService,
  printerInstance,
  PrintProgressInfo,
} from './utils/phomemoD30';

export default function App() {
  // Bluetooth Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  // Print Configuration & Copies
  const [copies, setCopies] = useState<number>(1);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printProgress, setPrintProgress] = useState<PrintProgressInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Label Dimensions (Phomemo D30 default is 40mm x 12mm)
  const [dimensions, setDimensions] = useState<LabelDimensions>({
    widthMm: 40,
    heightMm: 12,
  });

  // Active Designer Mode
  const [currentMode, setCurrentMode] = useState<PrintMode>('text');

  // Preview & Orientation options
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Mode Specific Configurations
  const [textConfig, setTextConfig] = useState<TextLabelConfig>({
    text: 'ORGANIC COFFEE',
    fontSize: 28,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeightMultiplier: 1.15,
    invertColors: false,
  });

  const [barcodeConfig, setBarcodeConfig] = useState<BarcodeLabelConfig>({
    data: 'AST-94021',
    format: 'CODE128',
    displayValue: true,
    barHeightRatio: 0.65,
    barWidth: 2,
  });

  const [qrConfig, setQrConfig] = useState<QrLabelConfig>({
    data: 'https://github.com',
    errorCorrectionLevel: 'M',
    margin: 1,
  });

  const [qrTextConfig, setQrTextConfig] = useState<QrTextLabelConfig>({
    qrData: 'https://example.com/asset/842',
    text: 'BIN-42A\nSHELF 3',
    fontSize: 18,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'left',
    qrSizeRatio: 0.9,
    gap: 8,
  });

  const [imageConfig, setImageConfig] = useState<ImageLabelConfig>({
    imageDataUrl: null,
    threshold: 128,
    invert: false,
    scaleMode: 'fit',
  });

  // Design Canvas Reference
  const designCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'error' | 'success' | 'info', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Setup connection state listener
  useEffect(() => {
    printerInstance.onConnectionStateChange = (connected, name) => {
      setIsConnected(connected);
      if (name) setDeviceName(name);
      if (!connected) {
        addToast(
          'info',
          'Printer disconnected or entered standby mode. It will auto-reconnect when you print.',
          'Printer Status'
        );
      }
    };
  }, []);

  // Connect Once Handler
  const handleConnect = async (forcePicker = false) => {
    if (!PhomemoPrinterService.isSupported()) {
      addToast(
        'error',
        'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera over HTTPS.',
        'Browser Incompatible'
      );
      return;
    }

    try {
      setIsConnecting(true);
      const name = await printerInstance.connect(forcePicker);
      setIsConnected(true);
      setDeviceName(name);
      addToast('success', `Connected to ${name}. Ready to print!`, 'Pairing Successful');
    } catch (err: any) {
      if (err?.name === 'NotFoundError' || err?.message?.includes('cancelled')) {
        // User closed the Bluetooth picker without selecting
        return;
      }
      console.error('Connection failed:', err);
      addToast('error', err?.message || 'Failed to connect to printer.', 'Connection Error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Handler
  const handleDisconnect = () => {
    printerInstance.disconnect();
    setIsConnected(false);
    addToast('info', 'Disconnected from printer.', 'Disconnected');
  };

  // Print Handler
  const handlePrint = async () => {
    if (!designCanvasRef.current) {
      addToast('error', 'Label preview canvas is not ready.', 'Print Error');
      return;
    }

    if (isPrinting) return;

    // Check browser support
    if (!PhomemoPrinterService.isSupported()) {
      addToast(
        'error',
        'Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge.',
        'Browser Incompatible'
      );
      return;
    }

    try {
      setIsPrinting(true);
      abortControllerRef.current = new AbortController();

      // Convert horizontal design canvas to vertical physical printhead canvas
      const printCanvas = createPrintCanvasFromDesign(designCanvasRef.current, {
        flipH,
        flipV,
      });

      // Execute print with multi-copy and auto-reconnect
      await printerInstance.print(
        printCanvas,
        copies,
        (progress) => {
          setPrintProgress(progress);
        },
        abortControllerRef.current.signal
      );

      addToast(
        'success',
        `Successfully printed ${copies} ${copies === 1 ? 'label' : 'labels'}!`,
        'Print Complete'
      );
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('cancelled')) {
        addToast('info', 'Print cancelled.', 'Cancelled');
        return;
      }
      console.error('Print failed:', err);
      addToast(
        'error',
        err?.message || 'An error occurred while transmitting to the printer.',
        'Print Failed'
      );
    } finally {
      setIsPrinting(false);
      setPrintProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleCancelPrint = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    designCanvasRef.current = canvas;
  }, []);

  const isBluetoothSupported = PhomemoPrinterService.isSupported();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Bar Contract: strictly Zone 1 wordmark without icon, Zone 2 nav tabs, Zone 3 connection */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        isConnected={isConnected}
        isConnecting={isConnecting}
        deviceName={deviceName}
        onConnect={() => handleConnect(true)}
        onDisconnect={handleDisconnect}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Browser compatibility banner if Web Bluetooth is not available */}
        {!isBluetoothSupported && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start justify-between gap-3">
            <div>
              <span className="font-semibold block text-sm mb-0.5">
                Web Bluetooth Not Detected
              </span>
              Web Bluetooth requires a Chromium-based browser (Google Chrome, Microsoft Edge, Opera, or Bluefy on iOS) over HTTPS or localhost. You can still design, customize, and export PNG labels!
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Design Controls & Print Settings */}
          <div className="lg:col-span-6 space-y-6">
            {/* Mode Specific Configuration Card */}
            <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
                <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                  {currentMode === 'text' && 'Text Configuration'}
                  {currentMode === 'barcode' && 'Barcode Configuration'}
                  {currentMode === 'qr' && 'QR Code Configuration'}
                  {currentMode === 'qr-text' && 'QR + Text Configuration'}
                  {currentMode === 'image' && 'Image & Graphic Configuration'}
                </span>
                <span className="text-[11px] text-neutral-500">
                  Phomemo D30
                </span>
              </div>

              {currentMode === 'text' && (
                <ModeText config={textConfig} onChange={setTextConfig} />
              )}
              {currentMode === 'barcode' && (
                <ModeBarcode config={barcodeConfig} onChange={setBarcodeConfig} />
              )}
              {currentMode === 'qr' && (
                <ModeQR config={qrConfig} onChange={setQrConfig} />
              )}
              {currentMode === 'qr-text' && (
                <ModeQRText config={qrTextConfig} onChange={setQrTextConfig} />
              )}
              {currentMode === 'image' && (
                <ModeImage config={imageConfig} onChange={setImageConfig} />
              )}
            </section>

            {/* Label Dimensions Card */}
            <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
              <SizePresets dimensions={dimensions} onChange={setDimensions} />
            </section>

            {/* Print Controls & Multi-Copy Settings */}
            <section>
              <PrintControls
                copies={copies}
                onCopiesChange={setCopies}
                isConnected={isConnected}
                isConnecting={isConnecting}
                isPrinting={isPrinting}
                progress={printProgress}
                onPrint={handlePrint}
                onCancelPrint={handleCancelPrint}
                onConnect={() => handleConnect(true)}
                deviceName={deviceName}
              />
            </section>
          </div>

          {/* Right Column: Live WYSIWYG Preview & Hardware Insights */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Visual Canvas Preview */}
            <LabelPreview
              dimensions={dimensions}
              mode={currentMode}
              textConfig={textConfig}
              barcodeConfig={barcodeConfig}
              qrConfig={qrConfig}
              qrTextConfig={qrTextConfig}
              imageConfig={imageConfig}
              flipH={flipH}
              flipV={flipV}
              onFlipHChange={setFlipH}
              onFlipVChange={setFlipV}
              canvasRefCallback={handleCanvasRef}
            />

            {/* Hardware & Bluetooth Guide */}
            <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-4 text-xs text-neutral-400 space-y-3">
              <div className="flex items-center justify-between text-neutral-300 font-semibold">
                <span>Hardware Connection Details</span>
                <span className="text-[11px] font-mono text-neutral-500">
                  UUID: 0000ff00 · 128B chunks
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] leading-relaxed text-neutral-400">
                <p>
                  <strong className="text-neutral-300">Single Pairing:</strong> You only need to pair once. The browser holds the connection in memory so consecutive prints execute without re-prompting.
                </p>
                <p>
                  <strong className="text-neutral-300">Standby Auto-Recovery:</strong> Phomemo D30 automatically powers its radio down after idle timeout. When printing, the app automatically executes <code className="text-neutral-300 bg-neutral-800 px-1 py-0.5 rounded">device.gatt.connect()</code> to wake the GATT server seamlessly.
                </p>
                <p>
                  <strong className="text-neutral-300">Multi-Copy Pacing:</strong> When printing multiple copies, each label is transmitted in paced 128-byte packets with feed pauses to guarantee clean label cuts and prevent buffer overflow.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
