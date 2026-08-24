import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { RiskEngineService } from './risk-engine.service.js';
import { CreateRiskDto } from './dto/create-risk.dto.js';

@Controller('ai/risk-engine')
export class RiskEngineController {
  constructor(
    private readonly riskEngineService: RiskEngineService,
  ) {}

  @Get('project/:projectId')
  getProjectRisks(
    @Param('projectId') projectId: string,
  ) {
    return this.riskEngineService.getProjectRisks(
      projectId,
    );
  }

  @Get('project/:projectId/summary')
  getProjectRiskSummary(
    @Param('projectId') projectId: string,
  ) {
    return this.riskEngineService.calculateProjectRisk(
      projectId,
    );
  }

  @Get(':id')
  getRisk(@Param('id') id: string) {
    return this.riskEngineService.getRisk(id);
  }

  @Post()
  createRisk(@Body() dto: CreateRiskDto) {
    return this.riskEngineService.createRisk(dto);
  }

  @Patch(':id/status')
updateRiskStatus(
  @Param('id') id: string,
  @Body('status')
  status:
    | 'OPEN'
    | 'ACKNOWLEDGED'
    | 'MITIGATED'
    | 'RESOLVED'
    | 'IGNORED',
) {
  return this.riskEngineService.updateRiskStatus(
    id,
    status,
  );
}

  @Delete(':id')
  deleteRisk(@Param('id') id: string) {
    return this.riskEngineService.deleteRisk(id);
  }
}
