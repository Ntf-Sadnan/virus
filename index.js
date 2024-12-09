const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Tokens directly in the file
const PAGE_ACCESS_TOKEN = "EAAMtZBSvbeGgBO96SzxPRxxpjEUNzrkbByzUwVu1qEuH0hCwgPrbn89QCnFoA2QoMzLCZCX1SYAu36n03LydlCHBS2dnoF1lBlRQ929b6BpVK92sovkt1NaDqGhvZAgVDRPg6sjacuDRZCHQu4zDnQsKM8ZAJeOm7svqy53kQpAUCg1FEru4S4u2cTeHsYf51";
const GROQ_API_KEY = "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";
const VERIFY_TOKEN = "your_verify_token";

// Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook Verified");
    res.status(200).send(challenge);
  } else {
    console.log("Webhook Verification Failed");
    res.sendStatus(403);
  }
});

// Handle Incoming Messages
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const userMessage = event.message.text;

        // Get Groq API response
        const botReply = await getGroqReply(userMessage);

        // Send response back to Facebook Messenger
        await sendMessage(senderId, botReply);
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Send message to Facebook Messenger
async function sendMessage(recipientId, text) {
  const url = `https://graph.facebook.com/v15.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  const payload = {
    recipient: { id: recipientId },
    message: { text: text },
  };

  try {
    await axios.post(url, payload);
    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:", error.response.data);
  }
}

// Get reply from Groq API
async function getGroqReply(userMessage) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${GROQ_API_KEY}`,
    "Content-Type": "application/json",
  };
  const data = {
    messages: [{ role: "user", content: userMessage }],
    model: "llama3-8b-8192",
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching Groq reply:", error.response.data);
    return "Sorry, I couldn't process that.";
  }
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
