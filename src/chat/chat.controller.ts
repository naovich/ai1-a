import { Body, Controller, Post } from '@nestjs/common';
import { ChatResponseProps, ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('answer')
  getAnswer(@Body() chatMessage: ChatResponseProps): Promise<object> {
    console.log('chatMessage', chatMessage);
    return this.chatService.getAnswer(chatMessage);
  }

  @Post('new')
  startNewChat(
    @Body() { user, chatName }: { user: string; chatName: string },
  ): Promise<void> {
    return this.chatService.startNewChat(user, chatName);
  }

  @Post('change')
  changeChat(@Body() { chatName }: { chatName: string }): Promise<void> {
    return this.chatService.changeChat(chatName);
  }
}
