import { Module } from '@nestjs/common';

import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';

<<<<<<< HEAD
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [ConfigModule, AuthModule],
=======
@Module({
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
  ],
  exports: [ChatService],
})
export class ChatModule {}