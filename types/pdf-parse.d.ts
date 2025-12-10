declare module 'pdf-parse' {
  import { Buffer } from 'buffer';

  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  interface Options {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }

  function pdf(dataBuffer: Buffer | Uint8Array, options?: Options): Promise<PDFInfo>;

  export = pdf;
}
