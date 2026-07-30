import { createAuthClient } from 'better-auth/react';

// Same-origin by default — do not hardcode localhost:3000
export const authClient = createAuthClient();
