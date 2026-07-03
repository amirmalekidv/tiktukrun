import { looksLikeMobile, resolvePublicDisplayName } from './display-name';

describe('resolvePublicDisplayName', () => {
  it('prefers nickname over fullName', () => {
    expect(
      resolvePublicDisplayName({
        nickname: 'shadow_walker',
        fullName: 'علی رضایی',
        mobile: '09123456789',
      }),
    ).toBe('shadow_walker');
  });

  it('uses fullName when it is not a mobile number', () => {
    expect(
      resolvePublicDisplayName({
        fullName: 'علی رضایی',
        mobile: '09123456789',
      }),
    ).toBe('علی رضایی');
  });

  it('never exposes raw mobile as display name', () => {
    expect(
      resolvePublicDisplayName({
        fullName: '09123456789',
        mobile: '09123456789',
      }),
    ).toBe('کاربر');
  });

  it('falls back when no public name is set', () => {
    expect(resolvePublicDisplayName({ mobile: '09123456789' })).toBe('کاربر');
  });
});

describe('looksLikeMobile', () => {
  it('detects Iranian mobile numbers', () => {
    expect(looksLikeMobile('09123456789')).toBe(true);
    expect(looksLikeMobile('09 123 456 789')).toBe(true);
    expect(looksLikeMobile('علی')).toBe(false);
  });
});
