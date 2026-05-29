# Dorpie — Camera Integration

## How to add camera support (additive, zero breaking changes)

### Step 1: Add to app.module.ts
```typescript
// In src/app.module.ts — ADD these imports:
import { DorpieCameraModule } from './camera/dorpie-camera.module';
import { Camera } from '@vcds/watchlist-engine';
import { WatchlistEntry } from '@vcds/watchlist-engine';

// In TypeOrmModule.forRoot entities array, ADD:
entities: [...existingEntities, Camera, WatchlistEntry],

// In @Module imports array, ADD:
imports: [...existingImports, DorpieCameraModule],
```

### Step 2: Flutter — add camera screen to Dorpie navigation
```dart
// In your estate/community settings screen:
ListTile(
  leading: Icon(Icons.videocam),
  title: Text('Estate Cameras'),
  onTap: () => Navigator.push(context, MaterialPageRoute(
    builder: (_) => CameraManagementScreen(
      appContext: 'dorpie',
      accentColor: Color(0xFF2196F3), // Dorpie blue
      title: 'Estate Cameras',
    ),
  )),
)
```

### Apps using camera module
| App | appContext | accentColor |
|-----|-----------|-------------|
| ShadowSOS AI | shadowsos | 0xFFFF3B30 |
| Dorpie | dorpie | 0xFF2196F3 |
| FarmWatch AI | farmwatch | 0xFF4CAF50 |
| Oppas | oppas | 0xFFFF9800 |
