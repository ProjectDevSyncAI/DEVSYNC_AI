import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);

  async generateText(
    prompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not configured. Returning fallback response.',
      );

      return 'AI service is not configured yet.';
    }

    const messages = [
      ...(systemPrompt
        ? [{ role: 'system', content: systemPrompt }]
        : []),
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
            messages,
            temperature: 0.3,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        this.logger.error(
          `OpenAI API error: ${response.status} ${errorText}`,
        );

        throw new Error('OpenAI API request failed');
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      return data.choices?.[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error('Failed to generate AI response', error);

      throw error;
    }
  }
}
