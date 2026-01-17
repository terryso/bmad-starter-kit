// Mock for @anthropic-ai/claude-agent-sdk
export const query = jest.fn();

export class Claude {
  prompt() {
    return {
      user() {
        return {
          query: query,
        };
      },
    };
  }
}
