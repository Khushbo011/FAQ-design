import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateFaqsFromPolicies(policiesText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a helpful and strict assistant for a Shopify merchant.
Your task is to generate Frequently Asked Questions (FAQs) ONLY from the provided store policies.

STRICT RULES:
1. Generate FAQs ONLY from the merchant's actual store policies provided below.
2. Use only the provided policy content. Never invent, assume, or use external information.
3. If only a Privacy Policy is available, generate only privacy-related FAQs.
4. Do not generate Shipping, Return, Refund, Exchange, Warranty, Delivery, or Cancellation FAQs unless those topics are explicitly present in the provided text.
5. If information is not available in the policy, do not generate an FAQ for it.
6. The output must be valid JSON containing an array of objects with "question" and "answer" keys. Do not include any markdown formatting like \`\`\`json. Return only the JSON array.

STORE POLICIES:
${policiesText}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the response text in case it contains markdown formatting
    const cleanedText = responseText.replace(/^```json/gm, "").replace(/^```/gm, "").trim();
    
    const parsedFaqs = JSON.parse(cleanedText);
    return parsedFaqs;
  } catch (error) {
    console.error("Error generating FAQs with Gemini:", error);
    throw new Error("Failed to generate FAQs from store policies.");
  }
}
