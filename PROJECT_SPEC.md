# Store (MERN) — Project Spec (Repo 1 of 2)

> Put this file in the root of the `store` repo as `PROJECT_SPEC.md`.
> Claude: read this whole file before doing anything. Follow the phases in order.
> Wait for my approval after the R&D + plan step and after every phase.

---

## 1. About me and how to work with me

- I'm strongest in **MERN with plain JavaScript**. **No TypeScript.**
- Write clean, readable code with comments where logic isn't obvious.
- After each phase: tell me what you built, how to run it, and how to test it.
  Then stop and wait for my go-ahead.
- Don't add features outside this spec without asking.
- If something in this spec is wrong or outdated, tell me before building.

---

## 2. The product (big picture)

An AI-powered online clothing store that reduces wrong-size orders and returns.
Users upload a photo once and get a size recommendation on every product, colors
that suit their skin tone, and a virtual try-on image.

There are **2 repos**:

| Repo | Stack | Responsibility |
|---|---|---|
| `store` (this repo) | React + Express + MongoDB (JS) | Store, users, products, size charts, cart, orders, UI |
| `ai-service` | Python + FastAPI | All AI: measurements, skin tone, size recommendation, try-on |

Flow: `React client → Express server → AI service`.
**The browser never calls the AI service directly.** Express proxies every AI call
and adds the `X-API-Key` header.

---

## 3. Tech decisions

### Monorepo layout (one repo, two apps)
```
store/
├── client/        # React (Vite) + plain JS + Tailwind CSS + React Router
├── server/        # Node.js + Express + Mongoose
├── package.json   # root scripts: run client + server together (concurrently)
├── PROJECT_SPEC.md
└── README.md
```

### Client
- React 18+ (Vite), plain JS, Tailwind CSS, React Router
- Axios with a single API instance (base URL from env, JWT attached automatically)
- State: React Context for auth + cart (no Redux unless there's a clear reason)
- Toast notifications for errors/success

### Server
- Express, Mongoose, JWT auth (bcrypt for passwords), stored in an httpOnly cookie **or**
  a Bearer token; pick one in R&D and explain why
- `multer` with **memoryStorage** for photo uploads; forward to the AI service with `form-data` + axios
- `express-validator` or `zod` (JS) for input validation
- `helmet`, `cors` (allow only the client origin), `express-rate-limit` on AI routes
- Centralized error handler with consistent JSON errors

### Hard rules
- **User photos are never saved** to disk, DB, or cloud storage. Forward in memory, then discard.
  Only the returned measurements + skin tone are saved to the user's profile.
- Show a clear privacy notice on every photo upload screen.
- Secrets only in `.env`; provide `.env.example` for both client and server.

### Environment variables
`server/.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/fitstore
JWT_SECRET=change-me
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_KEY=change-me
AI_MODE=mock            # mock | real
```
`client/.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## 4. AI service API contract (FIXED — the AI repo implements exactly this)

All requests from Express must include the header `X-API-Key: <AI_SERVICE_KEY>`.

### `GET /health` → `{ "status": "ok", "version": "0.1.0" }`

### `POST /analyze` (multipart)
Fields: `image` (file), `height_cm` (number, 120–230), `weight_kg` (optional), `debug` (optional bool)
```json
{
  "measurements": { "shoulder_cm": 44.1, "chest_cm": 96.5, "waist_cm": 84.0, "torso_cm": 62.3, "arm_cm": 60.2, "leg_cm": 81.7 },
  "skin_tone": { "tone": "medium", "undertone": "warm", "hex": "#C68E6A" },
  "color_suggestions": [ { "name": "Olive", "hex": "#708238" } ],
  "confidence": 0.82,
  "warnings": ["Arms close to body — shoulder width may be less accurate"],
  "debug_image_base64": null
}
```

### `POST /recommend-size` (JSON)
```json
{
  "measurements": { "...": "same shape as above" },
  "size_chart": {
    "S": { "chest": [86, 92], "waist": [74, 80], "length": [68, 70], "shoulder": [41, 43] },
    "M": { "chest": [92, 98], "waist": [80, 86], "length": [70, 72], "shoulder": [43, 45] }
  },
  "category": "upper_body",
  "fit_preference": "regular"
}
```
→
```json
{
  "recommended_size": "M",
  "per_size": {
    "S": { "score": 0.41, "note": "Tight at chest and shoulders" },
    "M": { "score": 0.93, "note": "Good fit" }
  }
}
```

### `POST /try-on` (multipart)
Fields: `person_image` (file), `garment_image` (file) **or** `garment_image_url` (string),
`category` (`upper_body | lower_body | dresses`), `garment_description` (optional)
```json
{ "result_image_url": "https://...", "result_image_base64": null, "latency_ms": 23400, "provider": "replicate_idm" }
```
Can take **10–60 seconds.** Set the Express → AI timeout to 130 s.

### Errors
```json
{ "error_code": "NO_PERSON_DETECTED", "message": "..." }
```
Map each code to a friendly UI message:
| Code | Friendly message |
|---|---|
| `NO_PERSON_DETECTED` | We couldn't find a person in the photo. Try a clear, full-body photo. |
| `MULTIPLE_PEOPLE` | Please use a photo with only you in it. |
| `PARTIAL_BODY` | We need your full body, head to feet, in the photo. |
| `FACE_NOT_FOUND` | We couldn't see your face clearly, so color suggestions may be missing. |
| `TRYON_FAILED` / `TRYON_TIMEOUT` | Try-on is busy right now. Please try again in a minute. |
| `UNAUTHORIZED` / `INTERNAL_ERROR` / unknown | Something went wrong on our side. Please try again. |

---

## 5. Mock AI server (build this early)

`server/mocks/aiMock.js`: a tiny standalone Express app on port 8000 that implements
the contract above with realistic fake data (random but sensible measurements,
a fixed palette, a placeholder try-on image, a 3-second delay on `/try-on`, and a way
to trigger each error code, e.g. `height_cm=999` → `INVALID_INPUT`).

`AI_MODE=mock` → server talks to the mock. `AI_MODE=real` → real AI service.
The whole store must be buildable and demo-able with the mock alone.

---

## 6. Data models (Mongoose)

**User**
- name, email (unique), passwordHash, role (`customer | admin`)
- fitProfile: `{ heightCm, weightKg, measurements, skinTone, colorSuggestions, confidence, updatedAt }` (all optional until the first scan)
- fitPreference: `slim | regular | loose` (default `regular`)
- timestamps

**Product**
- name, slug, description, brand, price, discountPrice
- category: `upper_body | lower_body | dresses` (MVP seeds only `upper_body`)
- type: `shirt | tshirt | polo | ...`
- gender: `men | women | unisex`
- colors: `[{ name, hex }]`
- images: `[url]` (display images)
- garmentImageUrl: a clean flat-lay image on a plain background, used for try-on
- sizeChart: `{ S: { chest:[min,max], waist:[min,max], length:[min,max], shoulder:[min,max] }, ... }`
- stock: `{ S: 10, M: 5, ... }`
- timestamps

**Cart**: user, items `[{ product, size, color, qty }]`
**Order**: user, items (snapshot of name/price/size), total, status, shippingAddress, timestamps

Size recommendation results are **not stored**. Compute them on request (cache in memory for a short time if needed).

---

## 7. Express routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/products                ?category&type&color&minPrice&maxPrice&sort&page&suitsMe=true
GET    /api/products/:slug
POST   /api/products                (admin)
PUT    /api/products/:id            (admin)
DELETE /api/products/:id            (admin)

GET    /api/fit-profile             (auth)
POST   /api/fit-profile/scan        (auth, multipart: image, heightCm, weightKg) → calls AI /analyze, saves result
PUT    /api/fit-profile/preference  (auth)
DELETE /api/fit-profile             (auth)

GET    /api/products/:id/size-recommendation   (auth) → calls AI /recommend-size with user's measurements + product sizeChart
POST   /api/products/:id/try-on                (auth, multipart: image) → calls AI /try-on with product.garmentImageUrl

GET    /api/cart | POST /api/cart/items | PATCH /api/cart/items/:itemId | DELETE /api/cart/items/:itemId
POST   /api/orders | GET /api/orders | GET /api/orders/:id

GET    /api/health                  → server + DB + AI service status
```
`suitsMe=true` filters or sorts products whose colors are close to the user's `colorSuggestions`
(compare colors by distance in LAB or RGB; explain the choice).

---

## 8. Client pages

- **Home**: hero, featured products, a "Find your perfect fit" call to action
- **Shop**: grid, filters (type, color, price), sort, "Colors that suit you" toggle (when a fit profile exists)
- **Product page**: images, color picker, size selector with a **recommended size badge**
  and a fit note per size, **Try it on** button, add to cart
- **Fit Profile / Scan**: photo tips (full body, standing straight, arms slightly away, fitted clothes,
  good light), privacy notice, upload or capture from camera, height/weight input, preview →
  results (measurements, skin tone swatch, suggested colors, confidence, warnings), re-scan button
- **Try-on modal**: upload/capture photo (not stored), progress state for up to 60 s with friendly
  messages, result shown side by side with the original, "This shows the look, not the exact fit.
  Check the size recommendation for fit." note
- **Cart**, **Checkout** (dummy payment), **Orders**
- **Login / Register**
- **Admin**: product list + create/edit form including a size chart editor and garment image URL
- Mobile-first responsive layout

---

## 9. Step 0: R&D + plan (do this FIRST, no code yet)

1. Confirm current stable versions and setup for: Vite + React, Tailwind CSS (current version
   setup differs from older guides; use the current official method), React Router, Mongoose, multer.
2. JWT in an httpOnly cookie vs Bearer token for this app: recommend one.
3. Best way to forward a multer memory buffer to a FastAPI endpoint from Node (form-data + axios), with timeout handling.
4. Camera capture in the browser for the scan page (`getUserMedia` vs `<input capture>`) and mobile support.
5. Color distance method for "Colors that suit you".
6. Realistic men's shirt/t-shirt size charts (chest, waist, length, shoulder in cm) for seed data, from real brand size-chart conventions.

Then give me:
- R&D summary
- Final folder structure for client/ and server/
- Schemas, routes, pages/components list
- The phase plan below, adjusted if needed
- Anything in this spec you disagree with

**Stop and wait for my approval.**

---

## 10. Build phases

Each phase ends with working code, a README update, how to test it, and a stop for my review.

### Phase 1: Setup + store basics
- `git init`, `.gitignore`, root `package.json` with `npm run dev` running client + server together
- Express app structure, Mongo connection, error handler, `/api/health`
- Product model + seed script: **12–15 men's shirts/t-shirts/polos** with realistic size charts,
  colors, placeholder images, and garment image URLs
- Shop page + product page (no AI yet), Tailwind layout, header/footer
- **Done when:** `npm run dev` shows the shop with seeded products.

### Phase 2: Auth + cart + orders
- Register/login/logout/me, protected routes (server + client)
- Cart and dummy checkout → orders
- **Done when:** I can register, add to cart, and place an order.

### Phase 3: Mock AI + Fit Profile
- `server/mocks/aiMock.js` + `AI_MODE` switch + AI client module (`server/services/aiClient.js`) with timeout and error mapping
- Scan page (upload + camera), results view, save to fitProfile, re-scan, delete profile
- **Done when:** the scan flow works end to end against the mock, including every error message.

### Phase 4: Size recommendation
- Product page: recommended size badge + fit notes per size + fit preference toggle
- Friendly prompt to scan if no fit profile exists
- **Done when:** changing fit preference changes the recommendation (via the mock).

### Phase 5: Colors that suit you
- `suitsMe` filter/sort on shop page, "Suits you" tag on product cards
- **Done when:** products with matching colors are highlighted.

### Phase 6: Virtual try-on
- Try-on modal, long-running request UX, side-by-side result, "look vs fit" note
- Rate limit try-on per user (e.g. 10 per hour)
- **Done when:** try-on works against the mock with a 3 s delay and against errors.

### Phase 7: Switch to the real AI service
- `AI_MODE=real`, test every flow with the real service running locally
- Fix any contract mismatches (report them to me; don't silently change the contract)
- **Done when:** a real photo scan → size recommendation → try-on works end to end.

### Phase 8: Admin + polish + deploy
- Admin product CRUD with size chart editor
- Loading skeletons, empty states, 404 page, mobile check
- Deployment notes (e.g. client on Vercel/Netlify, server on Render/Railway, MongoDB Atlas),
  CORS and env setup for production
- **Done when:** the app is deployed and the demo flow works on my phone.
