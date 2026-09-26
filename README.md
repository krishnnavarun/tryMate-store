# tryMate Store

[![CI](https://github.com/krishnnavarun/tryMate-store/actions/workflows/ci.yml/badge.svg)](https://github.com/krishnnavarun/tryMate-store/actions/workflows/ci.yml)

AI-powered clothing store: React (Vite) + Express + MongoDB, plain JavaScript.
Shoppers scan their body once and get a **size recommendation on every product**, **colors
that suit their skin tone**, and a **virtual try-on**. The AI comes from the separate
**tryMate-Ai** service, which only this server calls; the browser never calls it directly.
The full spec is in [PROJECT_SPEC.md](PROJECT_SPEC.md).

> **Status: Phases 1–8 built.** The whole store runs with the built-in mock AI (no Python
> needed) and was tested end to end against the real AI service. What's left needs you:
> real product photos, calibrating against a tape measure, and deploying.
> See [What still needs you](#what-still-needs-you).

---

## Quick start

Requirements: Node.js **20.19+** (developed on Node 24) and MongoDB (local, or a MongoDB Atlas URI).

```bash
# 1. Install. client/ and server/ each have their own node_modules + package-lock.json;
#    the root only has `concurrently` (to run both apps at once).
npm install              # root
npm run install:all      # root + server/ + client/
#    (or by hand: cd server && npm install, then cd client && npm install)

# 2. Environment files (copy, then edit if needed)
cp server/.env.example server/.env        # PowerShell: copy server\.env.example server\.env
cp client/.env.example client/.env        # PowerShell: copy client\.env.example client\.env
#    In server/.env, set JWT_SECRET to a long random string:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Load the product catalogue (replaces the products collection only)
npm run seed

# 4. Start client + server together (AI_MODE=mock: the fake AI is built in)
npm run dev

# 5. (optional) Make your account an admin, after registering it in the store
npm run make-admin -- you@example.com
```

- Store: http://localhost:5173
- API: http://localhost:5000/api

### Using the real AI service
1. Start **tryMate-Ai** (see its README): `uvicorn app.main:app --port 8000`.
2. In `server/.env`: `AI_MODE=real`, `AI_SERVICE_URL=http://localhost:8000`, and
   `AI_SERVICE_KEY` equal to the AI service's `SERVICE_API_KEY`.
3. Restart `npm run dev`. `GET /api/health` shows `"ai": { "status": "ok", "mode": "real" }`.

## Docker (the whole stack in containers)

No Node or MongoDB needed on your computer, only [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
cp .env.example .env                    # PowerShell: copy .env.example .env
#   set JWT_SECRET and AI_SERVICE_KEY in .env to long random strings
docker compose up --build -d            # → http://localhost:8080
docker compose exec server npm run seed -- --force
docker compose exec server npm run make-admin -- you@example.com   # after registering
docker compose logs -f server           # follow the API's log
docker compose down                     # stop (add -v to also delete the database)
```

| Service | What it is | Reachable at |
|---|---|---|
| `client` | nginx serving the React build and forwarding `/api` to the server | http://localhost:8080 (`WEB_PORT`) |
| `server` | the Express API (`NODE_ENV=production`) | only through nginx |
| `mongo` | MongoDB 8, data in the `mongo-data` volume | `mongodb://localhost:27018` (this computer only) |
| `ai` | the real **tryMate-Ai** service, built from `../tryMate-Ai` | only with `--profile ai` |

- **Real AI:** set `AI_MODE=real` in `.env`, then `docker compose --profile ai up --build -d`
  (first build ~5 min, needs about 1 GB of free memory; `TRYON_MOCK=true` by default).
- **One origin:** the browser only talks to nginx, so the login cookie is first-party and
  there's no CORS. It's the same setup as the `/api` rewrite in [Deployment](#deployment).
- `--force` on the seed: the containers run in production mode, where the seed script refuses
  by default.
- Production mode makes the login cookie `Secure`. Chrome and Edge accept that on
  `http://localhost`; Safari doesn't, so use Chrome or Edge for the local Docker stack.
- End-to-end tests against the containers:
  `E2E_API_URL=http://localhost:8080/api MONGO_URI=mongodb://localhost:27018/trymate npm run test:e2e`
- Files: `docker-compose.yml`, `.env.example` (Compose only), `server/Dockerfile`,
  `client/Dockerfile` (Node build → nginx), `client/nginx.conf.template`.

## Scripts (from the repo root)

| Script | What it does |
|---|---|
| `npm run install:all` | `npm install` in the root, `server/` and `client/` |
| `npm run dev` | Client (Vite, :5173) + server (`node --watch`, :5000) together |
| `npm run seed` | Delete and re-insert all products |
| `npm run make-admin -- <email> [--remove]` | Give (or take away) the admin role |
| `npm run build` | Production build of the client into `client/dist` |
| `npm start` | Start the server without watch mode |
| `npm run lint` | ESLint on the client |
| `npm test` | Unit tests for the fitting room maths (no server needed, see [Tests](#tests)) |
| `npm run test:e2e` | End-to-end API tests against the running server (see [Tests](#tests)) |

In `server/`: `npm run mock:ai` runs the mock AI on its own on port 8000 (like the real service).

## Environment variables

`server/.env`

| Name | Example | Meaning |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `5000` | API port |
| `MONGO_URI` | `mongodb://localhost:27017/trymate` | Database |
| `JWT_SECRET` | *(random)* | Signs login tokens. Must not be `change-me` in production. |
| `CLIENT_URL` | `http://localhost:5173` | Only this origin is allowed by CORS |
| `AI_MODE` | `mock` | `mock` = built-in fake AI · `real` = the tryMate-Ai service |
| `AI_SERVICE_URL` | `http://localhost:8000` | tryMate-Ai (used when `AI_MODE=real`) |
| `AI_SERVICE_KEY` | `change-me` | Sent as `X-API-Key`; must equal the AI service's `SERVICE_API_KEY` |

The server validates these at startup (`server/config/env.js`) and refuses to start with a
clear message if something is missing.

`client/.env`: `VITE_API_URL` = `http://localhost:5000/api` (in production, `/api` behind a rewrite; see Deployment).

---

## Features, and how to try them

1. **Shop** (`/shop`): filter by type / colour / price, sort, pages. Filters live in the URL.
2. **Account**: register, log in, log out. The session is an httpOnly cookie.
3. **Cart and demo checkout**: stock is checked; placing an order takes stock atomically;
   nothing is charged.
4. **Fit profile** (`/fit-profile`): photo tips, a privacy notice, upload **or** camera (with a
   10-second self-timer for full-body shots), height/weight → measurements, skin tone,
   suggested colours, confidence, warnings. Re-scan, delete, fit preference (slim/regular/loose).
5. **Size recommendation** on every product page: a "Best fit" badge on the recommended size,
   a fit note per size ("Tight at chest"), and a slim/regular/loose toggle that updates it.
   Without a profile: a prompt to scan.
6. **Colors that suit you**: "Suits you" tags on product cards and colour swatches, plus a
   "Colors that suit you" filter on the shop page.
7. **Virtual try-on** ("Try it on" on a product): upload or take a photo, a progress state for up
   to a minute, the result side by side with the original, and the note *"This shows the look,
   not the exact fit."* Limited to 10 per hour per user.
8. **Live fitting room** (`/fitting-room`, or "Try it live" on a product page): see below.
9. **Admin** (`/admin/products`, admins only): product list, create/edit with a colour editor,
   image URLs, garment (try-on) image URL and a **size chart + stock editor**; delete.

**Testing every AI error message with the mock:** give the photo a file name containing
`no-person`, `multiple`, `partial`, `no-face`, `face-error`, `server-error`, `tryon-fail` or
`tryon-timeout` (e.g. `partial.jpg`), or enter height 999. See `server/mocks/aiMock.js`.

---

## API

Errors always look like `{ "error_code": "NOT_FOUND", "message": "Product not found" }`,
the same shape the AI service uses. Validation errors add a `details` array.

| Code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Bad query/body/params/upload |
| `CART_EMPTY` | 400 | Placing an order with an empty cart |
| `UNAUTHORIZED` | 401 | Not logged in / wrong email or password |
| `FORBIDDEN` | 403 | Logged in but not an admin |
| `NOT_FOUND` | 404 | Unknown route, product, cart item or order |
| `CONFLICT` | 409 | Email or product slug already in use |
| `OUT_OF_STOCK` | 409 | Not enough stock for the requested size |
| `NO_FIT_PROFILE` | 409 | Size recommendation / "suits me" without a scan |
| `INVALID_INPUT`, `NO_PERSON_DETECTED`, `MULTIPLE_PEOPLE`, `PARTIAL_BODY`, `FACE_NOT_FOUND` | 422 | From the AI service, passed through |
| `RATE_LIMITED` | 429 | Too many logins (20/15 min/IP in production, 200 in development), scans (20/h/user) or try-ons (10/h/user) |
| `TRYON_FAILED` / `TRYON_TIMEOUT` / `AI_TIMEOUT` | 502 / 504 | The AI provider failed or was too slow |
| `AI_UNAVAILABLE` | 503 | The AI service can't be reached |
| `INTERNAL_ERROR` | 500 / 502 | Anything unexpected (incl. a wrong `AI_SERVICE_KEY`, which is logged) |

The client turns each code into a friendly message (`client/src/api/client.js`, following the
table in PROJECT_SPEC.md §4).

### Routes

```
GET    /api/health                           server + DB + AI status

POST   /api/auth/register | login | logout
GET    /api/auth/me                          { user } or { user: null }

GET    /api/products                         ?category&type&color&minPrice&maxPrice&sort&page&limit&suitsMe=true
GET    /api/products/:slug                   full product (+ suitingColors for logged-in users)
POST   /api/products                         (admin) create
PUT    /api/products/:id                     (admin) replace
DELETE /api/products/:id                     (admin)
GET    /api/products/:id/size-recommendation (auth) → { recommendedSize, perSize, fitPreference }
POST   /api/products/:id/try-on              (auth, multipart: image, color?) → { resultImage, latencyMs, provider }

GET    /api/fit-profile                      (auth) → { fitProfile, fitPreference }
POST   /api/fit-profile/scan                 (auth, multipart: image, heightCm, weightKg?) → { fitProfile, fitPreference, warnings }
PUT    /api/fit-profile/preference           (auth) { fitPreference: slim | regular | loose }
DELETE /api/fit-profile                      (auth)

GET    /api/cart | POST /api/cart/items | PATCH /api/cart/items/:itemId | DELETE /api/cart/items/:itemId   (auth)
POST   /api/orders | GET /api/orders | GET /api/orders/:id                                                (auth)
```

Every response has an `X-Request-ID` header; the same id is sent to the AI service, so one
request can be followed through both services' logs.

### curl examples (Git Bash / macOS / Linux)

```bash
# Register (the cookie goes into jar.txt), then use it
curl -c jar.txt -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"correct-horse-1"}'

# Scan (photo stays in memory, only the results are saved)
curl -b jar.txt -X POST http://localhost:5000/api/fit-profile/scan -F "image=@photo.jpg" -F "heightCm=175"

# Size recommendation for a product (id from /api/products)
curl -b jar.txt http://localhost:5000/api/products/<productId>/size-recommendation

# Change fit preference
curl -b jar.txt -X PUT http://localhost:5000/api/fit-profile/preference -H "Content-Type: application/json" -d '{"fitPreference":"slim"}'

# Products that suit you
curl -b jar.txt "http://localhost:5000/api/products?suitsMe=true"

# Try-on
curl -b jar.txt -X POST http://localhost:5000/api/products/<productId>/try-on -F "image=@photo.jpg" -F "color=Navy"

# Cart and order
curl -b jar.txt -X POST http://localhost:5000/api/cart/items -H "Content-Type: application/json" \
  -d '{"productId":"<productId>","size":"M","color":"Navy","qty":1}'
curl -b jar.txt -X POST http://localhost:5000/api/orders -H "Content-Type: application/json" \
  -d '{"shippingAddress":{"fullName":"Asha","phone":"9876543210","line1":"1 MG Road","city":"Bengaluru","state":"Karnataka","postalCode":"560001","country":"India"}}'
```

---

## Live fitting room

A live camera "mirror" at `/fitting-room`: drag a garment onto yourself (mouse), or tap it
(phone), then switch colours and sizes while you move.

| Part | How |
|---|---|
| **Body tracking** | MediaPipe PoseLandmarker (lite) runs **in the browser** (WebAssembly, GPU if available), 20–30 times a second. The video never leaves the device. |
| **Drawing** | Canvas 2D over the video. A "torso frame" from the shoulder and hip landmarks lets the shirt body be drawn in simple garment coordinates that rotate and scale with you; sleeves follow shoulder → elbow (→ wrist). Details per type: crew neck, polo collar + buttons, shirt collar + button line + cuffs. |
| **Fit** | For the chosen size, width = middle of the size's chest range ÷ your scanned chest (length the same way), so S looks snug and XXL roomy. Next to it: the AI fit note ("Tight at chest") and the recommended size. Labelled as an approximation. |
| **Realistic look** | "Make it realistic" takes one snapshot and runs the AI try-on on it (same flow as on the product page). |
| **Real cut-outs** | Admins can set an optional **fitting-room cut-out** (transparent PNG) per product; it's drawn instead of the drawn shape. |

- Files: `client/src/pages/FittingRoomPage.jsx`, `client/src/components/fitting/*`,
  `client/src/lib/fitting/*` (`poseTracker.js`, `drawGarment.js`, `fit.js`, `landmarks.js`;
  unit tests next to them, see [Tests](#tests)).
- The page is **lazy-loaded**, so MediaPipe (~50 kB gzipped JS + one ~12 MB wasm file + a ~5.5 MB model, cached by the browser after the first visit) only
  downloads when someone opens it. The wasm files are copied from `node_modules` into
  `client/public/mediapipe/` by `client/scripts/copy-mediapipe-wasm.mjs` before `dev` and
  `build` (gitignored); the model comes from Google's MediaPipe model storage.
- Needs HTTPS (or localhost) for the camera. Start-up gives up after 45 s with a "Try again".
- Honest limit: it's a 2D overlay — great for colour, style and proportions, but it doesn't
  simulate cloth, and it can't show how fabric drapes. Fit comes from the measurements.

## Design and motion

A warm, quiet look in the spirit of a tailor's shop.

| Part | How |
|---|---|
| **Palette** | ivory `#FAF8F4` page, bone `#F1ECE4` surfaces, ink `#1C1A17` text and buttons, brass `#8B6D3F` accent; sage (success, "suits you"), oxblood (errors, sale) and ochre (notes). All tokens live in `client/src/index.css` (`@theme`). The default `gray` / `emerald` / `red` / `amber` scales are replaced by warm versions, so every existing class follows the palette. Text colours pass 4.5:1 contrast on ivory. |
| **Type** | Instrument Serif for display text (its italic for emphasis), Manrope for the interface. Self-hosted with `@fontsource` (bundled; no Google Fonts request). |
| **Motion** | CSS keyframes in `index.css` (`animate-rise`, `-word`, `-draw`, `-scan`, `-float`, `-marquee`…) with one easing curve. `components/ui/Motion.jsx`: `Reveal` (rises in when scrolled into view, via `IntersectionObserver`), `RevealText` (headline words slide up one by one), `CountUp`. Each page rises in on navigation; the cart badge bumps; buttons get a light sweep. |
| **Motion graphics** | Home hero: a shirt drawn like a tailor's technical sheet, with measurement lines that draw themselves, a scan line and floating cards (`components/home/HeroGraphic.jsx`). A scan animation over your photo while it's analysed and during try-on (`ScanOverlay`); a hanger drawn on the 404 page; a check mark drawn when an order is placed. |
| **Reduce motion** | With "reduce motion" on in the OS, every animation lands in its final state immediately. |
| **Product illustrations** | Until real photos are added, the seed's placehold.co images are drawn as flat-lay garments in the right colour, with the right collar, sleeves and fabric (stripes, checks, denim, linen, knit, piqué, oxford, print): `GarmentArt.jsx`, chosen by `lib/garmentStyle.js` from the product name. `ProductImage` shows real photos as they are and falls back to the illustration if a photo fails to load. |

## How the AI features work (store side)

- **Photos are never stored.** `multer.memoryStorage()` keeps an upload in RAM; it's forwarded
  to the AI service (`form-data` + axios, `server/services/aiClient.js`) and dropped when the
  request ends. Only the scan *results* go into `user.fitProfile`. Photos are never logged.
- **AI_MODE=mock** mounts the fake AI (`server/mocks/aiMock.js`) inside this server at
  `/__mock-ai`, so nothing else has to run. It follows the same contract (including the
  3-second try-on delay) and still requires the `X-API-Key`.
- **Timeouts:** scan 60 s, recommendation 15 s, try-on 130 s (the AI service gives up at 120 s).
- **Size recommendations are not stored.** They're computed on request and cached in memory
  for 5 minutes per user + product + fit preference. The cache is cleared whenever the profile
  or preference changes (`server/services/recommendationCache.js`).
- **"Colors that suit you"** compares each product colour with the user's suggested colours
  using **CIEDE2000** (ΔE00, the standard perceptual colour difference in CIELAB;
  `server/utils/colorDistance.js`, checked against published test data). RGB distance doesn't
  match how people see colour. A colour "suits you" when ΔE00 ≤ 6 (looks like the same colour);
  white vs cream is ~7, navy vs indigo ~12. Change `SUITS_YOU_MAX_DELTA_E` to be more generous.
- **Camera:** `getUserMedia` with a live preview and a 10-second self-timer, because a
  full-body photo needs the phone propped up while you step back. `<input capture>` opens the
  phone's own camera app, which has no timer. Uploading a file (which on phones also offers
  the camera) is always available.

---

## Deployment

A setup that works well:

| Part | Where | Notes |
|---|---|---|
| Database | **MongoDB Atlas** (free M0) | Allow your server's IP (or 0.0.0.0/0 with a strong password) |
| Server | **Render** or **Railway**, root directory `server` | Build `npm install`, start `npm start` |
| Client | **Vercel** or **Netlify**, root directory `client` | Build `npm run build`, output `dist` |
| AI service | Render/Railway (Docker), ≥ 1 GB RAM | See tryMate-Ai's README |

**Important, cookies:** the login cookie is `SameSite=Lax` and `Secure` in production, so the
browser only sends it when the client and API are on the **same site**. `your-app.vercel.app`
and `your-api.onrender.com` are different sites, so logins would silently fail. Serve the API
through the client's domain with a rewrite:

- **Vercel**: add `client/vercel.json`
  ```json
  {
    "rewrites": [
      { "source": "/api/:path*", "destination": "https://YOUR-API.onrender.com/api/:path*" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **Netlify**: add `client/public/_redirects`
  ```
  /api/*  https://YOUR-API.onrender.com/api/:splat  200
  /*      /index.html                                200
  ```

The second rule makes deep links like `/products/knit-polo` work (single-page app).

Then set:
- client: `VITE_API_URL=/api`
- server: `NODE_ENV=production`, `CLIENT_URL=https://your-app.vercel.app`, `MONGO_URI` (Atlas),
  a long random `JWT_SECRET`, `AI_MODE` (`mock` for a demo, `real` + `AI_SERVICE_URL` +
  `AI_SERVICE_KEY` for the real service)

With `NODE_ENV=production` the server trusts the platform's proxy (correct IPs for rate
limits), sends `Secure` cookies, and refuses to start if `JWT_SECRET` or `AI_SERVICE_KEY` is
still `change-me`. After deploying: `npm run seed` once against Atlas (run it locally with
`MONGO_URI` pointing at Atlas), register, `npm run make-admin -- you@...`.

**Try-on in production:** the Replicate IDM-VTON model is **non-commercial only** (CC BY-NC-SA).
Fine for a demo; a real store needs a commercially licensed try-on model.

---

## Project layout

```
tryMate-store/
├── client/                        # React 19 + Vite 8 + Tailwind CSS 4 + React Router
│   ├── Dockerfile, nginx.conf.template  # Docker: Node build → nginx (static files + /api proxy)
│   ├── scripts/                   # copy-mediapipe-wasm.mjs (before dev/build)
│   └── src/
│       ├── main.jsx, App.jsx      # providers + routes
│       ├── api/                   # axios instance (errors → friendly messages) + endpoint calls
│       ├── context/               # AuthProvider, CartProvider
│       ├── hooks/                 # useApi, useAuth, useCart, useObjectUrl
│       ├── components/
│       │   ├── admin/             # SizeChartEditor
│       │   ├── auth/              # ProtectedRoute, AdminRoute, AuthCard
│       │   ├── fit/               # ScanForm, FitResults, PhotoPicker, CameraCapture, PrivacyNotice, FitPreferenceToggle
│       │   ├── fitting/           # LiveMirror, GarmentTray, WornPanel (live fitting room)
│       │   ├── layout/            # Layout, Header, Footer
│       │   ├── orders/            # OrderStatusBadge
│       │   ├── products/          # ProductCard, ProductGrid, ShopFilters, Price, ColorDots, SizeGuide, TryOnModal
│       │   ├── home/              # HeroGraphic (the home page motion graphic)
│       │   └── ui/                # FormField, Modal, Pagination, Spinner, StatusMessage, Motion (Reveal, RevealText, CountUp)
│       ├── lib/                   # camera.js, color.js, garmentStyle.js; fitting/ (poseTracker, drawGarment, fit, landmarks); unit tests
│       ├── pages/                 # Home, Shop, Product, FitProfile, FittingRoom, Login, Register, Cart, Checkout, Orders, OrderDetail, NotFound
│       │   └── admin/             # AdminProducts, AdminProductForm
│       └── utils/                 # format (INR, dates), redirect (safe ?redirect=), productForm
├── server/                        # Express 5 + Mongoose 9, ES modules
│   ├── Dockerfile                 # Docker: node:24-slim, production deps, non-root, healthcheck
│   ├── index.js, app.js
│   ├── config/                    # env.js (validated .env), db.js
│   ├── models/                    # Product, User (+ fitProfile), Cart, Order
│   ├── routes/ → controllers/     # auth, products (+ AI + admin), fit-profile, cart, orders, health
│   ├── services/                  # aiClient (the only AI caller), recommendationCache
│   ├── mocks/aiMock.js            # fake AI service (same contract)
│   ├── middleware/                # validate, auth, rateLimit, upload (memory only), requestId, errorHandler
│   ├── validators/                # zod schemas
│   ├── utils/                     # ApiError, authToken, colorDistance (CIEDE2000), pricing, strings
│   ├── scripts/makeAdmin.js
│   ├── seed/                      # seed.js, products.data.js, sizeCharts.js
│   └── tests/e2e/                 # npm run test:e2e (run.mjs + shop/ai/admin suites)
├── docker-compose.yml             # mongo + server + client (nginx) [+ ai with --profile ai]
├── .env.example                   # Docker Compose settings (copy to .env)
├── scripts/install-all.mjs
├── package.json                   # root scripts (concurrently)
└── PROJECT_SPEC.md
```

---

## Notes and decisions

- **Auth = JWT in an httpOnly cookie.** JavaScript can't read it (an XSS bug can't steal the
  session); `SameSite=Lax` + CORS restricted to `CLIENT_URL` block CSRF; the client has no
  token code. bcrypt cost 12; login gives the same error and timing for unknown email and
  wrong password.
- **Stock is enforced** when adding to the cart and atomically when ordering (a failed multi-line
  order puts back what it took; transactions would need a MongoDB replica set).
- **FACE_NOT_FOUND:** the real AI returns measurements with `skin_tone: null` and a warning; the
  profile is saved without colours and the page explains why. The 422 form is still handled.
- **Contract additions (not breaking):** the AI service can answer `429 RATE_LIMITED` for
  try-on; the store adds `NO_FIT_PROFILE`, `AI_UNAVAILABLE` and `AI_TIMEOUT` of its own.
- **Beyond the spec** (small, for safety/UX): login/scan/try-on/recommendation rate limits,
  a camera self-timer, `suitingColors` on the product page, `make-admin` script, request ids,
  end-to-end tests.
- **Database name** is `trymate` (the spec example said `fitstore`). **Currency** is INR (₹),
  in `client/src/utils/format.js`.
- **Express 5**: async errors reach the error handler automatically; `req.query` is read-only, so
  validated values go on `req.valid`. Express 5's query parser can't build nested objects, so
  `?color[$ne]=x` can't become a Mongo operator.
- **Mongoose 9**: middleware has no `next`; use `returnDocument: 'after'` instead of `new: true`.
- **Re-seeding** gives products new ids, so existing cart lines disappear (orders keep their snapshot).
- bcrypt ships prebuilt binaries; npm 11 may print an "allow-scripts" warning for it. It's harmless.

## Tests

**Unit tests** for the live fitting room and the product illustrations run in plain Node in about
a second (no browser, camera or server):

```bash
npm test               # → "pass 59"
```

- `client/src/lib/fitting/drawGarment.test.js`: the garment drawing on a real detected pose
  (saved as 33 numbers in `__fixtures__/standing-pose.json`, no photo). A fake canvas records
  every shape in screen pixels, then the tests check them: the hints when the body isn't visible,
  sleeve outlines that never cross themselves (5 poses × 3 garment types × short/long sleeves ×
  4 sizes), short sleeves reaching below the armpit, long sleeves ending at the wrists, bigger
  sizes drawn wider, drawing order and the product cut-out image.
- `client/src/lib/fitting/fit.test.js`: size chart + measurements → drawing scale, the limits,
  missing data, and the "Snug / Roomy" labels.
- `client/src/lib/garmentStyle.test.js`: product name → illustration style (collar, sleeves,
  fabric) for the whole catalogue, reading the seed's placeholder URLs, and the colour helpers.
- Node's built-in test runner (`node --test`) finds every `*.test.js` file; there are no extra packages.

**End-to-end tests** call the API of a **running** server, the way the React app does:

```bash
npm run dev            # terminal 1 (AI_MODE=mock is fine)
npm run test:e2e       # terminal 2 → "✅ All 80 checks passed"
```

- **Shop** (auth, cart, orders, the stock race), **AI features** (scan, every AI error message
  via the mock, size recommendation for each fit preference, "suits you", try-on) and **admin**
  (permissions, validation, create/update/delete). Code: `server/tests/e2e/`.
- **Safe on your dev database:** each run creates its own users (`…@example.test`) and product
  (`E2E Test …`) and deletes them, with their carts and orders, when it ends, even after a
  failure. Your products, stock and accounts are never touched.
- With `AI_MODE=real`: set `E2E_PHOTO=path/to/full-body.jpg` (otherwise the AI part is
  skipped), and `E2E_TRYON=1` to include one try-on (costs money unless the AI service has
  `TRYON_MOCK=true`).
- Other target: `E2E_API_URL=http://localhost:5000/api` (default).

**CI** (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request:
- `client`: `npm ci`, ESLint, unit tests, production build.
- `e2e`: MongoDB in a container, `npm run seed` into a `trymate_ci` database, the server with the
  built-in mock AI, then `npm run test:e2e`. No secrets needed: CI uses throwaway values.
- `docker`: `docker compose up --build` (both images), seed, smoke tests through nginx (API,
  single-page-app fallback, the wasm's content type, server port not exposed), then the same
  `npm run test:e2e` against the containers.

## What was tested

- `npm run test:e2e`: 80 checks with the mock AI; with the real AI service + a real photo: 71
  (the mock-only error cases are skipped). Run twice in a row; the database was identical
  before and after.
- The same scan → recommendation → "suits you" → try-on flow against the **real** AI service
  (try-on provider mocked): no contract mismatches.
- UI: a headless Chrome tour (desktop + 390 px mobile) through home, shop, product, register,
  scan (upload and the camera with a fake video device), recommendations, try-on, cart,
  checkout, order confirmation and admin, with no console errors.
- Fitting room: the real MediaPipe model in headless Chrome on a person in a fake camera
  feed (garment drawn on the body, drag and drop, colour/size switching); `npm test`: 59 unit
  tests. They were also checked the other way round: with the old sleeve maths put back they fail.
- Design and motion: a headless Chrome tour of the redesign (desktop 1440 px + 390 px mobile).
  It covered home, the shop (including the card hover), product, login, register, the scan
  animation (the scan request held for 3 s to see it), results, recommendation, add to cart,
  cart, the fitting room and 404. There were no console errors. All 31 product/colour
  illustrations were also rendered side by side and checked.
- Docker: the CI `docker` job passed on its first run: both images built, the stack came up
  healthy, the nginx smoke tests passed and all e2e checks passed against the containers.
  (The development machine has no Docker, so CI is where the images are built.)

## What still needs you

1. **Real product photos:** the seed uses placeholder images, which the store shows as drawn
   illustrations (see [Design and motion](#design-and-motion)). For try-on, each product's
   `garmentImageUrl` must be a real flat-lay photo (garment alone, plain background). Edit them
   in `/admin/products` or in `server/seed/products.data.js`.
2. **Real size charts:** `server/seed/sizeCharts.js` holds realistic approximations; check them
   against real brand charts.
3. **Calibrate** the AI measurements against a tape measure: tryMate-Ai's `scripts/calibrate.py`
   turns a few photos + tape values into the constants to set (see tryMate-Ai's README).
4. **Deploy** (above) and run the demo flow on your phone.

## Tip: OneDrive

This repo sits inside OneDrive, and syncing `node_modules` (tens of thousands of files) can
slow things down. Consider moving the repo outside OneDrive, or excluding `node_modules`
from sync.
