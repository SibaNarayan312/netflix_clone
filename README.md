# StreamFlix Full Stack — Automated DevOps Deployment

A resume-ready Netflix-inspired full stack streaming dashboard built from scratch using Node.js and vanilla JavaScript.

The application includes authentication-style flows, a REST API, catalog search, genre/type filters, watchlist persistence, and continue-watching progress.

The project has been extended with an automated DevOps deployment pipeline using **GitHub, Jenkins, Docker, and GitHub Webhooks**. Every push to the `main` branch can automatically trigger a Jenkins build that creates a new Docker image and deploys the latest version of the application.

---

## 🚀 Features

### Application Features

- Responsive streaming dashboard with hero title, catalog, watchlist, viewing progress, and plan cards
- Node.js backend using the built-in HTTP module
- REST APIs for authentication, catalog, genres, stats, watchlist, and progress
- JSON file persistence in `data/db.json`
- Demo account for quick testing
- Catalog search and filtering
- Genre/type filters
- Watchlist management
- Continue-watching progress
- No external backend dependencies, so the project runs easily on any machine with Node.js

### DevOps Features

- Dockerized Node.js application
- Jenkins automated deployment
- GitHub Webhook integration
- Automated Docker image building
- Automated container replacement
- Build-number-based Docker image tagging
- GitHub push-triggered deployment

---

## 🛠️ Tech Stack

### Application

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js REST API
- **Database:** JSON file storage
- **Assets:** Local SVG/logo and background image

### DevOps

- **Version Control:** Git & GitHub
- **Containerization:** Docker
- **CI/CD Automation:** Jenkins
- **Webhook:** GitHub Webhooks
- **Local Tunnel:** ngrok

---

## 🔐 Demo Login

```text
Email: demo@streamflix.com
Password: password123