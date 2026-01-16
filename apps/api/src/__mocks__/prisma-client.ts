// Mock Prisma Client for Jest tests
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  createdAt: Date;
}

const mockUser = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
};

export class PrismaClient {
  user = mockUser;

  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $transaction = jest.fn();
}

export const Prisma = {
  User: {},
  Role,
};
