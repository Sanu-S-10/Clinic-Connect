

// Import Google Generative AI
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are a helpful AI assistant for ClinicConnect, a healthcare discovery and appointment booking platform in India. 

About ClinicConnect:
- It's a platform to find and book appointments at premium clinics and hospitals
- Users can browse clinics, view doctor profiles, check timings and services
- Both patients and clinic admins can use the platform
- Features include clinic discovery, doctor profiles, easy booking, and secure authentication

Your responsibilities:
1. Answer questions about how to use ClinicConnect
2. Help users understand features like clinic discovery, doctor profiles, appointment booking
3. Explain how to create accounts (patient or clinic admin)
4. Provide guidance on booking appointments
5. Help with password recovery and account management
6. Answer questions about clinic information visibility
7. Be friendly, professional, and concise
8. If asked about something not related to ClinicConnect, politely redirect to the platform

Always be helpful and encourage users to explore the platform. If you can't answer something specific, suggest they contact support at miniprojecttt12@gmail.com.`;

export async function getChatbotResponse(userMessage: string, contextData: string = ''): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PLACEHOLDER_API_KEY') {
    console.warn('[chatbot] Gemini API key not configured');
    return 'I apologize, but the AI chatbot is not currently configured. Please contact support at miniprojecttt12@gmail.com for assistance.';
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\nHere is the current specialized data you can use to answer questions:\n${contextData}` }], // Initial system prompt + context
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to assist as the ClinicConnect AI assistant with the provided data." }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('[chatbot] Error calling Gemini API:', error instanceof Error ? error.message : error);
    return 'Sorry, I encountered an error. Please try again later or contact support at miniprojecttt12@gmail.com.';
  }
}

export default getChatbotResponse;
