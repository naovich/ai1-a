import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { PDFAnalyzer } from './pdf/service.pdf';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.enableCors();
  await app.listen(3000, '0.0.0.0');

  const page = 1;
  const filename = 'test.pdf';

  const pdf = new PDFAnalyzer();
  //pdf.getPageCount(fs.readFileSync('l.pdf'));
  pdf.getPageContent(fs.readFileSync(filename), page);

  pdf.saveImages(fs.readFileSync(filename), 'images');
}
bootstrap();
