declare module 'pdf.js-extract' {
  export interface PDFExtractOptions {
    get_image?: boolean;
  }

  export interface PDFExtractPage {
    images?: {
      width: number;
      height: number;
      data: Uint8Array;
    }[];
  }

  export interface PDFExtractResult {
    pages: PDFExtractPage[];
  }

  export class PDFExtract {
    extractBuffer(
      buffer: Buffer,
      options?: PDFExtractOptions,
    ): Promise<PDFExtractResult>;
  }
}
