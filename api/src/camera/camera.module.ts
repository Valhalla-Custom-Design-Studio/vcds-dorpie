// Dorpwag Camera Module — adds camera endpoints to existing Dorpwag API
// Import this into app.module.ts — does NOT touch existing modules
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Camera } from '../../../../vcds-watchlist-engine/src/camera/camera.entity';
import { WatchlistEntry } from '../../../../vcds-watchlist-engine/src/watchlist/watchlist.entity';
import { CameraAlert } from '../../../../vcds-watchlist-engine/src/alerts/alert.entity';
import { CameraService } from '../../../../vcds-watchlist-engine/src/camera/camera.service';
import { IsapiService } from '../../../../vcds-watchlist-engine/src/isapi/isapi.service';
import { AlertService } from '../../../../vcds-watchlist-engine/src/alerts/alert.service';
import { CameraController } from '../../../../vcds-watchlist-engine/src/camera/camera.controller';
import { AlertsController } from '../../../../vcds-watchlist-engine/src/alerts/alerts.controller';
import { EventsController } from '../../../../vcds-watchlist-engine/src/events/events.controller';
import { WatchlistController } from '../../../../vcds-watchlist-engine/src/watchlist/watchlist.controller';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Camera, WatchlistEntry, CameraAlert])],
  controllers: [CameraController, AlertsController, EventsController, WatchlistController],
  providers: [CameraService, IsapiService, AlertService],
  exports: [CameraService, IsapiService, AlertService],
})
export class DorpwagCameraModule {}

// HOW TO WIRE:
// In api/src/app.module.ts, add to imports array:
//   DorpwagCameraModule
// In TypeORM entities array, add:
//   Camera, WatchlistEntry, CameraAlert
// That's it. All existing Dorpwag code is untouched.
