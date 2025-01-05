export type FromEnum<T> = T extends Record<string, string> ? T[keyof T] : never;
