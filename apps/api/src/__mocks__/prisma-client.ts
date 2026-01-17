// Mock Prisma Client for Jest tests
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum ProjectStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ProjectCategory {
  WEB_APP = 'WEB_APP',
  CLI = 'CLI',
  LIBRARY = 'LIBRARY',
  API = 'API',
  MOBILE = 'MOBILE',
  OTHER = 'OTHER',
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  createdAt: Date;
}

export interface Project {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  topics: string[];
  githubUpdatedAt: Date | null;
  homepageUrl: string | null;
  license: string | null;
  githubUrl: string;
  category: ProjectCategory;
  suggestedTags: string[];
  screenshotUrl: string | null;
  status: ProjectStatus;
  submittedBy: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
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

const mockProject = {
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
  project = mockProject;

  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $transaction = jest.fn();
}

export const Prisma = {
  User: {},
  Project: {},
  Role,
  ProjectStatus,
  ProjectCategory,
};
