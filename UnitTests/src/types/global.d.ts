import { jest } from '@jest/globals';

declare global {
  var fetch: jest.MockedFunction<typeof fetch>;
}

export {};