import * as fs from 'fs';
import * as pdf from 'pdf-parse';
import { PDFExtract, PDFExtractOptions } from 'pdf.js-extract';

interface PageAnalysis {
  pageNumber: number;
  isScanned: boolean;
  text: string;
}

interface PageImage {
  pageNumber: number;
  images: {
    width: number;
    height: number;
    data: Uint8Array;
  }[];
}

export class PDFAnalyzer {
  private pdfExtract = new PDFExtract();

  async analyzePDF(pdfBuffer: Buffer): Promise<PageAnalysis[]> {
    const data = await pdf(pdfBuffer);

    // pdf-parse ne fournit pas d'analyse page par page par défaut
    // on peut utiliser les sauts de page comme séparateurs
    const pages = data.text.split('\n\n').filter((page) => page.trim());

    return pages.map((text, index) => ({
      pageNumber: index + 1,
      isScanned: this.isPageScanned(text),
      text: text.trim(),
    }));
  }

  private isPageScanned(text: string): boolean {
    // Une page est considérée comme scannée si :
    // - Elle contient beaucoup de caractères non reconnus (, □, etc.)
    // - OU ne contient presque que des espaces et caractères spéciaux
    const nonRecognizedCharsRatio =
      (text.match(/[□]/g)?.length || 0) / text.length;
    const alphanumericRatio =
      (text.match(/[a-zA-Z0-9]/g)?.length || 0) / text.length;

    console;

    return nonRecognizedCharsRatio > 0.1 || alphanumericRatio < 0.2;
  }

  public test() {
    console.log('test');
  }

  async extractAndSaveText(
    pdfBuffer: Buffer,
    outputPath: string,
  ): Promise<void> {
    const analysis = await this.analyzePDF(pdfBuffer);
    const extractedText = analysis
      .map((page) => `\n--- Page ${page.pageNumber} ---\n${page.text}\n`)
      .join('\n');

    await fs.promises.writeFile(outputPath, extractedText, 'utf-8');
  }

  public async isFirstPageScanned(pdfBuffer: Buffer): Promise<boolean> {
    const analysis = await this.analyzePDF(pdfBuffer);
    if (analysis.length === 0) {
      throw new Error('Le PDF ne contient aucune page');
    }
    return analysis[0].isScanned;
  }

  public async displayPDFContent(pdfBuffer: Buffer): Promise<void> {
    try {
      const analysis = await this.analyzePDF(pdfBuffer);

      console.log('=== Contenu du PDF ===');
      analysis.forEach((page) => {
        console.log(`\n=== Page ${page.pageNumber} ===`);
        console.log(
          `Type: ${page.isScanned ? 'Page scannée' : 'Page avec texte'}`,
        );
        console.log('Contenu:');
        console.log(page.text);
        console.log('==================\n');
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du PDF:', error);
      throw error;
    }
  }

  public async getPageCount(pdfBuffer: Buffer): Promise<number> {
    const analysis = await this.analyzePDF(pdfBuffer);
    console.log('Nombre de pages:', analysis.length);
    return analysis.length;
  }

  public async getPageContent(
    pdfBuffer: Buffer,
    pageNumber: number,
  ): Promise<PageAnalysis | null> {
    const analysis = await this.analyzePDF(pdfBuffer);

    // Vérifie si le numéro de page est valide
    if (pageNumber < 1 || pageNumber > analysis.length) {
      return null;
    }

    // Les pages commencent à 1, mais l'index du tableau commence à 0
    const page = analysis[pageNumber - 1];
    console.log('Contenu de la page', pageNumber, ':', page.text);
    return page;
  }

  public async extractImages(
    pdfBuffer: Buffer,
    page?: number,
  ): Promise<PageImage[]> {
    const options: PDFExtractOptions = {
      get_image: true,
    };

    try {
      const data = await this.pdfExtract.extractBuffer(pdfBuffer, options);

      let result: PageImage[];
      if (page !== undefined) {
        if (page < 1 || page > data.pages.length) {
          throw new Error(`La page ${page} n'existe pas dans ce PDF`);
        }
        result = [
          {
            pageNumber: page,
            images: data.pages[page - 1].images || [],
          },
        ];
      } else {
        result = data.pages.map((p, index) => ({
          pageNumber: index + 1,
          images: p.images || [],
        }));
      }

      // Log du résultat
      result.forEach((page) => {
        console.log(
          `Page ${page.pageNumber}: ${page.images.length} image(s) trouvée(s)`,
        );
      });

      return result;
    } catch (error) {
      console.error("Erreur lors de l'extraction des images:", error);
      throw error;
    }
  }

  public async saveImages(
    pdfBuffer: Buffer,
    outputDir: string,
    page?: number,
  ): Promise<void> {
    const images = await this.extractImages(pdfBuffer, page);
    let totalSaved = 0;

    for (const page of images) {
      for (const [idx, image] of page.images.entries()) {
        const imagePath = `${outputDir}/page${page.pageNumber}_image${idx + 1}.png`;
        await fs.promises.writeFile(imagePath, image.data);
        console.log(`Image sauvegardée: ${imagePath}`);
        totalSaved++;
      }
    }

    console.log(`Total des images sauvegardées: ${totalSaved}`);
  }
}
