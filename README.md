# Chat AI Compiler container || Cloudflared tunnel container || mongoDB inside

A multi-container application that combines:

1. **Chat AI Compiler** – A frontend interface to query multiple AI model endpoints concurrently, view responses in grid/list layouts, and export results to CSV.
2. **Cloudflared tunnel** – a tunnel to push <http://0.0.0.0:3000> to public.
3. **mongoDB** – a non-relational db to store stuff, using moongoose to interface with.

## DEV_Log

- f me wtf is this??? 2hrs of vibeazz, and this garbage is useless, USE IT

   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate
   ```

~~- i am so f-ing done building cloudflared tunnel in dev work~~USE THIS?
<pre><code class="language-bash">docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build</code></pre></del>

- old way (production way)

   ```bash
   docker-compose up --build
   ```

- “Don’t start `cloudflared` until `web` passes its healthcheck.”

   ```bash
   cloudflared:
   depends_on:
    web:
      condition: service_healthy
   ```

- “Don’t start `cloudflared` until `web` passes its healthcheck.”

   ```bash
   omg, so done/down
   ```

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

   ```bash
   db.users.find().pretty()
   ```

- ~~Delete/rebuild BOTH Cloudflared and Chat AI Compiler containers after each run to avoid tunnel not working on new runs. Can also delete in Docker Desktop if you are using GUI tools.~~ FIXED!!! docker compose down is now working with exit code 0 on both containers

- commands to clear up docker issues

   ```bash
   docker-compose down --volumes --remove-orphans
   ```

   ```bash
   docker-compose build --no-cache
   ```

- removes ALL build cache

   ```bash
   docker builder prune --all --force
   ```

- removes unused volumes not currently attached to containers

   ```bash
   docker volume prune --force
   ```

- removes unused images (not just dangling)

   ```bash
   docker image prune --all --force
   ```

## Features

- Select from a variety of AI models and get responses forEach looped.
- Toggle between grid and list views for responses.
- Export chat history and responses to CSV.
- Expose the web UI via Cloudflare Tunnel for secure public access.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (including Docker Compose)
- A Groq API key (set in `.env` as `GROQ_API_KEY`)
- SESSION_SECRET='anything-in-here' (set in `.env`)
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
   SESSION_SECRET=anything_in_here
   CLOUDFLARED_TOKEN=your_cloudflared_token_here  # optional
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
├── docker-compose.yml             # Docker Compose setup (app + MongoDB)
├── README.md                      # Project overview and instructions
├── .gitignore                     # Ignore .env
├── .env                           # YOU MAKE (not committed)
├── .env.example                   # Public template for .env setup
└── web/
    ├── Dockerfile                 # Dockerfile to build the web server
    ├── package.json               # Express server dependencies
    ├── server.js                  # Main Express app (routes, auth, API handlers)
    ├── public/
    │   ├── dashboard.html         # Dashboard page (protected)
    │   ├── index.html             # Main chat compiler UI using oldGroq.js
    │   ├── login.html             # Login page
    │   ├── register.html          # Register page
    │   └── logos/                 # a cancer in this product
    │       ├── cute_logo.png      # the only file that should be in here
    │       ├── asdlkj;fhgglk;jhdsfag;hlkjn #F### 
    │       ├── afdgdagaklj;adfgl;kjgfd;lkjaf #F###
    ├── mongo/
    │   └── ChatSession.js         # Mongoose schema (store chats)
    ├── models/
    │   └── User.js                # Mongoose schema for users (auth)
    └── routes/
        ├── addTagToResponse.js    # tag msgs func, implemented in index
        ├── exportTxt.js           # Export chat history as .txt
        └── groqHandler.js         # Handle single model chat completions
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
