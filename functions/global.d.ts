export {};

declare global {
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(): Promise<T | null>;
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    run(): Promise<unknown>;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
  }

  type PagesFunction<Env = unknown> = (context: {
    request: Request & { json<T = unknown>(): Promise<T> };
    env: Env;
  }) => Response | Promise<Response>;
}
