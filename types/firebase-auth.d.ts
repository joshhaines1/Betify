import type { Persistence } from "firebase/auth";

// `getReactNativePersistence` exists at runtime (it's a real export of the
// React Native build of @firebase/auth) but isn't in the public type
// declarations for the "firebase/auth" entry point, which npm nests away
// from the top level. This augments the module's types to match reality.
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
