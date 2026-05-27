import { Injectable, Logger } from '@nestjs/common';

/**
 * Dorpie-specific: neighbourhood estate camera alerts.
 * Notifies estate residents (not same as ShadowSOS personal safety).
 */
@Injectable()
export class DorpieCameraAlertsService {
  private readonly logger = new Logger(DorpieCameraAlertsService.name);

  async notifyEstate(plate: string, cameraId: string, estateId: string) {
    this.logger.log(`Dorpie estate alert: plate=${plate} | estate=${estateId} | cam=${cameraId}`);
    // TODO: Push to all Dorpie users in estateId
  }
}
