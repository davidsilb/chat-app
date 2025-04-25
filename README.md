# Chat AI Compiler container || Cloudflared tunnel container || mongoDB inside

A multi-container application that combines:

1. **Chat AI Compiler** – A frontend interface to query multiple AI model endpoints concurrently, view responses in grid/list layouts, and export results to CSV.
2. **Cloudflared tunnel** – a tunnel to push http://0.0.0.0:3000 to public.
3. **mongoDB** – a non-relational db to store stuff, using moongoose to interface with.

## DEV_Log

- mongoDB has just been setup, testing done, saves to db; testing steps below

   ```bash
   docker exec -it mongo-db mongosh
   ```

   ```bash
   use chatai
   ```

   ```bash
   show collections
   ```

   ```bash
   db.chatsessions.find().pretty()
   ```

- ~~Delete/rebuild BOTH Cloudflared and Chat AI Compiler containers after each run to avoid tunnel not working on new runs. Can also delete in Docker Desktop if you are using GUI tools.~~ FIXED!!! docker compose down is now working with exit code 0 on both containers

- commands to clear up docker issues

   ```bash
   docker-compose down --volumes --remove-orphans
   ```

   ```bash
   docker-compose build --no-cache
   ```

   ```bash
   docker builder prune --all --force  # removes ALL build cache
   ```

   ```bash
   docker volume prune --force         # removes unused volumes not currently attached to containers
   ```

   ```bash
   docker image prune --all --force    # removes unused images (not just dangling)
   ```

## Features

- Select from a variety of AI models and get responses forEach looped.
- Toggle between grid and list views for responses.
- Export chat history and responses to CSV.
- Expose the web UI via Cloudflare Tunnel for secure public access.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (including Docker Compose)
- A Groq API key (set in `.env` as `GROQ_API_KEY`)
- (Optional) A Cloudflare Tunnel token (set in `.env` as `CLOUDFLARED_TOKEN`)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/davidsilb/chat-app.git
   cd chat-app
   ```

2. **Create your `.env` file**

   ```ini
   GROQ_API_KEY=your_groq_api_key_here
   MONGO_URI=mongodb://mongo:27017/chatai
   CLOUDFLARED_TOKEN=your_cloudflared_token_here  # optional
   ```

   **Using CMD (Windows):**

   ```cmd
   echo GROQ_API_KEY=your_groq_api_key_here > .env
   MONGO_URI=mongodb://mongo:27017/chatai
   echo CLOUDFLARED_TOKEN=your_cloudflared_token_here >> .env # optional
   ```

   **Using Bash (Linux):**

   ```bash
   echo "GROQ_API_KEY=your_groq_api_key_here" > .env
   MONGO_URI=mongodb://mongo:27017/chatai >> .env
   echo "CLOUDFLARED_TOKEN=your_cloudflared_token_here" >> .env # optional
   ```

3. **Build and run all services**

   ```bash
   docker-compose up --build
   ```

   - The **web** service (port 3000) serves the frontend and backend API.
   - The **cloudflared** service tunnels your web UI to a public HTTPS URL.

4. **Access the application**

   - Visit [http://localhost:3000](http://localhost:3000) locally.
   - Or use the Cloudflare Tunnel URL printed in the `cloudflared` logs/dashboard.

## Project Structure

```bash
.
├── docker-compose.yml            # Multi-container setup
├── README.md                     # HELLO WORLD =)
├── .gitignore                    # ignore the .env =)
├── .env                          # Environment variables (not committed)
├── .env.example                  # Public template with empty keys
└── web/
    ├── Dockerfile                # Docker build for frontend + backend
    ├── package.json              # Express server dependencies
    ├── server.js                 # Express app defining `/api/chat/*` routes
    ├── public/
    │   └── index.html            # Frontend UI for chat compiler
    └── mongo/
        └── ChatSessions.js       # Separate to avoid issues in server.js
```

## Frontend Usage

1. Select one or more AI services.
2. Enter your message and click **Send**.
3. View responses in grid or list layout.
4. Export the conversation and responses to CSV at any time.
5. Leaderboard (beta) - index.html contained

## Contributing

1. Fork the repo and create your branch:

   ```bash
   git checkout -b feature/XYZ
   ```

2. Commit your changes:

   ```bash
   git commit -m "Add XYZ feature"
   ```

3. Push to your branch:

   ```bash
   git push origin feature/XYZ
   ```

4. Open a Pull Request.

## License

This project is licensed under the MIT License.
