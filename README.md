# Frank Joyería — REST API

REST API for [frankjoyeriacuba.com](https://frankjoyeriacuba.com), an e-commerce for jewelry. It serves the public product catalog and the admin authentication and CRUD operations used by the [frontend](https://frankjw.vercel.app) (separate repository).

![ci](https://github.com/saronzdev/frankjw-api/actions/workflows/ci.yml/badge.svg?branch=main)
![license](https://img.shields.io/badge/license-GPL--3.0-blue)
![typescript](https://img.shields.io/badge/TypeScript-strict-blue)
![node](https://img.shields.io/badge/Node.js-20%2B-blue)

## Security

The convenience API surface is public, but the design assumes untrusted input everywhere:

- **Authentication** — JWT signed with HS256, delivered in an `httpOnly` cookie (`Secure`, `SameSite=None` in production). Verification re-reads the user row on every request, so role changes take effect immediately.
- **Token revocation** — each token carries a `pwd` claim (ms timestamp). Password changes write `passwordChangedAt` on the user row; any token issued before that moment is rejected, which kills stolen cookies across devices.
- **Registration is admin-only** — new users are created by an authenticated admin via `POST /auth/register`.
- **Anti-enumeration login** — unknown emails and wrong passwords return the same `400 {code: 1002}` after a `bcrypt.compare` against a dummy hash, so response shape and timing expose nothing.
- **Distributed rate limiting** — `login` (10 / 15 min), `register` (5 / h) and `sales` (30 / min) run against Upstash Redis (sliding window, per-IP); fails open and falls back to an in-memory store when Upstash is not configured.
- **Validation at the edge** — every admin payload is parsed with [zod](https://zod.dev/) before touching the database; TypeScript types are derived from the schemas.
- **Strict CORS** — exact origin whitelist (production domains + `CORS_EXTRA_ORIGINS`), `credentials: true`.
- **Fail-fast environment** — required variables are asserted at startup (`src/utils/env.ts`) instead of failing randomly at request time.
- **Server-side image storage** — product image upload/delete happens only here, authorized by the JWT cookie, MIME allowlist (jpg/png/webp/gif/avif), 2 MB cap and a secret storage key kept exclusively in server env. The browser bundle never receives storage credentials; in dev without `SUPABASE_URL` the endpoints return `503` and the client surfaces the notice without touching the production bucket. Storage talks through `@supabase/supabase-js`, so both new secret keys (`sb_secret_…`, sent on the `apikey` header) and the legacy `service_role` JWT are supported.

## Tech stack

| Layer | Tool |
|---|---|
| Runtime | Node.js 20+ |
| HTTP | [Express](https://expressjs.com/) 5 |
| Database | [Turso](https://turso.tech/) / libSQL (`@libsql/client`) |
| Validation | [zod](https://zod.dev/) |
| Auth | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js) |
| Rate limiting | [@upstash/ratelimit](https://github.com/upstash/ratelimit) via Upstash Redis, in-memory fallback |
| Testing | [Vitest](https://vitest.dev) + [supertest](https://github.com/forwardemail/supertest) |
| Deploy | [Vercel](https://vercel.com/) (serverless) |

## Project structure

```
├── api/index.ts                  # Vercel serverless entry point
├── src/
│   ├── index.ts                  # Express app assembly, CORS, SSE, DB init middleware
│   ├── controllers/products/
│   │   ├── admin.ts              # create / update / delete products
│   │   └── client.ts             # public catalog + atomic sales counter
│   ├── middlewares/
│   │   ├── auth.ts               # JWT verification, revocation check, role guard
│   │   └── rateLimit.ts          # Upstash Redis limiters
│   ├── routers/
│   │   ├── auth.ts               # login / logout / register / me / password
│   │   ├── products.ts           # catalog + admin CRUD routes
│   │   └── uploads.ts            # admin image upload/delete (raw body, MIME allowlist)
│   ├── utils/
│   │   ├── config.ts             # error codes, config, CORS options, Turso client
│   │   ├── storage.ts            # Supabase Storage via @supabase/supabase-js (secret key server-side)
│   │   ├── database.ts           # schema init + tracked migration runner
│   │   ├── migrations.ts         # idempotent data migrations
│   │   ├── schemas.ts            # zod schemas + derived types
│   │   ├── env.ts                # fail-fast env assertions
│   │   └── validations.ts        # user / product existence queries
│   └── types.d.ts                # runtime types
├── tests/                        # integration tests (isolated in-memory Turso)
├── .env.example
└── vercel.json
```

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in the values
pnpm dev               # http://localhost:3000
```

In development the database is a local SQLite file (`local.db`); in production it points to a Turso remote. Schema creation and migrations run automatically on the first request.

## Testing

```bash
pnpm test       # run once
pnpm test:watch # watch mode
```

Each test file gets an isolated in-memory Turso database (best slices of full HTTP traffic through the real Express app), so nothing external must be mocked and no shared state can leak between suites. The suite covers auth flows, product CRUD validation, error contracts, rate limiting, upload authorization/validation and password-change token revocation; external Supabase calls are stubbed via global `fetch`.

## Endpoints

Base path: `/api/v1`. Error responses carry a numeric `code`:

| Group | Codes | Meaning |
|---|---|---|
| Auth | `1001`–`1007` | token expired, invalid credentials, access denied, user not found, wrong password, auth error, too many requests |
| Products | `1101`–`1103` | product not found, product id already exists, invalid product id |
| Validation | `2001`–`2004` | invalid mail, required field missing, already exists, invalid id |
| Server | `3001`–`3002` | database error, upload error |

### Routes

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/` | — | Health check. |
| `POST` | `/auth/login` | — | Rate limited (10 / 15 min). Sets the `token` cookie. |
| `POST` | `/auth/logout` | — | Clears the `token` cookie. |
| `POST` | `/auth/register` | Admin | Creates a user. Optional `role` (`admin` \| `client`, default `client`). |
| `GET` | `/auth/me` | Cookie | Returns `{ email, role }`. |
| `PATCH` | `/auth/password` | Cookie | Changes password. Requires `currentPassword` and `newPassword` (min 8 chars). Revokes tokens issued before the change. |
| `GET` | `/products` | — | Full catalog. Returns `200 []` when empty, tolerant of corrupt rows. |
| `PATCH` | `/products/sales/:id` | — | Rate limited (30 / min). Atomically increments `sales`. |
| `POST` | `/products` | Admin | Creates a product (zod-validated: numeric coercion incl. decimal commas, karats array, offer price rules). |
| `PUT` | `/products/:id` | Admin | Updates a product. |
| `DELETE` | `/products/:id` | Admin | Deletes a product. |
| `POST` | `/uploads` | Admin | Raw image upload (≤2 MB, MIME allowlist) to the `pictures` bucket. Returns `{url}` — the public URL to store in the product row. |
| `DELETE` | `/uploads?url=…` | Admin | Deletes an image by public URL (bucket- and prefix-restricted). |

### Examples

```bash
# Wrong password — same response as unknown email (anti-enumeration)
curl -i -X POST https://<host>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"wrong"}'
# HTTP 400 {"code":1002}

# Public catalog (weight accepts "1,5" and stores 1.5)
curl https://<host>/api/v1/products
# HTTP 200 [{"id":1,"productId":"anillo-oro","weight":1.5,"karats":[24], ...}]
```

Admin routes require a valid JWT cookie and an `admin` role in the database.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default `3000`). |
| `NODE_ENV` | No | `production` enables Turso and secure cookies. |
| `JWT_SECRET` | Yes | Secret used to sign JWTs. Validated at startup. |
| `SALT_ROUNDS` | No | bcrypt cost (default `10`). |
| `TURSO_URL` | Prod | Turso URL for production. In non-production only embedded URLs are honored (`:memory:` for the test suite, `file:` paths); a remote `libsql://` value is ignored and local `file:./local.db` is used instead. |
| `TURSO_TOKEN` | Prod | Turso auth token. Validated at startup in production. |
| `SUPABASE_URL` | Prod | Supabase project URL (Project Settings → API). Required in production; optional in dev (upload endpoints return `503` without it). |
| `SUPABASE_SERVICE_KEY` | Prod | Supabase secret key (`sb_secret_…`, recommended) or legacy `service_role` JWT. Server-only; required in production, optional in dev. |
| `CORS_EXTRA_ORIGINS` | No | Comma-separated extra allowed origins (e.g. Vercel previews). |
| `UPSTASH_REDIS_REST_URL` | No | Upstash REST URL. Enables distributed rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash REST token. Both must be set for distributed limiting; falls back to in-memory otherwise. |

## Deployment

The project deploys to [Vercel](https://vercel.com/) serverless:

- `vercel.json` rewrites every request to the serverless entry point:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/api" }] }
```

- `api/index.ts` re-exports the Express app built in `src/index.ts`.
- The build step (`vercel-build`) runs `tsc --noEmit` as a type-check gate before deploying.
- CI runs `pnpm lint`, `pnpm tsc --noEmit` and the test suite on every push to `main` and on pull requests.

## License

Released under the [GPL-3.0 License](./LICENSE).
