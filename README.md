# StreamFlix Full Stack

A resume-ready Netflix-inspired full stack streaming dashboard built with Node.js and vanilla JavaScript. The app includes authentication-style flows, a REST API, catalog search, genre/type filters, watchlist persistence, and continue-watching progress.

## Features

- Responsive streaming dashboard with hero title, catalog, watchlist, viewing progress, and plan cards
- Node.js backend using the built-in HTTP module
- REST APIs for auth, catalog, genres, stats, watchlist, and progress
- JSON file persistence in `data/db.json`
- Demo account for quick testing
- No external backend dependencies, so the project runs easily on any machine with Node.js

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js REST API
- Database: JSON file storage
- Assets: Local SVG/logo and background image

## Demo Login

```text
Email: demo@streamflix.com
Password: password123
```

## Run Locally

```bash
cd "Netflix Full Stack"
npm start
```

Open:

```text
http://127.0.0.1:3000
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Server health check |
| POST | `/api/auth/login` | Sign in and receive a token |
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/logout` | Remove current session |
| GET | `/api/me` | Get signed-in user |
| GET | `/api/catalog` | List and filter titles |
| GET | `/api/featured` | Get featured hero title |
| GET | `/api/genres` | Get catalog genres |
| GET | `/api/stats` | Get dashboard stats |
| GET | `/api/watchlist` | Get signed-in user's watchlist |
| POST | `/api/watchlist/:id` | Add title to watchlist |
| DELETE | `/api/watchlist/:id` | Remove title from watchlist |
| POST | `/api/progress/:id` | Save continue-watching progress |

## Resume Highlights

- Built a full stack streaming platform clone with custom REST APIs and client-side state management.
- Implemented token-based session handling, protected watchlist routes, and persistent JSON storage.
- Designed a responsive UI with catalog filtering, authenticated user state, and dynamic rendering from backend data.

## Project Structure

```text
Netflix Full Stack/
  data/
    db.json
  public/
    assets/
      bg.jpg
      logo.svg
    app.js
    index.html
    styles.css
  package.json
  server.js
```
