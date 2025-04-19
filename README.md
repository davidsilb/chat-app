# Chat AI Compiler & Groq Model Checker

A multi-container application that combines:

1. **Chat AI Compiler** – A frontend interface to query multiple AI model endpoints concurrently, view responses in grid/list layouts, and export results to CSV.
2. **Groq Model Checker** – A utility that fetches available models from the Groq API and displays them in a CLI table.

## Features

- Select from a variety of AI models and get responses in parallel.
- Toggle between grid and list views for responses.
- Export chat history and responses to CSV.
- Fetch and display Groq model metadata (ID, owner, context window, max tokens).
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
   CLOUDFLARED_TOKEN=your_cloudflared_token_here  # optional
   ```
   - **Using CMD (Windows):**

  ```cmd
  echo GROQ_API_KEY=your_groq_api_key_here > .env
  echo CLOUDFLARED_TOKEN=your_cloudflared_token_here >> .env
  ```
    - **Using Bash (Linux):**

  ```bash
  echo "GROQ_API_KEY=your_groq_api_key_here" > .env
  echo "CLOUDFLARED_TOKEN=your_cloudflared_token_here" >> .env
  ```

3. **Build and run all services**

   ```bash
   docker-compose up --build
   ```

   - The **web** service (port 3000) serves the frontend and backend API.
   - The **groq-models** service (dev profile) fetches model metadata once.
   - The **cloudflared** service tunnels your web UI to a public HTTPS URL.

4. **Access the application**

   - Visit [http://localhost:3000](http://localhost:3000) locally.
   - Or use the Cloudflare Tunnel URL printed in the `cloudflared` logs/dashboard.

5. **Fetch Groq models (optional dev option)**

   To run the model-checker independently:

   ```bash
   docker-compose --profile dev up groq-models
   ```

   Or from the host (requires Node.js):

   ```bash
   cd groq-model-checker
   npm install
   npm start
   ```

## Project Structure

```bash
.
├── docker-compose.yml            # Multi-container setup
├── README.md                     # HELLO WORLD =)
├── .gitignore                    # ignore the .env =)
├── .env                          # Environment variables (not committed)
├── groq-model-checker/
│   ├── Dockerfile                # Docker build for Groq model checker
│   ├── package.json              # Groq model checker dependencies
│   └── fetchGroqModels.js        # CLI script to list Groq models
└── web/
    ├── Dockerfile                # Docker build for frontend + backend
    ├── package.json              # Express server dependencies
    ├── index.html                # Frontend UI for chat compiler
    └── server.js                 # Express app defining `/api/chat/*` routes
```

## Frontend Usage

1. Select one or more AI services.
2. Enter your message and click **Send**.
3. View responses in grid or list layout.
4. Export the conversation and responses to CSV at any time.

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
