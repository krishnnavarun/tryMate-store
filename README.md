# tryMate Store

AI-powered clothing store: React (Vite) + Express + MongoDB, plain JavaScript.
AI features (measurements, skin tone, size recommendation, try-on) come from the separate
**tryMate-Ai** service, which Express calls. The browser never calls it directly.
The full spec is in [PROJECT_SPEC.md](PROJECT_SPEC.md).

> **Status: Phase 2 (auth + cart + orders) done.** Shop and product pages run on 14 seeded
> men's shirts / t-shirts / polos; you can register, log in, fill a cart and place (demo) orders.
> AI features start in Phase 3.

---

## Requirements

- Node.js **20.19+** (developed on Node 24)
- MongoDB running locally on `mongodb://localhost:27017` (or a MongoDB Atlas URI)

## Setup

```bash
# 1. Install everything. client/ and server/ each get their own node_modules + package-lock.json;
#    the root only has `concurrently` (to run both apps at once).
npm install              # root: concurrently
npm run install:all      # root + server/ + client/ in one go
#    (or by hand: cd server && npm install, then cd client && npm install)

# 2. Environment files (copy, then edit if needed)
cp server/.env.example server/.env        # PowerShell: copy server\.env.example server\.env
cp client/.env.example client/.env        # PowerShell: copy client\.env.example client\.env
#    In server/.env, set JWT_SECRET to a long random string:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Load the product catalog (replaces the products collection only)
npm run seed

# 4. Start client + server together
npm run dev
```

- Store: http://localhost:5173
- API: http://localhost:5000/api (`/api/health`, `/api/products`)

## Scripts (run from the repo root)

| Script | What it does |
|---|---|
| `npm run install:all` | `npm install` in the root, `server/` and `client/` |
| `npm run dev` | Client (Vite, :5173) + server (`node --watch`, :5000) together |
| `npm run seed` | Delete and re-insert all products |
| `npm run build` | Production build of the client into `client/dist` |
| `npm start` | Start the server without watch mode |
| `npm run lint` | ESLint on the client |

To run one side only: `cd server && npm run dev` or `cd client && npm run dev`.
Add packages inside the app that uses them: `cd server && npm install <pkg>` (or `cd client ...`).

Each app is self-contained (own `package.json` + `package-lock.json`), so it can be deployed
on its own: e.g. Render/Railway with root directory `server`, Vercel/Netlify with root directory `client`.

## Environment variables

`server/.env`

| Name | Example | Meaning |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `5000` | API port |
| `MONGO_URI` | `mongodb://localhost:27017/trymate` | Database |
| `JWT_SECRET` | *(random)* | Signs login tokens (Phase 2). Must not be `change-me` in production. |
| `CLIENT_URL` | `http://localhost:5173` | Only this origin is allowed by CORS |
| `AI_SERVICE_URL` | `http://localhost:8000` | tryMate-Ai (or the mock, from Phase 3) |
| `AI_SERVICE_KEY` | `change-me` | Sent as `X-API-Key`; must equal the AI service's `SERVICE_API_KEY` |
| `AI_MODE` | `mock` | `mock` \| `real` |

The server validates these at startup (`server/config/env.js`) and refuses to start with
a clear message if something is missing.

`client/.env`

| Name | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` |

---

## API

Errors always look like `{ "error_code": "NOT_FOUND", "message": "Product not found" }`,
the same shape the AI service uses. Validation errors add a `details` array.

| Code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Bad query/body/params |
| `CART_EMPTY` | 400 | Placing an order with an empty cart |
| `UNAUTHORIZED` | 401 | Not logged in / wrong email or password |
| `FORBIDDEN` | 403 | Logged in but not allowed (admin routes) |
| `NOT_FOUND` | 404 | Unknown route, product, cart item or order |
| `CONFLICT` | 409 | Email already registered |
| `OUT_OF_STOCK` | 409 | Not enough stock for the requested size |
| `RATE_LIMITED` | 429 | More than 20 login/register attempts per 15 min from one IP |
| `INTERNAL_ERROR` | 500 | Anything unexpected |

### `GET /api/health`
Server, DB and AI service status. `200` with `status: "ok"`, or `"degraded"` when the AI
service is unreachable (the store still works). `503` with `status: "down"` if MongoDB is down.

```bash
curl http://localhost:5000/api/health
```

### `GET /api/products`
Query params (all optional):

| Param | Values |
|---|---|
| `category` | `upper_body` \| `lower_body` \| `dresses` |
| `type` | `shirt` \| `tshirt` \| `polo` |
| `color` | color name, case-insensitive (`navy`) |
| `minPrice`, `maxPrice` | numbers; compared with the discounted price when there is one |
| `sort` | `newest` (default) \| `price_asc` \| `price_desc` \| `name` |
| `page`, `limit` | default `1`, `12` (max 48) |

Response: `{ items, page, limit, total, pages, filters: { types, colors, price: { min, max } } }`.
`filters` lists every option in the catalog, for the shop's filter panel.

```bash
curl "http://localhost:5000/api/products?type=polo&sort=price_asc"
curl "http://localhost:5000/api/products?color=navy&maxPrice=1300"
```

### `GET /api/products/:slug`
The full product, including `sizeChart` and `stock`.

```bash
curl http://localhost:5000/api/products/classic-oxford-shirt
```

### Auth: `/api/auth`

The JWT lives in an **httpOnly cookie** (`trymate_token`, 7 days), so the client never
touches it. Why a cookie rather than a Bearer token: JavaScript can't read an httpOnly
cookie, so an XSS bug can't steal the session; `SameSite=Lax` plus CORS restricted to
`CLIENT_URL` blocks CSRF; and the client needs no token code.

| Route | Body | Response |
|---|---|---|
| `POST /register` | `{ name, email, password }` (8–72 bytes) | `201 { user }` + cookie |
| `POST /login` | `{ email, password }` | `200 { user }` + cookie |
| `POST /logout` | | `204`, cookie cleared |
| `GET /me` | | `200 { user }` or `401` |

`user` = `{ _id, name, email, role, fitProfile, fitPreference, createdAt }` (never the password hash).
Registration always creates a `customer`; there's no way to self-register as admin.

```bash
# Git Bash / macOS / Linux: -c/-b store and send the cookie
curl -c jar.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"correct-horse-1"}'
curl -b jar.txt http://localhost:5000/api/auth/me
```

### Cart: `/api/cart` (logged in)

| Route | Body |
|---|---|
| `GET /` | |
| `POST /items` | `{ productId, size, color, qty? }` (same product + size + color adds to that line) |
| `PATCH /items/:itemId` | `{ qty }` (1–10) |
| `DELETE /items/:itemId` | |

Every cart route returns the whole cart, priced live from the products:
`{ items: [{ _id, product: { name, slug, image, price, discountPrice }, size, color, qty, unitPrice, lineTotal, available, inStock }], itemCount, subtotal, hasStockIssues }`.
Stock is checked when adding/updating; lines whose product was deleted are dropped.

```bash
curl -b jar.txt -X POST http://localhost:5000/api/cart/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"<id from /api/products>","size":"M","color":"Navy","qty":1}'
```

### Orders: `/api/orders` (logged in)

| Route | Body |
|---|---|
| `POST /` | `{ shippingAddress: { fullName, phone, line1, line2?, city, state, postalCode, country } }` |
| `GET /` | (your orders, newest first) |
| `GET /:id` | (only your own orders; others return 404) |

Placing an order: stock is taken out atomically per line (if any line fails, what was
already taken is put back), the items are snapshotted with the price paid, and the cart is
emptied. Payment is a demo: `payment: { method: "demo", status: "paid" }`, nothing is charged.

```bash
curl -b jar.txt -X POST http://localhost:5000/api/orders -H "Content-Type: application/json" \
  -d '{"shippingAddress":{"fullName":"Asha","phone":"9876543210","line1":"1 MG Road","city":"Bengaluru","state":"Karnataka","postalCode":"560001","country":"India"}}'
curl -b jar.txt http://localhost:5000/api/orders
```

### How to test in the browser
1. `npm run dev`, open http://localhost:5173
2. Home: hero, 8 new arrivals, the "Find your perfect fit" section
3. Shop: filter by type / color / price, sort, page 2; filters stay in the URL, so refresh and back keep them
4. Product: switch colors (the image changes), pick a size (sold-out sizes are crossed out), open the size guide
5. Click **Add to cart** while logged out → you're sent to log in, then back to the product
6. Register, add a few items (try a different color of the same shirt), check the cart badge in the header
7. Cart: change quantities, remove a line; **Checkout** → fill the address → **Place order** → confirmation page
8. **Your orders** (account menu) lists it; refresh the page and you're still logged in; **Log out**
9. Visit `/cart` while logged out → redirected to login; `/products/nope` → not found; `/anything` → 404 page

---

## Project layout

```
tryMate-store/
├── client/                      # React 19 + Vite 8 + Tailwind CSS 4 + React Router
│   ├── index.html
│   ├── vite.config.js           # Tailwind via @tailwindcss/vite (no tailwind.config.js needed)
│   └── src/
│       ├── main.jsx, App.jsx    # router + routes
│       ├── index.css            # Tailwind import + brand colors (@theme)
│       ├── api/                 # axios instance (client.js) + auth/products/cart/orders calls
│       ├── context/             # AuthProvider, CartProvider (+ contexts.js)
│       ├── hooks/               # useApi (fetch-on-change), useAuth, useCart
│       ├── components/
│       │   ├── auth/            # ProtectedRoute, AuthCard
│       │   ├── layout/          # Layout, Header (account menu + cart badge), Footer
│       │   ├── orders/          # OrderStatusBadge
│       │   ├── products/        # ProductCard, ProductGrid, ShopFilters, Price, ColorDots, SizeGuide
│       │   └── ui/              # FormField, Pagination, Spinner, StatusMessage
│       ├── pages/               # Home, Shop, Product, Login, Register, Cart, Checkout, Orders, OrderDetail, NotFound
│       └── utils/               # format.js (INR, dates), redirect.js (safe ?redirect=)
├── server/                      # Express 5 + Mongoose 9, ES modules
│   ├── index.js                 # connect DB → listen
│   ├── app.js                   # express app: helmet, cors, json, cookies, routes, errors
│   ├── config/                  # env.js (validated .env), db.js
│   ├── models/                  # Product, User, Cart, Order
│   ├── routes/ → controllers/   # thin routes, logic in controllers
│   ├── validators/              # zod schemas for query/params/body
│   ├── middleware/              # validate, auth (requireAuth/requireAdmin), rateLimit, errorHandler
│   ├── utils/                   # ApiError, authToken (JWT + cookie), pricing, strings
│   └── seed/                    # seed.js, products.data.js, sizeCharts.js
├── scripts/install-all.mjs      # npm run install:all (root + server + client)
├── package.json                 # root scripts only (concurrently runs both apps)
└── PROJECT_SPEC.md
```

Coming in later phases: `server/mocks/aiMock.js`, `server/services/aiClient.js`,
fit-profile / size-recommendation / try-on routes, admin routes, and the matching pages.

---

## Notes and decisions

### Phase 2
- **Auth = JWT in an httpOnly cookie** (see the Auth section for why). Passwords are hashed
  with bcrypt (cost 12). Login gives the same error and takes the same time for "unknown email"
  and "wrong password", so it can't be used to discover registered emails.
- **Production deploy note (Phase 8):** the cookie is `SameSite=Lax`, so the client and API must
  be on the same *site*. Easiest: serve the API under the client's domain (e.g. a Vercel rewrite
  from `/api/*` to the Render/Railway server) and set `VITE_API_URL=/api`. In development,
  `localhost:5173` and `localhost:5000` already count as the same site.
- **Login/register rate limit**: 20 attempts per 15 minutes per IP. It's kept in memory, so
  restarting the server resets it. (Not in the spec; added because the login form would
  otherwise allow unlimited password guessing.)
- **Stock is enforced**: adding to cart and placing an order both check it, and placing an order
  decrements it atomically. MongoDB transactions need a replica set, so a failed multi-line order
  puts back what it already took instead.
- **No admin user yet**: admin routes and UI come in Phase 8. To make yourself admin now, set
  `role: "admin"` on your user in MongoDB Compass / mongosh.
- **Re-seeding** gives products new ids, so existing cart lines disappear (orders keep their snapshot).
- bcrypt ships prebuilt binaries; npm 11 may print an "allow-scripts" warning for it on install. It's harmless.

### Phase 1

- **Database name** is `trymate` (the spec example said `fitstore`). Change `MONGO_URI` if you prefer the other name.
- **Currency** is INR (₹), set in one place: `client/src/utils/format.js`.
- **Express 5**: errors thrown in async controllers reach the error handler automatically,
  so there are no try/catch blocks or `asyncHandler` wrappers. `req.query` is read-only in
  Express 5, so validated values are put on `req.valid.query`.
- **Query safety**: Express 5's default query parser doesn't build nested objects, so
  `?color[$ne]=x` can't become a Mongo operator; zod also drops unknown params, and color
  names are regex-escaped.
- **Seed images** are placeholders from placehold.co (one per color). `garmentImageUrl` must be
  swapped for real flat-lay photos before testing try-on against the real AI service.
- **Size charts** (`server/seed/sizeCharts.js`) are realistic approximations of common
  men's sizing, stored as *body* measurement ranges (length = garment length). Check them
  against real brand charts in R&D.
- **Size chart order** is kept (S → XXL) because the model stores it as a Mongoose `Map`.
- **Mongoose 9**: middleware functions no longer receive `next`; write them as plain or async functions.

## Open decisions for R&D (PROJECT_SPEC.md §9)

1. ~~JWT in an httpOnly cookie vs a Bearer token~~: decided in Phase 2 (cookie).
2. Color distance method for "Colors that suit you" (e.g. CIEDE2000 in LAB vs RGB).
3. Camera capture: `getUserMedia` vs `<input capture>`.
4. Forwarding multer memory buffers to FastAPI (form-data + axios, 130 s timeout).
5. How `AI_MODE=mock` should work: run `aiMock.js` as its own process on :8000, or start it
   from the server when `AI_MODE=mock`.

## Tip: OneDrive

This repo sits inside OneDrive, and syncing `node_modules` (tens of thousands of files) can
slow things down. Consider moving the repo outside OneDrive, or excluding `node_modules`
from sync.
