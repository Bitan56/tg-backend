# Ashram Backend (Express + MongoDB + Cloudinary + Multer)

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/v1/products | List products (`?category=&search=`) |
| GET | /api/v1/products/:id | Single product |
| POST | /api/v1/products | Create (multipart: name, category, tag, description, originalPrice, discountPrice?, images[] or imageUrl) |
| PUT | /api/v1/products/:id | Update (same fields; `replaceImages=true` to replace images) |
| DELETE | /api/v1/products/:id | Delete product + Cloudinary images |

All responses: `{ success, data, message }`.

## Run locally
    npm install
    cp .env.example .env   # fill in values
    npm run dev

## Deploy to Vercel
    npm i -g vercel
    vercel            # then add the env vars in Project > Settings > Environment Variables
    vercel --prod

Set `BASE_URL` in your React `App.jsx` to the deployed URL (no trailing slash).
In MongoDB Atlas > Network Access, allow `0.0.0.0/0` (Vercel IPs are dynamic).
