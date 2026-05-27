# Dorpie — Camera Integration Guide

## What was added
- `lib/features/cameras/camera_module.dart` — Flutter export module
- `api/src/camera/camera.module.ts` — NestJS additive module

## Wiring into existing app.module.ts

\`\`\`typescript
// Add to imports in app.module.ts
import { DorpieCameraModule } from './camera/camera.module';
import { Camera } from '../../vcds-watchlist-engine/src/camera/camera.entity';
import { WatchlistEntry } from '../../vcds-watchlist-engine/src/watchlist/watchlist.entity';
import { CameraAlert } from '../../vcds-watchlist-engine/src/alerts/alert.entity';

// In TypeORM entities: [...existing, Camera, WatchlistEntry, CameraAlert]
// In imports: [...existing, DorpieCameraModule]
\`\`\`

## Flutter — Add to ProviderScope overrides in main.dart

\`\`\`dart
cameraApiServiceProvider.overrideWithValue(
  CameraApiService(baseUrl: yourApiUrl, appContext: 'dorpie'),
)
\`\`\`

## Add tab to existing nav

\`\`\`dart
CameraManagementScreen(accentColor: Color(0xFF1565C0), title: 'Dorpie Cameras')
CameraAlertsScreen(accentColor: Color(0xFF1565C0))
\`\`\`

## appContext isolation
All Dorpie camera data is tagged `appContext: 'dorpie'` — completely isolated from ShadowSOS, FarmWatch, Oppas.
