import { Body, Controller, Post, Get, Res, Query, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { AIProvider } from './ai.interface';
import { ChatMessage } from './chat.message.interface';
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('list')
  async getAvailableChats(): Promise<string[]> {
    return this.chatService.getAvailableChats();
  }

  @Post('create')
  async createNewChat(
    @Body() { chatName }: { chatName: string },
  ): Promise<{ chatName: string }> {
    await this.chatService.startNewChat('Claude', chatName);
    return { chatName };
  }

  @Post('answer')
  async getAnswer(
    @Body()
    {
      prompt,
      provider,
      model,
      chatId,
    }: {
      prompt: string;
      provider?: string;
      model?: string;
      chatId: string;
    },
  ): Promise<object> {
    return this.chatService.getAnswer({
      prompt,
      provider: provider as AIProvider,
      model,
      chatId,
    });
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

  @Get('history/:chatId')
  async getChatHistory(@Param('chatId') chatId: string): Promise<{
    messages: ChatMessage[];
    lastUpdated: string;
    chatInfo: {
      user: string;
      chatName: string;
    };
  }> {
    return this.chatService.getChatHistory(chatId);
  }

  @Post('profile')
  setProfile(@Body('profileId') profileId: string) {
    this.chatService.setSystemProfile(profileId);
    return { success: true };
  }
}
