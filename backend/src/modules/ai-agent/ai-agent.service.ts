import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { AIAppliedTo, AIFeedback } from '@prisma/client';

interface EQSuggestion {
  bands: number[];
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: string;
  reverbAmount: number;
  explanation: string;
  segments?: Array<{
    label: string;
    startMs: number;
    endMs: number;
    bands: number[];
    explanation: string;
  }>;
}

@Injectable()
export class AiAgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async suggestEQ(userId: string, data: {
    prompt: string;
    trackId?: string;
    playlistId?: string;
    context?: Record<string, unknown>;
  }): Promise<{ suggestion: EQSuggestion; requestId: string }> {
    const startTime = Date.now();
    const model = this.configService.get<string>('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514');

    // Build context
    const context: Record<string, unknown> = { ...data.context };

    if (data.trackId) {
      const track = await this.prisma.track.findFirst({
        where: { id: data.trackId, userId },
      });
      if (track) {
        context.track = {
          title: track.title,
          artist: track.artist,
          album: track.album,
          genre: track.genre,
          durationMs: track.durationMs,
        };
      }
    }

    // TODO: Integrate with actual Claude API
    // For now, return a mock suggestion
    const suggestion: EQSuggestion = await this.generateMockSuggestion(data.prompt, context);

    const responseTimeMs = Date.now() - startTime;

    // Log the request
    const aiRequest = await this.prisma.aIRequest.create({
      data: {
        userId,
        trackId: data.trackId,
        prompt: data.prompt,
        context,
        response: suggestion as any,
        explanation: suggestion.explanation,
        modelUsed: model,
        responseTimeMs,
        tokensInput: 0, // Will be set when real API is integrated
        tokensOutput: 0,
        costUsd: 0,
      },
    });

    return {
      suggestion,
      requestId: aiRequest.id,
    };
  }

  async acceptSuggestion(requestId: string, userId: string, appliedTo: AIAppliedTo, appliedId?: string) {
    const request = await this.prisma.aIRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException('AI request not found');
    }

    return this.prisma.aIRequest.update({
      where: { id: requestId },
      data: {
        wasAccepted: true,
        appliedTo,
        appliedId,
      },
    });
  }

  async provideFeedback(requestId: string, userId: string, feedback: AIFeedback, comment?: string) {
    const request = await this.prisma.aIRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException('AI request not found');
    }

    return this.prisma.aIRequest.update({
      where: { id: requestId },
      data: {
        feedback,
        feedbackComment: comment ?? '',
      },
    });
  }

  async getHistory(userId: string, params?: { skip?: number; take?: number }) {
    const { skip = 0, take = 20 } = params || {};

    const [requests, total] = await Promise.all([
      this.prisma.aIRequest.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { track: { select: { title: true, artist: true } } },
      }),
      this.prisma.aIRequest.count({ where: { userId } }),
    ]);

    return { requests, total, skip, take };
  }

  private async generateMockSuggestion(prompt: string, context: Record<string, unknown>): Promise<EQSuggestion> {
    // This is a mock implementation
    // TODO: Replace with actual Claude API integration

    const genre = (context.track as any)?.genre?.toLowerCase() || '';

    let bands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let explanation = 'Configuracion base plana.';

    if (prompt.toLowerCase().includes('bass') || genre.includes('hip') || genre.includes('electronic')) {
      bands = [6, 5, 4, 2, 0, 0, 0, 0, 0, 0];
      explanation = 'He aumentado las frecuencias bajas para dar mas presencia al bajo y bombo.';
    } else if (prompt.toLowerCase().includes('vocal') || prompt.toLowerCase().includes('voz')) {
      bands = [-2, -1, 0, 3, 5, 5, 3, 0, -1, -2];
      explanation = 'He realzado las frecuencias medias donde se concentra la voz humana.';
    } else if (genre.includes('rock')) {
      bands = [5, 4, 2, 0, -1, 0, 2, 4, 5, 5];
      explanation = 'Configuracion clasica de rock con bajos y agudos pronunciados.';
    } else if (genre.includes('jazz') || genre.includes('classical')) {
      bands = [3, 2, 0, 2, -2, -2, 0, 2, 3, 4];
      explanation = 'Configuracion suave que respeta la dinamica natural de la musica.';
    }

    return {
      bands,
      bassBoost: 0,
      virtualizer: 0,
      loudness: 0,
      reverbPreset: 'NONE',
      reverbAmount: 0,
      explanation,
    };
  }
}
