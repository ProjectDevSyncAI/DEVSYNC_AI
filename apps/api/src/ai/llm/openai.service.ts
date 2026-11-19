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
<<<<<<< HEAD

  async *generateStream(
    prompt: string,
    systemPrompt?: string,
  ): AsyncGenerator<string, void, unknown> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      yield 'AI service is not configured yet. Set OPENAI_API_KEY in environment variables.';
      return;
    }

    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt },
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
            stream: true,
          }),
        },
      );

      if (!response.ok || !response.body) {
        throw new Error(`OpenAI stream request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) yield delta;
            } catch {
              // ignore partial lines
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to stream AI response', error);
      throw error;
    }
  }
}

=======
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
