import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();

// Body parser
app.use(bodyParser.json());

// ENV variables
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Health check
app.get("/", (req, res) => {
  res.send("Facebook Messenger Bot is running 🚀");
});

// Webhook verification (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receive messages (POST)
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const messaging = entry?.messaging?.[0];

  if (!messaging) {
    return res.sendStatus(200);
  }

  const senderId = messaging.sender.id;

  // If user sent a message
  if (messaging.message?.text) {
    const userMessage = messaging.message.text;
    console.log("Message received:", userMessage);

    await sendMessage(senderId, `You said: ${userMessage}`);
  }

  res.status(200).send("EVENT_RECEIVED");
});

// Send message to Facebook
async function sendMessage(senderId, text) {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: senderId },
      message: { text }
    })
  });
}

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
