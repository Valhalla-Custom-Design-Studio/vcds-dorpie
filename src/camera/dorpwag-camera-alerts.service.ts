import { Injectable, Logger } from '@nestjs/common';

/**
 * Dorpwag-specific: neighbourhood estate camera alerts.
 * Notifies estate residents (not same as ShadowSOS personal safety).
 */
@Injectable()
export class DorpwagCameraAlertsService {
  private readonly logger = new Logger(DorpwagCameraAlertsService.name);

  async notifyEstate(plate: string, cameraId: string, estateId: string) {
    this.logger.log(`Dorpwag estate alert: plate=${plate} | estate=${estateId} | cam=${cameraId}`);
    // TODO: Push to all Dorpwag users in estateId
  }
}
