import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * CameraModule — Dorpwag™ community LPR integration.
 * Connects to vcds-watchlist-engine microservice for:
 * - Hikvision LPR plate scanning at neighbourhood entry points
 * - Community watchlist plate matching
 * - Phantom Keyword™ movement pattern analysis
 * - Movement DNA™ anomaly detection
 * - Real-time alerts to neighbourhood watch members
 */
@Module({
  imports: [
    HttpModule.register({
      baseURL: process.env.WATCHLIST_ENGINE_URL ?? 'http://localhost:3010',
      timeout: 8000,
      headers: {
        'x-service-key': process.env.WATCHLIST_ENGINE_SECRET ?? '',
      },
    }),
  ],
  controllers: [CameraController],
  providers: [CameraService, PrismaService],
  exports: [CameraService],
})
export class CameraModule {}
