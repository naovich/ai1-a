import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//import { TtsService } from './Tts/tts.services';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000, '0.0.0.0');
  // call the function to generate the speech
  //const ttsService = app.get(TtsService);
  //await ttsService.generateSpeech('Hello, world!');
}
bootstrap();
