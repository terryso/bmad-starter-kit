import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  const validData = {
    email: 'test@example.com',
    password: 'password123',
  };

  async function validateDto(dto: LoginDto) {
    const errors = await validate(dto);
    return errors.map((e) => ({
      field: e.property,
      constraints: e.constraints,
    }));
  }

  function createDto(data: Partial<LoginDto> = {}) {
    return plainToInstance(LoginDto, { ...validData, ...data });
  }

  describe('valid input', () => {
    it('should pass validation with valid data', async () => {
      const dto = createDto();
      const errors = await validateDto(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept email with various valid formats', async () => {
      const validEmails = [
        'user@example.com',
        'test.user+tag@example.co.uk',
        'firstname-lastname@subdomain.example.com',
      ];

      for (const email of validEmails) {
        const dto = createDto({ email });
        const errors = await validateDto(dto);
        expect(errors.filter((e) => e.field === 'email')).toHaveLength(0);
      }
    });

    it('should accept passwords with special characters', async () => {
      const dto = createDto({ password: 'P@ssw0rd!#$%' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'password')).toHaveLength(0);
    });
  });

  describe('email validation', () => {
    it('should fail when email is missing', async () => {
      const dto = createDto({ email: undefined as never });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should fail when email is empty string', async () => {
      const dto = createDto({ email: '' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'email' && e.constraints?.isNotEmpty)).toBe(true);
    });

    it('should fail when email is only whitespace', async () => {
      const dto = createDto({ email: '   ' });
      const errors = await validateDto(dto);

      // Class-validator strips whitespace, so empty email fails IsNotEmpty
      expect(errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should fail when email format is invalid', async () => {
      const invalidEmails = [
        'invalid-email',
        'invalidexample.com',
        'test@',
        '@example.com',
        'test space@example.com',
      ];

      for (const email of invalidEmails) {
        const dto = createDto({ email });
        const errors = await validateDto(dto);
        expect(errors.some((e) => e.field === 'email' && e.constraints?.isEmail)).toBe(true);
      }
    });

    it('should fail when email has no @ symbol', async () => {
      const dto = createDto({ email: 'invalidexample.com' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'email' && e.constraints?.isEmail)).toBe(true);
    });

    it('should fail when email has no domain', async () => {
      const dto = createDto({ email: 'test@' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'email' && e.constraints?.isEmail)).toBe(true);
    });
  });

  describe('password validation', () => {
    it('should fail when password is missing', async () => {
      const dto = createDto({ password: undefined as never });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should fail when password is empty string', async () => {
      const dto = createDto({ password: '' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'password' && e.constraints?.isNotEmpty)).toBe(true);
    });

    it('should fail when password is not a string', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 12345678 as never,
      });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'password' && e.constraints?.isString)).toBe(true);
    });

    it('should accept any non-empty string password', async () => {
      // LoginDto doesn't have password complexity requirements
      // (that's handled by the frontend/user requirements)
      const dto = createDto({ password: 'a' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'password')).toHaveLength(0);
    });
  });

  describe('multiple validation errors', () => {
    it('should return errors for both email and password when both are invalid', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalid',
        password: '',
      });
      const errors = await validateDto(dto);

      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(errors.some((e) => e.field === 'email')).toBe(true);
      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should return all validation errors with correct messages', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'not-an-email',
        password: '',
      });
      const errors = await validateDto(dto);

      const emailError = errors.find((e) => e.field === 'email');
      expect(emailError?.constraints?.isEmail).toBeDefined();

      const passwordError = errors.find((e) => e.field === 'password');
      expect(passwordError?.constraints?.isNotEmpty).toBeDefined();
    });
  });
});
