import { NextResponse } from 'next/server';
import { Pinecone } from 'pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const systemPrompt = `
You are a rate my professor agent to help students find classes, that takes in user questions and answers them.
For every user question, the top 3 professors that match the user question are returned.
Use them to answer the question if needed.
`;

export async function POST(req) {
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pc.index('rag2').namespace('ns1');

    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const text = data[data.length - 1].content;

    
    const embeddingResult = await genAI.embedContent({
        model: 'models/text-embedding-004',
        content: text,
        task_type: 'retrieval_document',
        title: 'User Query Embedding'
    });

    const embedding = embeddingResult.embedding;

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding
    });

    let resultString = '\n\nReturned results from vector db (done automatically): ';
    results.matches.forEach((match) => {
        resultString += `
        
        Professor: ${match.id}
        Review: ${match.metadata.review}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        
        `;
    });

    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    
    const chatSession = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
    }).startChat({
        generationConfig: {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192,
            responseMimeType: 'text/plain',
        },
        history: [
            { role: 'system', content: systemPrompt },
            ...lastDataWithoutLastMessage.map(message => ({ role: 'user', content: message.content })),
            { role: 'user', content: lastMessageContent }
        ],
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                const result = await chatSession.sendMessage("");
                const content = result.response.text();
                if (content) {
                    const text = encoder.encode(content);
                    controller.enqueue(text);
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream);
}
