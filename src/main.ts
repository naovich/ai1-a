import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//import { ChatResponseProps, ChatService } from './chat/chat.service';
//import { systemProfile } from './chat/data';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  //const chatService = app.get(ChatService);
  //const response: any = await chatService.getAnswer(chatMessage);
  //console.log(JSON.stringify(response.choices));
}
bootstrap();

/*const chatMessage: ChatResponseProps = {
  system: {
    content: systemProfile[0].content,
  },
  model: 'gpt-3.5-turbo',
  prompt: 'Explique-moi ta profession.',
};*/
