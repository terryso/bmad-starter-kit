// Mock Prisma types for testing
declare module '@prisma/client' {
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

  export interface PrismaClient {
    user: {
      findUnique: any;
      findMany: any;
      findFirst: any;
      create: any;
      update: any;
      delete: any;
      count: any;
      aggregate: any;
    };
    $connect: () => Promise<void>;
    $disconnect: () => Promise<void>;
    $transaction: any;
  }

  export class PrismaClient {
    constructor(options?: any);
    user: {
      findUnique: any;
      findMany: any;
      findFirst: any;
      create: any;
      update: any;
      delete: any;
      count: any;
      aggregate: any;
    };
    $connect: () => Promise<void>;
    $disconnect: () => Promise<void>;
    $transaction: any;
  }
}
