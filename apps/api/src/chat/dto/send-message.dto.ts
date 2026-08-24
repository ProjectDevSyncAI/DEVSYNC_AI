export class SendMessageDto {
  channelId!: string;
  senderId?: string;
  content!: string;
  type?: string;
  metadata?: Record<string, unknown>;
}