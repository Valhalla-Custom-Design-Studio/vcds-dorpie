import { Module } from '@nestjs/common';
import { CameraModule } from '@vcds/watchlist-engine';
import { WatchlistModule } from '@vcds/watchlist-engine';
import { DorpwagCameraAlertsService } from './dorpwag-camera-alerts.service';

/**
 * Dorpwag camera feature module.
 * Import this into AppModule to add camera support to Dorpwag.
 * DOES NOT break or modify any existing Dorpwag code.
 */
@Module({
  imports: [CameraModule, WatchlistModule],
  providers: [DorpwagCameraAlertsService],
  exports: [DorpwagCameraAlertsService],
})
export class DorpwagCameraModule {}
