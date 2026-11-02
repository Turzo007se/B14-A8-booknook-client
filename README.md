# BookNook

A small online library for discovering, sharing, borrowing, and returning books.

## Client app

This repository contains the BookNook Next.js App Router client. The interface includes a responsive home page, searchable collection, book details, account forms, contributor management, and borrow/return views.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and set the values for your environment.
3. Run `npm install` and `npm run dev`.
4. Open http://localhost:3000.

## Features

- Browse a responsive book collection and filter by title, author, or category.
- View book descriptions, availability, contributor details, and borrow options.
- Add, edit, and delete contributed books.
- Track borrowed books and return them to update availability.
- Use responsive layouts for phone, tablet, and desktop screens.
- Display toast feedback and a custom not-found page.
- Browse a three-slide Swiper carousel and see the latest six books.
- Upload book covers to ImgBB when an API key is configured.

## Connected services

The assignment's server repository is [B14-A8-booknook-server](https://github.com/Turzo007se/B14-A8-booknook-server). Configure its URL as `NEXT_PUBLIC_API_URL` to connect the Express API. Set `NEXT_PUBLIC_IMGBB_API_KEY` to enable direct cover uploads. Authentication requires a Better Auth secret and MongoDB connection; Google OAuth requires Google client credentials.

Live website: https://booknook-client-two.vercel.app.\n\nWhen running without a configured API, the interface uses demo accounts, books, and borrows stored in browser local storage; the deployed site should be configured with the production API and Better Auth environment variables.

## Environment variables

See `.env.example` for the client and Better Auth configuration keys.

