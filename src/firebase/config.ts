import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import firebaseConfigRaw from '@/firebase-applet-config.json';

export interface FirebaseAppletConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const firebaseConfig = firebaseConfigRaw as FirebaseAppletConfig;

let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let isFirebaseConfigured = false;
let firebaseConfigError: string | null = null;
const activeConfig: FirebaseAppletConfig = firebaseConfig;

try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  
  // CRITICAL: Initialize Firestore with the provisioned databaseId
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
    : getFirestore(appInstance);
    
  isFirebaseConfigured = true;
  firebaseConfigError = null;

  // Validate connection to Firestore as mandated by Firebase skill
  async function testConnection() {
    try {
      await getDocFromServer(doc(dbInstance, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      }
    }
  }
  testConnection();
} catch (err) {
  console.error('Error initializing Firebase:', err);
  firebaseConfigError = err instanceof Error ? err.message : String(err);
  isFirebaseConfigured = false;
  // Fallbacks if initialization throws
  appInstance = getApps().length > 0 ? getApp() : (null as unknown as FirebaseApp);
  authInstance = (appInstance ? getAuth(appInstance) : null) as unknown as Auth;
  dbInstance = (appInstance ? getFirestore(appInstance) : null) as unknown as Firestore;
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export { isFirebaseConfigured, firebaseConfigError, activeConfig };

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentAuth = authInstance;
  const currentUser = currentAuth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

