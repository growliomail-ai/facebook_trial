require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

/* ===============================
   HEALTH CHECK
================================ */
app.get('/', (req, res) => {
  res.send('Messenger bot is running ✅');
});

/* ===============================
   WEBHOOK VERIFICATION (GET)
================================ */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* ===============================
   RECEIVE MESSAGES (POST)
================================ */
app.post('/webhook', (req, res) => {
  const entry = req.body.entry?.[0];
  const messaging = entry?.messaging?.[0];

  if (messaging?.message?.text) {
    const senderId = messaging.sender.id;
    const text = messaging.message.text;

    console.log('📩 Message:', text);

    sendMessage(senderId, `You said: ${text}`);
  }

  res.sendStatus(200);
});

/* ===============================
   SEND MESSAGE TO USER
================================ */
function sendMessage(psid, message) {
  axios.post(
    'https://graph.facebook.com/v18.0/me/messages',
    {
      recipient: { id: psid },
      message: { text: message }
    },
    {
      params: { access_token: PAGE_ACCESS_TOKEN }
    }
  ).catch(err => {
    console.error('❌ Send error:', err.response?.data || err.message);
  });
}

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
