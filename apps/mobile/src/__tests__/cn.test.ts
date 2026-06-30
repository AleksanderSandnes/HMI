import { cn } from '../lib/cn';

describe('cn', () => {
  it('joins truthy class strings and drops falsy ones', () => {
    expect(cn('a', 'b')).toBe('a b');
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
    const active = true;
    const disabled = false;
    expect(cn('base', active && 'on', disabled && 'off')).toBe('base on');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
