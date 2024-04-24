import { Body, Controller, Post, Get, Res, Query } from '@nestjs/common';
import { ChatResponseProps, ChatService } from './chat.service';
import { Response } from 'express';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('answer')
  getAnswer(@Body() chatMessage: ChatResponseProps): Promise<object> {
    console.log('chatMessage', chatMessage);
    return this.chatService.getAnswer(chatMessage);
  }

  @Get('stream')
  streamAudio(@Res() res: Response) {
    const filePath = './temp/audio/speech.mp3';
    res.sendFile(filePath, { root: '.' });
  }
  @Post('new')
  startNewChat(
    @Body() { user, chatName }: { user: string; chatName: string },
  ): Promise<void> {
    return this.chatService.startNewChat(user, chatName);
  }

  @Post('change')
  changeChat(
    @Body() { user, chatName }: { user: string; chatName: string },
  ): Promise<void> {
    return this.chatService.changeChat(user, chatName);
  }

  @Post('delete')
  deleteChat(
    @Body() { user, chatName }: { user: string; chatName: string },
  ): Promise<void> {
    return this.chatService.deleteChat(user, chatName);
  }

  @Post('postChatSpeech')
  generateChatSpeech(@Body() { text }: { text: string }): Promise<void> {
    return this.chatService.generateChatSpeech(text);
  }

  @Get('getChatSpeech')
  getGenerateChatSpeech(@Query('text') text: string): Promise<void> {
    console.log('text', text);
    return this.chatService.generateChatSpeech(text);
  }
}
