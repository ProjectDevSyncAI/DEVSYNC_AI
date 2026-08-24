import { Module } from '@nestjs/common';

import { RiskEngineController } from './risk-engine.controller.js';
import { RiskEngineService } from './risk-engine.service.js';

@Module({
  controllers: [
    RiskEngineController,
  ],

  providers: [
    RiskEngineService,
  ],

  exports: [
    RiskEngineService,
  ],
})
export class RiskEngineModule {}