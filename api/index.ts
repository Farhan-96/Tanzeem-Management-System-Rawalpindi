import app from '../server/app';

/**
 * Vercel serverless entry — export the Express app (do not call listen()).
 * Local development still uses `npm run server` → server/index.ts.
 */
export default app;
