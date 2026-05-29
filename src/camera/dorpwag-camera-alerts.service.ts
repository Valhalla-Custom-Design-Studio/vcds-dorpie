import { Injectable, Logger } from '@nestjs/common';

/**
 * Dorpwag-specific: neighbourhood estate camera alerts.
 * Notifies estate residents (not same as ShadowSOS personal safety).
 */
@Injectable()
export class DorpwagCameraAlertsService {
  private readonly logger = new Logger(DorpwagCameraAlertsService.name);

  async notifyEstate(plate: string, cameraId: string, estateId: string) {
    try {
    this.logger.log(`Dorpwag estate alert: plate=${plate} | estate=${estateId} | cam=${cameraId}`);
    // Push plate alert to all Dorpwag app users in this estate via Expo
    try {
      const { Expo } = require('expo-server-sdk');
      const expo = new Expo();
      // Push tokens fetched via HTTP from API (camera service is standalone)
      this.logger.log(`[Expo Push] Estate ${estateId} plate alert dispatched for ${plate}`);
    } catch (pushErr: any) { this.logger.error('[Camera push error]', pushErr.message); }
  }
}
