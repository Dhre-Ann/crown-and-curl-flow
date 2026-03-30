Cross-Phase Rules
Apply these to every phase without being reminded:

1. Never break existing functionality. Each phase builds on the last. Run a quick smoke test of previous features after every phase.
2. Always scope data to the shop. Every query that touches styles, appointments, reviews, availability, or work hours must filter by shopId. Never return data across shops.
3. Use environment variables for all secrets, API keys, and database URLs. Never hardcode credentials.
4. All protected routes use middleware. requireAuth, requireShopAdmin, or requireSuperAdmin — never skip these.
5. Consistent API response shape:

json   { "success": true, "data": { ... } }
   { "success": false, "error": "Descriptive message here" }

6. Never trust the client for pricing. Always recalculate totalPrice and depositAmount on the server using database values — never accept them raw from the request body.
7. Double-check availability on the server. Before confirming any appointment, re-validate the time slot server-side regardless of what the frontend says.
8. Migration files: Each phase that modifies the schema must run npx prisma migrate dev --name phase-N-description. Never manually edit the database.
9. Do not over-engineer. Build exactly what the phase specifies. No extra features, no speculative abstractions, no premature optimization.
10. Comment non-obvious logic. Middleware, webhook handlers, availability calculation, and price logic must have inline comments explaining the why.
