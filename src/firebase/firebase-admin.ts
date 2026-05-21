// Firebase Admin Init — KAN-36
// Private key loaded from environment variable, NOT from committed file

import * as admin from 'firebase-admin';

let app: admin.app.App;

export function getFirebaseAdmin(): admin.app.App {
  if (!app) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}'
    );
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return app;
}

// ⚠️ ACTION REQUIRED (KAN-36):
// 1. Rotate Firebase service account key in Firebase Console
// 2. Paste new JSON as FIREBASE_SERVICE_ACCOUNT_JSON in Abacus secrets
// 3. Delete firebase-service-account.json and fcm-service-account.json from repo
