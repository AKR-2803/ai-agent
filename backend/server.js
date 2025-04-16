import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Get all chats
app.get('/api/chats', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM chats ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single chat with its messages
app.get('/api/chats/:id', async (req, res) => {
    try {
        const chatResult = await db.query(
            'SELECT * FROM chats WHERE id = $1',
            [req.params.id]
        );
        
        if (chatResult.rows.length === 0) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const messagesResult = await db.query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
            [req.params.id]
        );

        const chat = chatResult.rows[0];
        chat.messages = messagesResult.rows;

        res.json(chat);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new chat
app.post('/api/chats', async (req, res) => {
    try {
        const { title } = req.body;
        const result = await db.query(
            'INSERT INTO chats (title) VALUES ($1) RETURNING *',
            [title]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a message to a chat
app.post('/api/chats/:id/messages', async (req, res) => {
    try {
        const { user_message, ai_message } = req.body;
        console.log('Received message data:', { user_message, ai_message });
        const result = await db.query(
            'INSERT INTO messages (chat_id, user_message, ai_message) VALUES ($1, $2, $3) RETURNING *',
            [req.params.id, user_message, ai_message]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding message:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update chat title
app.put('/api/chats/:id', async (req, res) => {
    try {
        const { title } = req.body;
        const result = await db.query(
            'UPDATE chats SET title = $1 WHERE id = $2 RETURNING *',
            [title, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a chat
app.delete('/api/chats/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM chats WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json({ message: 'Chat deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 