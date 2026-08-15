import { customType } from 'drizzle-orm/pg-core';

/**
 * Custom pgvector type for Drizzle ORM
 */
export const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    const dimensions = config?.dimensions ?? 1536;
    return `vector(${dimensions})`;
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value
          .replace(/[\[\]]/g, '')
          .split(',')
          .map((v) => parseFloat(v.trim()));
      }
    }
    return value;
  }
});
