import { jest } from '@jest/globals';

// Helper to create properly typed mock responses
export const createMockResponse = (data: any, ok: boolean = true, statusText: string = 'OK') => {
  return {
    ok,
    statusText,
    json: jest.fn().mockResolvedValue(data),
    headers: new Headers(),
    status: ok ? 200 : 400,
    statusText,
    type: 'basic' as ResponseType,
    url: '',
    redirected: false,
    body: null,
    bodyUsed: false,
    clone: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    text: jest.fn()
  } as Response;
};