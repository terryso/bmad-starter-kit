import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  // Valid data must satisfy all password requirements:
  // - Min 8 characters
  // - At least one lowercase letter
  // - At least one uppercase letter
  // - At least one number
  const validData = {
    email: 'test@example.com',
    password: 'Pass1234',
    name: 'Test User',
  };

  async function validateDto(dto: RegisterDto) {
    const errors = await validate(dto);
    return errors.map((e) => ({
      field: e.property,
      constraints: e.constraints,
    }));
  }

  function createDto(data: Partial<RegisterDto> = {}) {
    return plainToInstance(RegisterDto, { ...validData, ...data });
  }

  describe('valid input', () => {
    it('should pass validation with valid data', async () => {
      const dto = createDto();
      const errors = await validateDto(dto);

      expect(errors).toHaveLength(0);
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

    it('should fail when email format is invalid', async () => {
      const dto = createDto({ email: 'invalid-email' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'email' && e.constraints?.isEmail)).toBe(true);
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

    it('should fail when password is less than 8 characters', async () => {
      const dto = createDto({ password: 'Pass12' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'password' && e.constraints?.minLength)).toBe(true);
    });

    it('should fail when password has no lowercase letter', async () => {
      const dto = createDto({ password: 'PASS1234' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should fail when password has no uppercase letter', async () => {
      const dto = createDto({ password: 'pass1234' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should fail when password has no number', async () => {
      const dto = createDto({ password: 'Password' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should pass when password meets all requirements', async () => {
      const dto = createDto({ password: 'Pass1234' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'password')).toHaveLength(0);
    });

    it('should pass when password is longer than 8 characters', async () => {
      const dto = createDto({ password: 'MySecurePass123' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'password')).toHaveLength(0);
    });
  });

  describe('name validation', () => {
    it('should fail when name is missing', async () => {
      const dto = createDto({ name: undefined as never });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should fail when name is empty string', async () => {
      const dto = createDto({ name: '' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'name' && e.constraints?.isNotEmpty)).toBe(true);
    });

    it('should pass when name has valid content', async () => {
      const dto = createDto({ name: '张三' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'name')).toHaveLength(0);
    });
  });

  describe('multiple validation errors', () => {
    it('should return multiple errors when multiple fields are invalid', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'invalid',
        password: 'pass',
        name: '',
      });
      const errors = await validateDto(dto);

      expect(errors.length).toBeGreaterThanOrEqual(3);
      expect(errors.some((e) => e.field === 'email')).toBe(true);
      expect(errors.some((e) => e.field === 'password')).toBe(true);
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });
  });
});
