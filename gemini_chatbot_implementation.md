# Gemini Chatbot Implementation Guide

This document explains the technical implementation of the AI chatbot in **ClinicConnect**, which uses **Google's Gemini API** with **Retrieval-Augmented Generation (RAG)** to provide real-time, context-aware answers about clinics and doctors.

## 1. Overview

The chatbot is designed to assist users by answering questions about:
- **Clinics**: Locations, specialties, working hours, and descriptions.
- **Doctors**: Names, specializations, experience, and their associated clinics.
- **General Platform Usage**: How to book appointments, login, etc.

It uses the `gemini-flash-latest` model for fast and accurate responses.

## 2. Architecture (RAG Pattern)

We use a **Retrieval-Augmented Generation (RAG)** pattern to make the chatbot "smart" about your specific database without fine-tuning the model.

1.  **User Query**: The user sends a message (e.g., "Clinics in Mankara").
2.  **Data Retrieval**: The backend ([user-backend/index.ts](file:///d:/Project/Clinic-Connect/user-backend/index.ts)) fetches the latest **Clinics** and **Doctors** data from the MongoDB database.
3.  **Context Construction**: The backend formats this raw data into a structured string (the "Context").
4.  **Prompt Engineering**: The system combines the **System Prompt** (instructions) + **Context** (data) + **User Message**.
5.  **Gemini API Call**: This combined prompt is sent to Google's Gemini API.
6.  **Response**: Gemini generates an answer based *only* on the provided context and its general knowledge.

## 3. Key Components

### A. Chatbot Service ([user-backend/services/chatbot.ts](file:///d:/Project/Clinic-Connect/user-backend/services/chatbot.ts))

This is the core service that communicates with Google's servers.

**Key Logic:**
- **Lazy Initialization**: It reads `GEMINI_API_KEY` inside the function to avoid initialization errors.
- **Context Injection**: It accepts a `contextData` string and appends it to the system prompt.
- **System Prompt**: Defines the persona (helpful assistant) and rules (be professional, concise).

```typescript
// user-backend/services/chatbot.ts

export async function getChatbotResponse(userMessage: string, contextData: string = ''): Promise<string> {
  // 1. Initialize API Client
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // 2. Construct Prompt with Context
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\nHere is the current specialized data you can use to answer questions:\n${contextData}` }],
      },
      // ...
    ],
  });

  // 3. Send Message
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}
```

### B. Chatbot Endpoint ([user-backend/index.ts](file:///d:/Project/Clinic-Connect/user-backend/index.ts))

This API route handles the RAG logic.

**Key Logic:**
- **Fetches Data**: Queries `clinics`, `clinicRegistrations` (approved only), and `doctors`.
- **Formats Data**: Iterates through the raw DB documents and creates a readable text summary (e.g., "Name: City Hospital, Location: Palakkad...").
- **Calls Service**: Passes the user's message and this formatted string to [getChatbotResponse](file:///d:/Project/Clinic-Connect/user-backend/services/chatbot.ts#26-63).

```typescript
// user-backend/index.ts

app.post('/api/chatbot', async (req, res) => {
  // 1. Fetch Data from DB
  const clinics = await db.collection('clinics').find({}).toArray();
  const doctors = await db.collection('doctors').find({}).toArray();

  // 2. Format Context String
  let contextData = "Here is the list of available clinics and doctors:\n\n";
  clinics.forEach(c => {
    contextData += `- Name: ${c.name}\n  Location: ${c.location}\n`;
  });
  // ... (similar for doctors)

  // 3. Get AI Response
  const reply = await getChatbotResponse(message, contextData);
  res.json({ reply });
});
```

## 4. Configuration

The implementation depends on the following environment variable in [.env.local](file:///d:/Project/Clinic-Connect/.env.local):

```
GEMINI_API_KEY=AIzaSy... (Your Google AI Studio Key)
```

## 5. Dependencies

- `@google/generative-ai`: The official Google SDK for Node.js.
