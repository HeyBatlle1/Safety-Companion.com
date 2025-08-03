import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      session: {
        userId?: string;
        userRole?: string;
      } & session.Session;
    }
  }
}