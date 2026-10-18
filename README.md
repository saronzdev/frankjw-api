# Frank Joyería — API

REST API for [frankjoyeriacuba.com](https://frankjoyeriacuba.com), an e-commerce for jewelry. It serves the product catalog and the admin auth/CRUD operations used by the [app](../app) (separate repository).

## Tech stack

| Layer | Tool |
|---|---|
| Runtime | Node.js 20+ |
| HTTP | [Express](https://expressjs.com/) 5 |
| Database | [Turso](https://turso.tech/) / libSQL (`@libsql/client`) |
| Validation | [zod](https://zod.dev/) |
| Auth | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (JWT in an httpOnly cookie) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js) |
| Rate limiting | [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| Deploy | [Vercel](https://vercel.com/) (serverless) |

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in the values
pnpm dev               # http://localhost:3000
```

In development the database is a local SQLite file (`local.db`); in production it points to Turso.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default `3000`). |
| `NODE_ENV` | No | `production` enables Turso and secure cookies. |
| `JWT_SECRET` | Yes | Secret used to sign JWTs. Validated at startup. |
| `SALT_ROUNDS` | No | bcrypt cost (default `10`). |
| `TURSO_URL` | Prod | Turso database URL. Validated at startup in production. |
| `TURSO_TOKEN` | Prod | Turso auth token. Validated at startup in production. |
| `CORS_EXTRA_ORIGINS` | No | Comma-separated extra allowed origins (e.g. Vercel previews). |

## Endpoints

Base path: `/api/v1`. Responses use numeric error codes (see `ErrorCodes` in `src/utils/config.ts`).

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/` | — | Health check. |
| `POST` | `/auth/login` | — | Rate limited (10 / 15 min). Sets the `token` cookie. |
| `POST` | `/auth/logout` | — | Clears the `token` cookie. |
| `POST` | `/auth/register` | Admin | Creates a user. Optional `role` (`admin` \| `client`, default `client`). |
| `GET` | `/auth/me` | Cookie | Returns `{ email, role }`. |
| `GET` | `/products` | — | Full catalog. Returns `200 []` when empty. |
| `PATCH` | `/products/sales/:id` | — | Rate limited (30 / min). Atomically increments `sales`. |
| `POST` | `/products` | Admin | Creates a product. |
| `PUT` | `/products/:id` | Admin | Updates a product. |
| `DELETE` | `/products/:id` | Admin | Deletes a product. |

Admin routes require a valid JWT cookie and an `admin` role in the database.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server with watch and `.env` loading. |
| `pnpm build` | Compile TypeScript to `dist/`. |
| `pnpm lint` | ESLint. |
| `pnpm start` | Run the compiled server. |

## Vercel deployment

The project root **is** this repository. `vercel.json` rewrites every request to the serverless entry point:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/api" }] }
```

`api/index.ts` re-exports the Express app from `src/index.ts`:

```ts
import { app } from '../src/index'
export default app
```

`vercel-build` runs `tsc --noEmit` as a type-check gate before deploying.

## License

GPL-3.0
