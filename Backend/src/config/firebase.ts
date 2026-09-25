import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage, BatchResponse } from 'firebase-admin/messaging';
import logger from '../common/logger/logger';
import { env } from './env';

let firebaseApp: App | null = null;
let messagingService: ReturnType<typeof getMessaging> | null = null;

try {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0] || null;
    if (firebaseApp) messagingService = getMessaging(firebaseApp);
  } else if (env.FIREBASE_SERVICE_ACCOUNT) {
    let serviceAccount: any;
    if (env.FIREBASE_SERVICE_ACCOUNT.trim().startsWith('{')) {
      serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      serviceAccount = require(env.FIREBASE_SERVICE_ACCOUNT);
    }
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    messagingService = getMessaging(firebaseApp);
    logger.info('[Firebase] FCM initialized successfully with service account');
  } else if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    messagingService = getMessaging(firebaseApp);
    logger.info('[Firebase] FCM initialized successfully with env credentials');
  } else {
    logger.info('[Firebase] FCM credentials not set. Push notifications will run in mock/log mode.');
  }
} catch (error) {
  logger.warn('[Firebase] Failed to initialize Firebase Admin SDK. Push notifications will run in mock mode.', error);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface PushNotificationResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

/**
 * Send multicast push notifications via Firebase Cloud Messaging (FCM)
 */
export async function sendPushNotification(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  const cleanTokens = [...new Set((tokens || []).filter((t) => typeof t === 'string' && t.trim().length > 0))];

  if (cleanTokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  if (!messagingService) {
    logger.info(`[Firebase Mock] Push dispatched to ${cleanTokens.length} device(s): "${payload.title}" - "${payload.body}"`);
    return {
      successCount: cleanTokens.length,
      failureCount: 0,
      invalidTokens: [],
    };
  }

  try {
    const stringifiedData: Record<string, string> = {};
    if (payload.data) {
      for (const [key, value] of Object.entries(payload.data)) {
        stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    }

    const message: MulticastMessage = {
      tokens: cleanTokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response: BatchResponse = await messagingService.sendEachForMulticast(message);
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        if (
          errCode === 'messaging/invalid-registration-token' ||
          errCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(cleanTokens[idx]);
        }
      }
    });

    logger.info(`[Firebase] Push notification sent: ${response.successCount} success, ${response.failureCount} failed`);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    logger.error('[Firebase] Error sending multicast push notification', error);
    return {
      successCount: 0,
      failureCount: cleanTokens.length,
      invalidTokens: [],
    };
  }
}
