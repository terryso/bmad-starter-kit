import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UsersQueryDto } from './users-query.dto';
import { Role } from '@prisma/client';

describe('UsersQueryDto', () => {
  const validData = {
    page: 1,
    pageSize: 20,
    search: 'test@example.com',
    role: Role.USER,
  };

  async function validateDto(dto: UsersQueryDto) {
    const errors = await validate(dto);
    return errors.map((e) => ({
      field: e.property,
      constraints: e.constraints,
    }));
  }

  function createDto(data: Partial<UsersQueryDto> = {}) {
    return plainToInstance(UsersQueryDto, { ...validData, ...data });
  }

  describe('valid input', () => {
    it('should pass validation with all valid fields', async () => {
      const dto = createDto();
      const errors = await validateDto(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only required fields (all optional)', async () => {
      const dto = plainToInstance(UsersQueryDto, {});
      const errors = await validateDto(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.pageSize).toBe(20);
    });

    it('should use default values when fields are not provided', async () => {
      const dto = plainToInstance(UsersQueryDto, {});
      const errors = await validateDto(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.pageSize).toBe(20);
    });
  });

  describe('page validation', () => {
    it('should pass with page = 1', async () => {
      const dto = createDto({ page: 1 });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'page')).toHaveLength(0);
    });

    it('should pass with large page number', async () => {
      const dto = createDto({ page: 1000 });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'page')).toHaveLength(0);
    });

    it('should fail when page is less than 1', async () => {
      const dto = createDto({ page: 0 });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'page')).toBe(true);
    });

    it('should fail when page is negative', async () => {
      const dto = createDto({ page: -1 });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'page')).toBe(true);
    });

    it('should convert string number to integer', async () => {
      const dto = plainToInstance(UsersQueryDto, { page: '5' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'page')).toHaveLength(0);
      expect(dto.page).toBe(5);
    });

    it('should fail with invalid string', async () => {
      const dto = plainToInstance(UsersQueryDto, { page: 'invalid' });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'page')).toBe(true);
    });
  });

  describe('pageSize validation', () => {
    it('should pass with pageSize = 1', async () => {
      const dto = createDto({ pageSize: 1 });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'pageSize')).toHaveLength(0);
    });

    it('should pass with pageSize = 100 (maximum)', async () => {
      const dto = createDto({ pageSize: 100 });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'pageSize')).toHaveLength(0);
    });

    it('should fail when pageSize is less than 1', async () => {
      const dto = createDto({ pageSize: 0 });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'pageSize')).toBe(true);
    });

    it('should fail when pageSize is greater than 100', async () => {
      const dto = createDto({ pageSize: 101 });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'pageSize')).toBe(true);
    });

    it('should fail when pageSize is negative', async () => {
      const dto = createDto({ pageSize: -1 });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'pageSize')).toBe(true);
    });

    it('should convert string number to integer', async () => {
      const dto = plainToInstance(UsersQueryDto, { pageSize: '50' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'pageSize')).toHaveLength(0);
      expect(dto.pageSize).toBe(50);
    });
  });

  describe('search validation', () => {
    it('should pass with valid email search', async () => {
      const dto = createDto({ search: 'user@example.com' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'search')).toHaveLength(0);
    });

    it('should pass with partial email search', async () => {
      const dto = createDto({ search: 'admin' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'search')).toHaveLength(0);
    });

    it('should pass when search is not provided', async () => {
      const dto = plainToInstance(UsersQueryDto, {});
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'search')).toHaveLength(0);
    });

    it('should fail when search is not a string', async () => {
      const dto = plainToInstance(UsersQueryDto, { search: 123 as any });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'search' && e.constraints?.isString)).toBe(true);
    });

    it('should pass with empty string search', async () => {
      const dto = createDto({ search: '' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'search')).toHaveLength(0);
    });
  });

  describe('role validation', () => {
    it('should pass with role = USER', async () => {
      const dto = createDto({ role: Role.USER });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'role')).toHaveLength(0);
    });

    it('should pass with role = ADMIN', async () => {
      const dto = createDto({ role: Role.ADMIN });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'role')).toHaveLength(0);
    });

    it('should pass when role is not provided', async () => {
      const dto = plainToInstance(UsersQueryDto, {});
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'role')).toHaveLength(0);
    });

    it('should fail with invalid role string', async () => {
      const dto = plainToInstance(UsersQueryDto, { role: 'INVALID' as any });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'role')).toBe(true);
    });

    it('should fail with invalid role type', async () => {
      const dto = plainToInstance(UsersQueryDto, { role: 123 as any });
      const errors = await validateDto(dto);

      expect(errors.some((e) => e.field === 'role')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle all optional fields omitted', async () => {
      const dto = plainToInstance(UsersQueryDto, {});
      const errors = await validateDto(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.pageSize).toBe(20);
    });

    it('should handle search with special characters', async () => {
      const dto = createDto({ search: 'user+tag@example.com' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'search')).toHaveLength(0);
    });

    it('should handle search with Chinese characters', async () => {
      const dto = createDto({ search: '用户' });
      const errors = await validateDto(dto);

      expect(errors.filter((e) => e.field === 'search')).toHaveLength(0);
    });
  });
});
