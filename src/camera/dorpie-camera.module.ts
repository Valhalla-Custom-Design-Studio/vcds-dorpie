import { Module } from '@nestjs/common';
import { CameraModule } from '@vcds/watchlist-engine';
import { WatchlistModule } from '@vcds/watchlist-engine';
import { DorpieCameraAlertsService } from './dorpie-camera-alerts.service';

/**
 * Dorpie camera feature module.
 * Import this into AppModule to add camera support to Dorpie.
 * DOES NOT break or modify any existing Dorpie code.
 */
@Module({
  imports: [CameraModule, WatchlistModule],
  providers: [DorpieCameraAlertsService],
  exports: [DorpieCameraAlertsService],
})
export class DorpieCameraModule {}
