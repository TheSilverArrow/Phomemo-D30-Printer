import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export interface LabelDimensions {
  widthMm: number;  // Length along the roll (e.g. 40mm)
  heightMm: number; // Width across print head (e.g. 12mm)
}

export type PrintMode = 'text' | 'barcode' | 'qr' | 'qr-text' | 'image';

export interface TextLabelConfig {
  text: string;
  fontSize: number; // px
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '600';
  textAlign: 'center' | 'left' | 'right';
  lineHeightMultiplier: number;
  invertColors: boolean;
}

export interface BarcodeLabelConfig {
  data: string;
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
  displayValue: boolean;
  barHeightRatio: number; // 0.4 to 0.85
  barWidth: number; // 1, 2, 3
}

export interface QrLabelConfig {
  data: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
}

export interface QrTextLabelConfig {
  qrData: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center';
  qrSizeRatio: number; // relative size
  gap: number;
}

export interface ImageLabelConfig {
  imageDataUrl: string | null;
  threshold: number; // 0 - 255
  invert: boolean;
  scaleMode: 'fit' | 'fill' | 'original';
}

/**
 * Draw multiline wrapped text on a canvas context
 */
export function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  lineHeight: number,
  align: 'center' | 'left' | 'right' = 'center'
): void {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para) {
      lines.push('');
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && n > 0) {
        lines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  const totalBlockHeight = lines.length * lineHeight;
  // Vertically center inside the bounding box
  let startY = y + Math.max(0, (maxHeight - totalBlockHeight) / 2) + lineHeight * 0.8;

  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';

  for (const line of lines) {
    let drawX = x;
    if (align === 'center') {
      drawX = x + maxWidth / 2;
    } else if (align === 'right') {
      drawX = x + maxWidth;
    }

    ctx.fillText(line, drawX, startY);
    startY += lineHeight;
  }
}

/**
 * Render the horizontal design preview canvas
 */
export async function renderLabelDesign(
  canvas: HTMLCanvasElement,
  dimensions: LabelDimensions,
  mode: PrintMode,
  textConfig: TextLabelConfig,
  barcodeConfig: BarcodeLabelConfig,
  qrConfig: QrLabelConfig,
  qrTextConfig: QrTextLabelConfig,
  imageConfig: ImageLabelConfig
): Promise<void> {
  // 8 dots per mm (standard 203 DPI thermal printer)
  const widthPx = Math.round(dimensions.widthMm * 8);
  const heightPx = Math.round(dimensions.heightMm * 8);

  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthPx, heightPx);

  if (mode === 'text') {
    if (textConfig.invertColors) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, widthPx, heightPx);
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#000000';
    }

    const padding = 6;
    const availWidth = widthPx - padding * 2;
    const availHeight = heightPx - padding * 2;

    ctx.font = `${textConfig.fontWeight} ${textConfig.fontSize}px ${textConfig.fontFamily}`;
    const lineHeight = textConfig.fontSize * textConfig.lineHeightMultiplier;

    drawMultilineText(
      ctx,
      textConfig.text || 'Sample Label',
      padding,
      padding,
      availWidth,
      availHeight,
      lineHeight,
      textConfig.textAlign
    );
  } else if (mode === 'barcode') {
    if (!barcodeConfig.data.trim()) return;

    try {
      const tempImg = document.createElement('img');
      await new Promise<void>((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = reject;

        try {
          JsBarcode(tempImg, barcodeConfig.data, {
            format: barcodeConfig.format,
            width: barcodeConfig.barWidth,
            height: Math.round(heightPx * barcodeConfig.barHeightRatio),
            displayValue: barcodeConfig.displayValue,
            font: 'monospace',
            fontSize: 12,
            margin: 2,
            background: '#ffffff',
            lineColor: '#000000',
          });
        } catch (e) {
          reject(e);
        }
      });

      // Center the barcode on label
      ctx.imageSmoothingEnabled = false;
      const drawX = Math.max(0, (widthPx - tempImg.width) / 2);
      const drawY = Math.max(0, (heightPx - tempImg.height) / 2);
      ctx.drawImage(tempImg, drawX, drawY);
    } catch {
      // Fallback text on invalid barcode format
      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Invalid barcode characters', widthPx / 2, heightPx / 2);
    }
  } else if (mode === 'qr') {
    if (!qrConfig.data.trim()) return;

    try {
      const qrSize = Math.min(widthPx - 8, heightPx - 8);
      const dataUrl = await QRCode.toDataURL(qrConfig.data, {
        errorCorrectionLevel: qrConfig.errorCorrectionLevel,
        margin: qrConfig.margin,
        width: qrSize,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = dataUrl;
      });

      ctx.imageSmoothingEnabled = false;
      const drawX = (widthPx - qrSize) / 2;
      const drawY = (heightPx - qrSize) / 2;
      ctx.drawImage(qrImg, drawX, drawY, qrSize, qrSize);
    } catch {
      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR Code Error', widthPx / 2, heightPx / 2);
    }
  } else if (mode === 'qr-text') {
    const padding = 4;
    const gap = qrTextConfig.gap;
    const maxQrSize = Math.max(16, heightPx - padding * 2);
    let qrSize = Math.round(maxQrSize * qrTextConfig.qrSizeRatio);

    if (qrTextConfig.text.trim()) {
      const minTextWidth = 32;
      const availableForQr = widthPx - padding * 2 - gap - minTextWidth;
      qrSize = Math.max(16, Math.min(qrSize, availableForQr));
    }

    if (qrTextConfig.qrData.trim()) {
      try {
        const dataUrl = await QRCode.toDataURL(qrTextConfig.qrData, {
          margin: 1,
          width: qrSize,
          errorCorrectionLevel: 'M',
        });

        const qrImg = new Image();
        await new Promise<void>((resolve, reject) => {
          qrImg.onload = () => resolve();
          qrImg.onerror = reject;
          qrImg.src = dataUrl;
        });

        ctx.imageSmoothingEnabled = false;
        const qrY = (heightPx - qrSize) / 2;
        ctx.drawImage(qrImg, padding, qrY, qrSize, qrSize);
      } catch {
        // Continue to render text
      }
    }

    if (qrTextConfig.text.trim()) {
      const textX = padding + qrSize + gap;
      const textWidth = Math.max(10, widthPx - padding - textX);
      const textHeight = heightPx - padding * 2;

      ctx.fillStyle = '#000000';
      ctx.font = `600 ${qrTextConfig.fontSize}px ${qrTextConfig.fontFamily}`;
      const lineHeight = qrTextConfig.fontSize * 1.25;

      drawMultilineText(
        ctx,
        qrTextConfig.text,
        textX,
        padding,
        textWidth,
        textHeight,
        lineHeight,
        qrTextConfig.textAlign
      );
    }
  } else if (mode === 'image') {
    if (!imageConfig.imageDataUrl) {
      ctx.fillStyle = '#888888';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Select or drop an image file', widthPx / 2, heightPx / 2);
      return;
    }

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageConfig.imageDataUrl!;
    });

    // Create intermediate canvas for image binarization
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = widthPx;
    tempCanvas.height = heightPx;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, widthPx, heightPx);

    let drawW = img.width;
    let drawH = img.height;
    let drawX = 0;
    let drawY = 0;

    if (imageConfig.scaleMode === 'fit') {
      const scale = Math.min(widthPx / img.width, heightPx / img.height);
      drawW = img.width * scale;
      drawH = img.height * scale;
      drawX = (widthPx - drawW) / 2;
      drawY = (heightPx - drawH) / 2;
    } else if (imageConfig.scaleMode === 'fill') {
      const scale = Math.max(widthPx / img.width, heightPx / img.height);
      drawW = img.width * scale;
      drawH = img.height * scale;
      drawX = (widthPx - drawW) / 2;
      drawY = (heightPx - drawH) / 2;
    } else {
      drawX = (widthPx - drawW) / 2;
      drawY = (heightPx - drawH) / 2;
    }

    tempCtx.drawImage(img, drawX, drawY, drawW, drawH);

    // Apply binarization / thresholding for thermal printing
    const rawData = tempCtx.getImageData(0, 0, widthPx, heightPx);
    const pixels = rawData.data;
    const threshold = imageConfig.threshold;

    for (let i = 0; i < pixels.length; i += 4) {
      // Grayscale luminance
      const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      let val = lum < threshold ? 0 : 255;
      if (imageConfig.invert) {
        val = 255 - val;
      }
      pixels[i] = val;
      pixels[i + 1] = val;
      pixels[i + 2] = val;
      pixels[i + 3] = 255;
    }

    ctx.putImageData(rawData, 0, 0);
  }
}

/**
 * Creates the vertically-oriented canvas required by the Phomemo D30 hardware printhead
 */
export function createPrintCanvasFromDesign(
  designCanvas: HTMLCanvasElement,
  options?: { flipH?: boolean; flipV?: boolean }
): HTMLCanvasElement {
  const printCanvas = document.createElement('canvas');
  // Phomemo D30 print head is across tape width (height in design)
  printCanvas.width = designCanvas.height;
  printCanvas.height = designCanvas.width;

  const ctx = printCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context for print canvas');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

  ctx.save();
  // Rotate 90 degrees clockwise to match printhead feed direction
  ctx.translate(printCanvas.width / 2, printCanvas.height / 2);
  ctx.rotate(Math.PI / 2);

  if (options?.flipH) ctx.scale(-1, 1);
  if (options?.flipV) ctx.scale(1, -1);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    designCanvas,
    -designCanvas.width / 2,
    -designCanvas.height / 2,
    designCanvas.width,
    designCanvas.height
  );
  ctx.restore();

  return printCanvas;
}
