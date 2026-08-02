// Shared mutable auth object — `initializeAuth`/`getAuth` both return this same
// reference so tests can drive login state with `FIREBASE_AUTH.currentUser = ...`.
export const mockAuthState: { currentUser: any } = { currentUser: null };

export const initializeAuth = jest.fn(() => mockAuthState);
export const getAuth = jest.fn(() => mockAuthState);
export const getReactNativePersistence = jest.fn(() => undefined);
export const connectAuthEmulator = jest.fn();

export const onAuthStateChanged = jest.fn((auth: any, callback: (user: any) => void) => {
  callback(auth?.currentUser ?? null);
  return jest.fn();
});

export const signOut = jest.fn(() => Promise.resolve());
export const signInWithEmailAndPassword = jest.fn();
export const createUserWithEmailAndPassword = jest.fn();
export const updateProfile = jest.fn(() => Promise.resolve());
export const signInWithCredential = jest.fn();
export const fetchSignInMethodsForEmail = jest.fn(() => Promise.resolve([]));
export const getAdditionalUserInfo = jest.fn(() => ({ isNewUser: false }));

export const GoogleAuthProvider = {
  credential: jest.fn((idToken: string) => ({ providerId: "google.com", idToken })),
};

export class OAuthProvider {
  providerId: string;
  constructor(providerId: string) {
    this.providerId = providerId;
  }
  credential(options: Record<string, any>) {
    return { providerId: this.providerId, ...options };
  }
}
