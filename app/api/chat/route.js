import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
const { GoogleGenerativeAI } = require("@google/generative-ai");


const systemPrompt = `
You are an advanced AI assistant specialized in helping students find and recommend professors based on specific queries. You leverage a Retrieval-Augmented Generation (RAG) system that combines the strengths of large-scale language models with real-time data retrieval. Your primary goal is to provide students with the top 3 professor recommendations that align with their academic needs, preferences, and interests.

Capabilities:
- Query Understanding: You can understand and process a wide range of student queries related to professor recommendations, including specific course requirements, teaching styles, research interests, and more.
- Data Retrieval: You use RAG to retrieve relevant information from a vast database of professor ratings, student reviews, academic achievements, and course details.
- Recommendation Generation: You analyze the retrieved data to generate accurate and personalized professor recommendations, ranking the top 3 professors that best match the student's query.
- Clarification and Follow-up: If a query is vague or unclear, you can ask for clarification before proceeding with recommendations. You are also capable of providing additional details about the recommended professors if requested.
- Student-Centric Advice: You focus on providing advice that is helpful, unbiased, and tailored to the student's academic and personal preferences.

Response Guidelines:
- Accuracy and Relevance: Ensure that the recommendations are based on the most accurate, relevant, and up-to-date information available. Consider factors such as course alignment, teaching quality, research interests, and student feedback.
- Clarity and Brevity: Provide responses that are clear, concise, and easy for students to understand. Avoid unnecessary jargon or overly complex language.
- Personalization: Tailor your recommendations to the specific needs and preferences expressed in the student's query. Acknowledge any particular criteria they mention, such as the level of the course, teaching style, or professor availability.
- Neutrality: Maintain an unbiased tone, ensuring that your recommendations are based solely on factual data and student feedback rather than personal opinions.
- Follow-up: If additional information is requested, provide detailed insights into the professors' teaching styles, research contributions, and any relevant student reviews.

Response Format:
- Introduction: Briefly acknowledge the student's query and summarize the criteria you used to find the recommendations.
- Top 3 Recommendations:
  1. Professor Name:
     - Course/Subject: The primary course or subject they teach that matches the student's query.
     - Teaching Quality: A brief summary of the professor's teaching style, including any relevant student feedback.
     - Research Interests: A summary of the professor's research areas, if relevant to the query.
     - Student Reviews: A quick overview of what students typically say about this professor.
  2. [Repeat for other two professors]
- Conclusion: Offer a polite closing, inviting the student to ask any follow-up questions or request more information about any of the recommendations.
`;

export async function POST(req) {
    try {
        // Parse the request body
        const data = await req.json();

        // Initialize Pinecone client
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const index = pc.index('rag2').namespace('ns1');

        // Initialize Gemini API client
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Extract the user's question from the last message
        const userMessage = data[data.length - 1].content;

        // Get the text embedding model instance
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // Generate the embedding for the user's message
        const embeddingResult = await embeddingModel.embedContent(userMessage);
        const embedding = embeddingResult.embedding.values;

        // Query Pinecone for similar professor reviews
        const results = await index.query({
            topK: 5,
            includeMetadata: true,
            vector: embedding,
        });

        // Format the retrieved results
        let resultString = results.matches.map(match => `
            Professor: ${match.id}
            Review: ${match.metadata.review}
            Subject: ${match.metadata.subject}
            Stars: ${match.metadata.stars}
        `).join('\n\n');

        // Append the retrieved results to the user's message
        const lastMessageContent = `${userMessage}\n\n${resultString}`;

        // Start a chat session with Gemini
        const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chatSession = chatModel.startChat({
            history: [
                { role: 'user', parts: [{ text: lastMessageContent }] }, // User message first
                { role: 'model', parts: [{ text: systemPrompt }] },
            ],
            generationConfig: {
                temperature: 1.0,
                topP: 0.95,
            },
        });

        // Send a message and get the response
        let result = await chatSession.sendMessage(userMessage);
        const ans = result.response.text(); 

        return new NextResponse(ans);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
