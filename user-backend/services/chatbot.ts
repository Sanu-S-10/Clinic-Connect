const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

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

export async function getChatbotResponse(userMessage: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('[chatbot] OpenAI API key not configured');
    return 'I apologize, but the AI chatbot is not currently configured. Please contact support at miniprojecttt12@gmail.com for assistance.';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData: any = await response.json();
      console.error('[chatbot] OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 401) {
        console.error('[chatbot] API key is invalid or expired. Please check your OPENAI_API_KEY in .env.local');
        return 'Authentication error: Your API key is invalid or expired. Please check your OpenAI API key setup.';
      }

      if (response.status === 429) {
        return 'Sorry, I\'m currently unavailable due to high demand. Please try again in a moment.';
      }
      
      if (errorData.error?.message) {
        return `Error: ${errorData.error.message}`;
      }
      
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }

    const data: any = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }

    console.error('[chatbot] Unexpected response format:', data);
    return 'Sorry, I could not generate a response. Please try again.';
  } catch (error) {
    console.error('[chatbot] Error calling OpenAI API:', error instanceof Error ? error.message : error);
    return 'Sorry, I encountered an error. Please try again later or contact support at miniprojecttt12@gmail.com.';
  }
}

export default getChatbotResponse;
