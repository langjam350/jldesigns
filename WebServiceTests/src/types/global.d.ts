declare global {
  var testHelpers: {
    generateRandomId: () => string;
    generateTestPost: (overrides?: any) => any;
    cleanupTestData: (postIds: string[]) => Promise<void>;
  };
}

export {};