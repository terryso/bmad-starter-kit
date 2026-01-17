module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.guard.ts',
    '!src/**/constants.ts',
  ],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    '^@bmad-starter-kit/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@bmad-starter-kit/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '@prisma/client': '<rootDir>/src/__mocks__/prisma-client.ts',
    '@anthropic-ai/claude-agent-sdk': '<rootDir>/src/__mocks__/@anthropic-ai/claude-agent-sdk.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@prisma/client|@anthropic-ai/claude-agent-sdk))',
  ],
  maxWorkers: 1, // Avoid os.availableParallelism() issues
};
