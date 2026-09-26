/**
 * Phomemo D30 Bluetooth communication utilities
 * Optimized for persistent connection, automatic GATT re-connection, and multi-copy printing.
 */

export const PHOMEMO_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
export const PHOMEMO_WRITE_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';

const PACKET_SIZE_BYTES = 128;
const END_DATA = new Uint8Array([0x1b, 0x64, 0x00]);

export interface PrintProgressInfo {
  currentCopy: number;
  totalCopies: number;
  bytesSent: number;
  totalBytes: number;
  percent: number;
  message: string;
}

export type ProgressCallback = (info: PrintProgressInfo) => void;

export class PhomemoPrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnecting: boolean = false;
  private onDisconnectListener: (() => void) | null = null;

  public onConnectionStateChange?: (connected: boolean, deviceName?: string) => void;

  /**
   * Check if Web Bluetooth API is supported by the current browser
   */
  public static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator && !!navigator.bluetooth;
  }

  /**
   * Returns current paired device name or null
   */
  public getDeviceName(): string | null {
    return this.device?.name || null;
  }

  /**
   * Returns whether the GATT server is currently actively connected
   */
  public isConnected(): boolean {
    return !!(this.device?.gatt?.connected && this.characteristic);
  }

  /**
   * Get the existing device if paired
   */
  public getPairedDevice(): BluetoothDevice | null {
    return this.device;
  }

  /**
   * Connect to printer.
   * If already paired to a device, it reconnects using device.gatt.connect() WITHOUT
   * re-triggering the browser device picker.
   * If not yet paired or forcePicker is true, it prompts the user to select the device once.
   */
  public async connect(forcePicker: boolean = false): Promise<string> {
    if (!PhomemoPrinterService.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on desktop or Android.');
    }

    if (this.isConnecting) {
      throw new Error('Connection attempt already in progress.');
    }

    this.isConnecting = true;

    try {
      let dev = this.device;

      // If we don't have a device yet, or user explicitly requested to switch device
      if (!dev || forcePicker) {
        // Clean up previous device listener
        if (this.device && this.onDisconnectListener) {
          this.device.removeEventListener('gattserverdisconnected', this.onDisconnectListener);
        }

        const selectedDevice = await navigator.bluetooth!.requestDevice({
          acceptAllDevices: true,
          optionalServices: [PHOMEMO_SERVICE_UUID],
        });

        dev = selectedDevice;
        this.device = selectedDevice;

        // Set up disconnect listener to notify UI when hardware disconnects/sleeps
        this.onDisconnectListener = () => {
          this.characteristic = null;
          this.onConnectionStateChange?.(false, selectedDevice.name || 'Printer');
        };
        selectedDevice.addEventListener('gattserverdisconnected', this.onDisconnectListener);
      }

      if (!dev) {
        throw new Error('No Bluetooth device was selected.');
      }

      // Connect to GATT Server
      const char = await this.ensureGattConnected(dev);
      this.characteristic = char;

      const deviceName = dev.name || 'Phomemo D30';
      this.onConnectionStateChange?.(true, deviceName);
      return deviceName;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Ensures GATT is connected and returns the active write characteristic.
   * Crucial fix for: "NetworkError: GATT Server is disconnected. Cannot retrieve services. (Re)connect first with device.gatt.connect."
   */
  private async ensureGattConnected(dev: BluetoothDevice): Promise<BluetoothRemoteGATTCharacteristic> {
    if (!dev.gatt) {
      throw new Error('Device does not support GATT communication.');
    }

    let server = dev.gatt;

    // Check if GATT server is disconnected. If so, (re)connect directly
    if (!server.connected) {
      server = await server.connect();
    }

    // Retrieve service and characteristic
    const service = await server.getPrimaryService(PHOMEMO_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(PHOMEMO_WRITE_CHAR_UUID);
    return characteristic;
  }

  /**
   * Manually disconnect from printer
   */
  public disconnect(): void {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.characteristic = null;
    this.onConnectionStateChange?.(false, this.device?.name || undefined);
  }

  /**
   * Prepares the raw 1-bit monochrome bitmap packet data for Phomemo D30
   */
  public static getPrintData(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const widthInBytes = Math.ceil(canvas.width / 8);
    const data = new Uint8Array(widthInBytes * canvas.height + 8);

    let offset = 0;
    for (let y = 0; y < canvas.height; ++y) {
      for (let k = 0; k < widthInBytes; ++k) {
        const k8 = k * 8;
        let byteVal = 0;

        for (let bit = 0; bit < 8; ++bit) {
          const x = k8 + bit;
          if (x < canvas.width) {
            const idx = (canvas.width * y + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            // Black pixel if luminance < 128 (print black), white pixel otherwise
            // D30 expects bit 0 for black and 1 for white, or 0 if black pixel
            const isWhite = r + g + b > 0 ? 0 : 1;
            if (isWhite) {
              byteVal |= (1 << (7 - bit));
            }
          } else {
            // Padding bits outside canvas width
            byteVal |= (1 << (7 - bit));
          }
        }

        data[offset++] = byteVal;
      }
    }

    return data;
  }

  /**
   * Header packet telling Phomemo D30 the dimensions of the print job
   */
  private static createHeaderData(mmWidth: number, bytesPerRow: number): Uint8Array {
    return new Uint8Array([
      0x1b,
      0x40,
      0x1d,
      0x76,
      0x30,
      0x00,
      mmWidth % 256,
      Math.floor(mmWidth / 256),
      bytesPerRow % 256,
      Math.floor(bytesPerRow / 256),
    ]);
  }

  /**
   * Sends a single canvas print job across Bluetooth in chunks
   */
  private async printSingleJob(
    characteristic: BluetoothRemoteGATTCharacteristic,
    canvas: HTMLCanvasElement,
    onChunk?: (sentBytes: number, totalBytes: number) => void
  ): Promise<void> {
    const printData = PhomemoPrinterService.getPrintData(canvas);
    const mmWidth = Math.ceil(canvas.width / 8);
    const rows = Math.ceil(printData.length / mmWidth);
    const header = PhomemoPrinterService.createHeaderData(mmWidth, rows);

    // Send header
    await characteristic.writeValueWithResponse(header as unknown as BufferSource);

    // Send data chunks
    const totalBytes = printData.length;
    for (let i = 0; i < totalBytes; i += PACKET_SIZE_BYTES) {
      const slice = printData.slice(i, Math.min(i + PACKET_SIZE_BYTES, totalBytes));
      await characteristic.writeValueWithResponse(slice as unknown as BufferSource);
      onChunk?.(Math.min(i + PACKET_SIZE_BYTES, totalBytes), totalBytes);

      // Brief yield to avoid packet saturation on slower host Bluetooth chips
      await new Promise((resolve) => setTimeout(resolve, 12));
    }

    // Send end sequence
    await characteristic.writeValueWithResponse(END_DATA as unknown as BufferSource);
  }

  /**
   * Print canvas with multi-copy support and transparent auto-reconnect if GATT disconnected.
   */
  public async print(
    canvas: HTMLCanvasElement,
    copies: number = 1,
    onProgress?: ProgressCallback,
    abortSignal?: AbortSignal
  ): Promise<void> {
    if (!canvas) throw new Error('No canvas provided to print.');
    if (copies < 1) copies = 1;

    // Check device presence
    if (!this.device) {
      // Connect once if not yet paired
      await this.connect(false);
    }

    // Auto-reconnect if GATT disconnected in the background
    let char = this.characteristic;
    if (!char || !this.device?.gatt?.connected) {
      onProgress?.({
        currentCopy: 1,
        totalCopies: copies,
        bytesSent: 0,
        totalBytes: 100,
        percent: 0,
        message: 'Reconnecting to printer GATT server...',
      });
      char = await this.ensureGattConnected(this.device!);
      this.characteristic = char;
      this.onConnectionStateChange?.(true, this.device!.name || 'Phomemo D30');
    }

    for (let c = 1; c <= copies; c++) {
      if (abortSignal?.aborted) {
        throw new Error('Printing cancelled by user.');
      }

      onProgress?.({
        currentCopy: c,
        totalCopies: copies,
        bytesSent: 0,
        totalBytes: 100,
        percent: Math.round(((c - 1) / copies) * 100),
        message: `Printing copy ${c} of ${copies}...`,
      });

      try {
        await this.printSingleJob(char, canvas, (sent, total) => {
          const copyProgress = sent / total;
          const totalProgress = ((c - 1) + copyProgress) / copies;
          onProgress?.({
            currentCopy: c,
            totalCopies: copies,
            bytesSent: sent,
            totalBytes: total,
            percent: Math.min(100, Math.round(totalProgress * 100)),
            message: `Printing copy ${c} of ${copies} (${Math.round(copyProgress * 100)}%)...`,
          });
        });
      } catch (err: any) {
        // If error is GATT disconnected error, attempt recovery once
        const errorMsg = String(err?.message || err);
        if (
          errorMsg.includes('GATT') ||
          errorMsg.includes('disconnected') ||
          errorMsg.includes('connect')
        ) {
          onProgress?.({
            currentCopy: c,
            totalCopies: copies,
            bytesSent: 0,
            totalBytes: 100,
            percent: Math.round(((c - 1) / copies) * 100),
            message: 'Connection dropped. Reconnecting...',
          });

          char = await this.ensureGattConnected(this.device!);
          this.characteristic = char;

          // Retry current copy once
          await this.printSingleJob(char, canvas, (sent, total) => {
            const copyProgress = sent / total;
            const totalProgress = ((c - 1) + copyProgress) / copies;
            onProgress?.({
              currentCopy: c,
              totalCopies: copies,
              bytesSent: sent,
              totalBytes: total,
              percent: Math.min(100, Math.round(totalProgress * 100)),
              message: `Retrying copy ${c} of ${copies} (${Math.round(copyProgress * 100)}%)...`,
            });
          });
        } else {
          throw err;
        }
      }

      // If more copies remain, pause briefly so printer head can feed and stop
      if (c < copies) {
        onProgress?.({
          currentCopy: c,
          totalCopies: copies,
          bytesSent: 100,
          totalBytes: 100,
          percent: Math.round((c / copies) * 100),
          message: `Feeding label. Next copy in 1 second...`,
        });
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    onProgress?.({
      currentCopy: copies,
      totalCopies: copies,
      bytesSent: 100,
      totalBytes: 100,
      percent: 100,
      message: `Finished printing ${copies} ${copies === 1 ? 'copy' : 'copies'}.`,
    });
  }
}

export const printerInstance = new PhomemoPrinterService();
