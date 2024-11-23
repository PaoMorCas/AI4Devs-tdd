import { validateEmail } from '../../application/validator';

describe('Validator', () => {
  test('validateEmail should accept valid email', () => {
    expect(() => validateEmail('test@example.com')).not.toThrow();
  });

  test('validateEmail should reject invalid email', () => {
    expect(() => validateEmail('invalid-email')).toThrow('Invalid email');
  });
});
