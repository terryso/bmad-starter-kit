import { z } from 'zod';

/**
 * Zod schema for validating GitHub project information
 * returned by the Anthropic Claude API
 */
export const GitHubProjectResponseSchema = z.object({
  repositoryName: z.string().min(1, 'Repository name is required'),
  description: z.string().nullable().transform(val => val || 'No description available'),
  owner: z.string().min(1, 'Owner is required'),
  stars: z.number().int().min(0, 'Stars must be a non-negative integer'),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  updatedAt: z.string().nullable().transform(val => val || new Date().toISOString()),
  homepageUrl: z
    .string()
    .url('Invalid URL format for homepageUrl')
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  license: z
    .string()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  category: z.enum(['WEB_APP', 'CLI', 'LIBRARY', 'API', 'MOBILE', 'OTHER'], {
    errorMap: () => ({ message: 'Category must be one of: WEB_APP, CLI, LIBRARY, API, MOBILE, OTHER' }),
  }),
  suggestedTags: z.array(z.string()).default([]),
});

export type GitHubProjectResponse = z.infer<typeof GitHubProjectResponseSchema>;
