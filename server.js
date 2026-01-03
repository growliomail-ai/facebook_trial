// import express from "express";
// import bodyParser from "body-parser";
// import axios from "axios";

// const app = express();
// app.use(bodyParser.json());

// const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// // Health check
// app.get("/", (req, res) => {
//   res.send("Messenger bot is running 🚀");
// });

// // Webhook verification
// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === VERIFY_TOKEN) {
//     console.log("Webhook verified");
//     return res.status(200).send(challenge);
//   }
//   return res.sendStatus(403);
// });

// // Receive messages
// app.post("/webhook", async (req, res) => {
//   const entry = req.body.entry?.[0];
//   const event = entry?.messaging?.[0];

//   if (!event) return res.sendStatus(200);

//   const senderId = event.sender.id;

//   if (event.message?.text) {
//     const text = event.message.text;
//     console.log("Message received:", text);
//     await sendMessage(senderId, `You said: ${text}`);
//   }

//   res.status(200).send("EVENT_RECEIVED");
// });

// // Send message to FB
// async function sendMessage(senderId, text) {
//   try {
//     const response = await axios.post(
//       "https://graph.facebook.com/v18.0/me/messages",
//       {
//         recipient: { id: senderId },
//         message: { text }
//       },
//       {
//         params: {
//           access_token: process.env.PAGE_ACCESS_TOKEN
//         }
//       }
//     );

//     console.log("Message sent:", response.data);
//   } catch (err) {
//     console.error(
//       "Send message error:",
//       err.response?.data || err.message
//     );
//   }
// }

// // Start server
// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import db from "./config/db.js";

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// health
app.get("/", (req, res) => {
  res.send("Messenger SaaS running 🚀");
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// verify webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// webhook receive
app.post("/webhook", async (req, res) => {
  console.log("WEBHOOK HIT", JSON.stringify(req.body));
  try {
    const entry = req.body.entry?.[0];
    const event = entry?.messaging?.[0];
    if (!event) return res.sendStatus(200);

    const pageId = event.recipient.id;
    const senderId = event.sender.id;
    const text = event.message?.text;
    if (!text) return res.sendStatus(200);

    const [rows] = await db.query(
      "SELECT page_access_token FROM pages WHERE page_id = ?",
      [pageId]
    );

    if (!rows.length) {
      console.log("No token for page:", pageId);
      return res.sendStatus(200);
    }

    await axios.post(
      "https://graph.facebook.com/v18.0/me/messages",
      {
        recipient: { id: senderId },
        message: { text: `You said: ${text}` }
      },
      {
        params: { access_token: rows[0].page_access_token }
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("SEND ERROR:", err.response?.data || err.message || err);
    res.sendStatus(200);
  }
});


const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
