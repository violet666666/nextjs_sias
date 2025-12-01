import { hashPassword, comparePassword } from './auth';

describe('Password Hashing', () => {
  it('should hash and compare password correctly', async () => {
    const password = 'Password123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);
    const isNotMatch = await comparePassword('WrongPassword', hash);
    expect(isNotMatch).toBe(false);
  });
}); 