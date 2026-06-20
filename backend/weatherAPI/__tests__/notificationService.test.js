const { isExpoPushToken } = require('../services/notificationService');

describe('isExpoPushToken', () => {
  it('accepts ExponentPushToken[...] tokens', () => {
    expect(isExpoPushToken('ExponentPushToken[abcDEF123456]')).toBe(true);
  });

  it('accepts ExpoPushToken[...] tokens', () => {
    expect(isExpoPushToken('ExpoPushToken[abcDEF123456]')).toBe(true);
  });

  it('rejects strings that are not Expo push tokens', () => {
    expect(isExpoPushToken('random-string')).toBe(false);
    expect(isExpoPushToken('fcm:token')).toBe(false);
    expect(isExpoPushToken('')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isExpoPushToken(undefined)).toBe(false);
    expect(isExpoPushToken(null)).toBe(false);
    expect(isExpoPushToken(12345)).toBe(false);
    expect(isExpoPushToken({})).toBe(false);
  });
});
