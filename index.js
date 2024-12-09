const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = "EAAMtZBSvbeGgBO96SzxPRxxpjEUNzrkbByzUwVu1qEuH0hCwgPrbn89QCnFoA2QoMzLCZCX1SYAu36n03LydlCHBS2dnoF1lBlRQ929b6BpVK92sovkt1NaDqGhvZAgVDRPg6sjacuDRZCHQu4zDnQsKM8ZAJeOm7svqy53kQpAUCg1FEru4S4u2cTeHsYf51";
const VERIFY_TOKEN = "your_verify_token"; // Replace with your token

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && token === VERIFY_TOKEN) {
    console.log("Webhook Verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook to handle messages
app.post("/webhook", (req, res) => {
  const body = req.body;

  // Check if event is from a page subscription
  if (body.object === "page") {
    body.entry.forEach((entry) => {
      const webhookEvent = entry.messaging[0];
      console.log("Received webhook event:", webhookEvent);

      if (webhookEvent.message && webhookEvent.message.text) {
        const senderId = webhookEvent.sender.id;
        const receivedMessage = webhookEvent.message.text;

        // Echo the received message back
        sendMessage(senderId, `You said: ${receivedMessage}`);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Function to send messages
async function sendMessage(recipientId, text) {
  const url = `https://graph.facebook.com/v15.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  const payload = {
    recipient: { id: recipientId },
    message: { text: text },
  };

  try {
    const result = await axios.post(url, payload);
    console.log("Message sent to Facebook:", result.data);
  } catch (error) {
    console.error("Error sending message to Facebook:", error.response?.data || error.message);
  }
}

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
