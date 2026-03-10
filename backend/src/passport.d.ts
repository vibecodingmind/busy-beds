declare module 'passport' {
  const passport: {
    initialize(): import('express').RequestHandler;
    use(nameOrStrategy: string | object, strategy?: unknown): void;
    authenticate(strategy: string, options?: object, callback?: (err: Error | null, user?: unknown) => void): import('express').RequestHandler;
  };
  export = passport;
}
declare module 'passport-google-oauth20' {
  export class Strategy {
    constructor(
      options: object,
      verify: (
        _accessToken: string,
        _refreshToken: string,
        profile: { emails?: { value: string }[]; displayName?: string; name?: { givenName?: string } },
        done: (err: Error | null, user?: object) => void
      ) => void
    );
  }
}
declare module 'passport-facebook' {
  export class Strategy {
    constructor(
      options: object,
      verify: (
        _accessToken: string,
        _refreshToken: string,
        profile: { emails?: { value: string }[]; displayName?: string; name?: { givenName?: string } },
        done: (err: Error | null, user?: object) => void
      ) => void
    );
  }
}
