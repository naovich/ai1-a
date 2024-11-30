import * as pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';

interface PageAnalysis {
  pageNumber: number;
  isScanned: boolean;
  text: string;
}

export class PDFAnalyzer {
  constructor() {
    // Initialiser pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  async analyzePDF(pdfBuffer: Buffer): Promise<PageAnalysis[]> {
    const results: PageAnalysis[] = [];

    // Charger le PDF avec pdf.js
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdfDoc = await loadingTask.promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');

      // Une page est considérée comme scannée si:
      // 1. Elle contient peu ou pas de texte extractible
      // 2. Elle contient des images
      const isScanned = await this.isPageScanned(page, text);

      results.push({
        pageNumber: i,
        isScanned,
        text: text.trim(),
      });
    }

    return results;
  }

  private async isPageScanned(
    page: any,
    extractedText: string,
  ): Promise<boolean> {
    // Vérifier la présence de texte
    const hasMinimalText = extractedText.length > 50;

    // Vérifier la présence d'images
    const operatorList = await page.getOperatorList();
    const hasImages = operatorList.fnArray.some(
      (fn: number) =>
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintInlineImageXObject,
    );

    // Une page est probablement scannée si elle contient des images
    // mais peu ou pas de texte extractible
    return hasImages && !hasMinimalText;
  }

  async extractAndSaveText(
    pdfBuffer: Buffer,
    outputPath: string,
  ): Promise<void> {
    const analysis = await this.analyzePDF(pdfBuffer);
    let extractedText = '';

    for (const page of analysis) {
      extractedText += `\n--- Page ${page.pageNumber} ---\n`;
      if (page.isScanned) {
        extractedText += '[Page scannée - Texte non extractible directement]\n';
        // Ici, vous pourriez intégrer un service OCR comme Tesseract.js
        // pour extraire le texte des pages scannées
      } else {
        extractedText += page.text + '\n';
      }
    }

    // Sauvegarder le texte extrait
    await fs.promises.writeFile(outputPath, extractedText, 'utf-8');
  }
}
