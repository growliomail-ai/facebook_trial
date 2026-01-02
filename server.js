import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Health check
app.get("/", (req, res) => {
  res.send("Messenger bot is running 🚀");
});

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Receive messages
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const event = entry?.messaging?.[0];

  if (!event) return res.sendStatus(200);

  const senderId = event.sender.id;

  if (event.message?.text) {
    const text = event.message.text;
    console.log("Message received:", text);
    await sendMessage(senderId, `You said: ${text}`);
  }

  res.status(200).send("EVENT_RECEIVED");
});

// Send message to FB
async function sendMessage(senderId, text) {
  try {
    const response = await axios.post(
      "https://graph.facebook.com/v18.0/me/messages",
      {
        recipient: { id: senderId },
        message: { text }
      },
      {
        params: {
          access_token: process.env.PAGE_ACCESS_TOKEN
        }
      }
    );

    console.log("Message sent:", response.data);
  } catch (err) {
    console.error(
      "Send message error:",
      err.response?.data || err.message
    );
  }
}

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
