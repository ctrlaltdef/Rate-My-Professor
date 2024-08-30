'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, Stack, TextField, CircularProgress } from '@mui/material';

export default function Home() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
  }]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!message.trim()) return; // Prevent sending empty messages

    setLoading(true);

    // Update messages state with new user message
    setMessages(prevMessages => [
      ...prevMessages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);

    
    setMessage('');

    try {
      // Send the message to the server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([...messages, { role: "user", content: message }])
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = '';

      // Read the response stream
      const readStream = async () => {
        const { done, value } = await reader.read();
        if (done) {
          setLoading(false);
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        
        
        setMessages(prevMessages => {
          let lastMessage = prevMessages[prevMessages.length - 1];
          let otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text }
          ];
        });

        return readStream();
      };

      await readStream();
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        borderRadius={4}
        p={2}
        spacing={3}
        bgcolor="background.paper"
        boxShadow={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
                boxShadow={2}
                maxWidth="75%"
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' ? sendMessage() : null}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
