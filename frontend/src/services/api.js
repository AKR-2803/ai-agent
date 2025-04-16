const API_URL = 'http://localhost:3001/api';

export const api = {
    // Get all chats
    getChats: async () => {
        try {
            const response = await fetch(`${API_URL}/chats`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch chats: ${errorData.error || response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Error in getChats:', error);
            throw error;
        }
    },

    // Get a single chat with messages
    getChat: async (id) => {
        try {
            const response = await fetch(`${API_URL}/chats/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch chat: ${errorData.error || response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Error in getChat:', error);
            throw error;
        }
    },

    // Create a new chat
    createChat: async (title) => {
        try {
            const response = await fetch(`${API_URL}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to create chat: ${errorData.error || response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Error in createChat:', error);
            throw error;
        }
    },

    // Add a message to a chat
    addMessage: async (chatId, user, ai) => {
        try {
            console.log('Adding message to chat:', { chatId, user, ai });
            const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    user_message: user, 
                    ai_message: ai 
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to add message: ${errorData.error || response.statusText}`);
            }
            const data = await response.json();
            console.log('Message added successfully:', data);
            return data;
        } catch (error) {
            console.error('Error in addMessage:', error);
            throw error;
        }
    },

    // Update chat title
    updateChatTitle: async (chatId, title) => {
        try {
            const response = await fetch(`${API_URL}/chats/${chatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to update chat title: ${errorData.error || response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Error in updateChatTitle:', error);
            throw error;
        }
    },

    // Delete a chat
    deleteChat: async (chatId) => {
        try {
            const response = await fetch(`${API_URL}/chats/${chatId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to delete chat: ${errorData.error || response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Error in deleteChat:', error);
            throw error;
        }
    },
}; 