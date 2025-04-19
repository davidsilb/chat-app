import fetch from "node-fetch";
import dotenv from "dotenv";
import Table from "cli-table3";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY; //different way of doing this

if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY not found in .env file");
  process.exit(1);
}

async function fetchModels() {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();

    const table = new Table({
      head: ["Model ID", "Owner", "Context Tokens", "Max Tokens"],
      colWidths: [45, 20, 18, 15],
      wordWrap: true,
    });

    data.data.forEach((model) => {
      table.push([
        model.id,
        model.owned_by,
        model.context_window,
        model.max_completion_tokens,
      ]);
    });

    console.log(table.toString());
  } catch (err) {
    console.error("Error fetching models:", err.message);
  }
}

fetchModels();