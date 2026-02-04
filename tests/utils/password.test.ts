import { hashPassword, comparePassword } from '../../src/utils/password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });
});
