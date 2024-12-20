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
    @Body() { chatName, profileId }: { chatName: string; profileId: string },
  ): Promise<{ chatName: string }> {
    await this.chatService.startNewChat('admin', chatName, profileId);
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
      systemProfileId,
      refresh,
      searchOn,
    }: {
      prompt: string;
      provider?: string;
      model?: string;
      chatId: string;
      systemProfileId?: string;
      refresh?: boolean;
      searchOn?: boolean;
    },
  ): Promise<object> {
    return this.chatService.getAnswer({
      prompt,
      provider: provider as AIProvider,
      model,
      chatId,
      systemProfileId,
      refresh,
      searchOn,
    });
  }

  @Get('stream')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  streamAudio(@Res() res: Response, @Query('t') _timestamp: string) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const filePath = './temp/users/admin/audio/downloads/speech.mp3';
    res.sendFile(filePath, { root: '.' });
  }

  @Post('new')
  startNewChat(
    @Body()
    {
      user,
      chatName,
      profileId,
    }: {
      user: string;
      chatName: string;
      profileId: string;
    },
  ): Promise<void> {
    return this.chatService.startNewChat(user, chatName, profileId);
  }

  @Post('delete')
  deleteChat(
    @Body() { user, chatName }: { user: string; chatName: string },
  ): Promise<void> {
    return this.chatService.deleteChat(user, chatName);
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

  @Get('profiles')
  getChatProfiles(): Promise<string[]> {
    return this.chatService.getChatProfiles();
  }
}
