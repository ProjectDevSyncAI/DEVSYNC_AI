import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateRiskDto } from './dto/create-risk.dto.js';

@Injectable()
export class RiskEngineService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getProjectRisks(projectId: string) {
    return this.prisma.projectRisk.findMany({
      where: {
        projectId,
      },
      orderBy: [
        {
          riskScore: 'desc',
        },
        {
          detectedAt: 'desc',
        },
      ],
    });
  }

  async getRisk(id: string) {
    const risk =
      await this.prisma.projectRisk.findUnique({
        where: {
          id,
        },
      });

    if (!risk) {
      throw new NotFoundException(
        'Project risk not found',
      );
    }

    return risk;
  }

  async createRisk(dto: CreateRiskDto) {
    const riskScore =
      dto.riskScore ??
      this.calculateRiskScore(
        dto.probability,
        dto.impact,
      );

    return this.prisma.projectRisk.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        probability: dto.probability,
        impact: dto.impact,
        riskScore,
        source: dto.source,
        evidence: dto.evidence
          ? JSON.parse(
              JSON.stringify(dto.evidence),
            )
          : undefined,
      },
    });
  }

  async updateRiskStatus(
    id: string,
    status:
      | 'OPEN'
      | 'ACKNOWLEDGED'
      | 'MITIGATED'
      | 'RESOLVED'
      | 'IGNORED',
  ) {
    await this.getRisk(id);

    return this.prisma.projectRisk.update({
      where: {
        id,
      },
      data: {
        status,
        resolvedAt:
          status === 'RESOLVED'
            ? new Date()
            : null,
      },
    });
  }

  async deleteRisk(id: string) {
    await this.getRisk(id);

    return this.prisma.projectRisk.delete({
      where: {
        id,
      },
    });
  }

  async calculateProjectRisk(projectId: string) {
    const risks =
      await this.prisma.projectRisk.findMany({
        where: {
          projectId,
          status: 'OPEN',
        },
      });

    if (risks.length === 0) {
      return {
        projectId,
        totalRisks: 0,
        averageRiskScore: 0,
        highestRisk: null,
      };
    }

    const scores = risks.map(
      (risk) => risk.riskScore ?? 0,
    );

    const averageRiskScore =
      scores.reduce(
        (sum, score) => sum + score,
        0,
      ) / scores.length;

    const highestRisk = [...risks].sort(
      (a, b) =>
        (b.riskScore ?? 0) -
        (a.riskScore ?? 0),
    )[0];

    return {
      projectId,
      totalRisks: risks.length,
      averageRiskScore,
      highestRisk,
    };
  }

  private calculateRiskScore(
    probability?: number,
    impact?: number,
  ): number | undefined {
    if (
      probability === undefined ||
      impact === undefined
    ) {
      return undefined;
    }

    return Number(
      (probability * impact * 100).toFixed(2),
    );
  }
}