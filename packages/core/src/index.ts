// @hmi/core — platform-agnostic shared logic for HMI (web + mobile).
//
// IMPORTANT: this is a *library* compiled into each app's client bundle. It is NOT
// a server and is NOT deployed anywhere. The api/* modules are client-side helpers
// that call existing backends (Supabase + the Java Growatt service on Render); they
// add no new hosted service.
export * from './env';
export * from './types';
export * from './utils';
export * from './constants';
export * from './validation';
export * from './api';
