import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { api } from './services/api';
import "./App.css";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function App() {
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [promptText, setPromptText] = useState("");
    const [responseText, setResponseText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ show: false, chatId: null });

    // Load chats from the database
    useEffect(() => {
        loadChats();
    }, []);

    async function loadChats() {
        try {
            const loadedChats = await api.getChats();
            // ensure each chat has a messages array
            const chatsWithMessages = await Promise.all(loadedChats.map(async (chat) => {
                const chatWithMessages = await api.getChat(chat.id);
                return {
                    ...chat,
                    messages: chatWithMessages.messages || []
                };
            }));
            setChats(chatsWithMessages);
            
            // get chat ID from URL or use first chat
            const urlParams = new URLSearchParams(window.location.search);
            const chatId = urlParams.get('chat');
            
            if (chatId && chatsWithMessages.find(chat => chat.id === parseInt(chatId))) {
                setCurrentChatId(parseInt(chatId));
            } else if (chatsWithMessages.length > 0) {
                setCurrentChatId(chatsWithMessages[0].id);
            } else {
                // If no chats exist, create a new one
                const newChat = await api.createChat("New Chat");
                setChats([{ ...newChat, messages: [] }]);
                setCurrentChatId(newChat.id);
            }
        } catch (error) {
            console.error('Failed to load chats:', error);
        }
    }

    // update URL when current chat changes
    useEffect(() => {
        if (currentChatId) {
            const url = new URL(window.location.href);
            url.searchParams.set('chat', currentChatId);
            window.history.pushState({}, '', url);
        }
    }, [currentChatId]);

    async function createNewChat() {
        try {
            const newChat = await api.createChat("New Chat");
            const chatWithMessages = { ...newChat, messages: [] };
            setChats(prevChats => [chatWithMessages, ...prevChats]);
            setCurrentChatId(newChat.id);
            setPromptText("");
            setResponseText("");
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    }

    async function handleAPI(prompt) {
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

            setIsLoading(true);
            console.log('Sending request to Gemini API...');

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Error occurred. HTTP status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response from Gemini API:', data);
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format from Gemini API');
            }

            const aiResponse = data.candidates[0].content.parts[0].text;
            console.log('AI Response:', aiResponse);
            
            setResponseText(aiResponse);
            
            // Save message to database
            if (currentChatId) {
                console.log('Saving message to database for chat:', currentChatId);
                try {
                    await api.addMessage(currentChatId, prompt, aiResponse);
                    console.log('Message saved successfully');
                    
                    // update chat title with first message if it's the first message
                    const currentChat = await api.getChat(currentChatId);
                    if (currentChat.messages.length === 1) {
                        await api.updateChatTitle(currentChatId, prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''));
                    }
                    
                    // reload chats to get updated data
                    await loadChats();
                    console.log('Chats reloaded successfully');
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    throw dbError;
                }
            } else {
                console.error('No current chat ID available');
            }

            setIsLoading(false);
        } catch (e) {
            console.error("Error in handleAPI:", e);
            setIsLoading(false);
        }
    }

    function handleSubmit() {
        if (promptText.trim()) {
            if (!currentChatId) {
                // if no current chat, create one
                createNewChat().then(() => {
                    handleAPI(promptText);
                });
            } else {
                handleAPI(promptText);
            }
            setPromptText("");
        }
    }

    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    // custome components for markdown rendering
    const MarkdownComponents = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'plaintext';
            
            return !inline ? (
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: '1rem 0',
                        borderRadius: '0.5rem',
                        padding: '1rem'
                    }}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        p({ children }) {
            return <p className="message-text">{children}</p>;
        },
    };

    async function handleDeleteChat(chatId, event) {
        event.stopPropagation(); // prevent chat selection when clicking delete
        setDeleteDialog({ show: true, chatId });
    }

    async function confirmDelete() {
        try {
            await api.deleteChat(deleteDialog.chatId);
            
            // if deleted chat was the current chat, select another chat
            if (deleteDialog.chatId === currentChatId) {
                const remainingChats = chats.filter(chat => chat.id !== deleteDialog.chatId);
                if (remainingChats.length > 0) {
                    setCurrentChatId(remainingChats[0].id);
                } else {
                    setCurrentChatId(null);
                }
            }
            
            // update chats list
            setChats(prevChats => prevChats.filter(chat => chat.id !== deleteDialog.chatId));
            setDeleteDialog({ show: false, chatId: null });
        } catch (error) {
            console.error('Oops!! Failed to delete chat:', error);
        }
    }

    function cancelDelete() {
        setDeleteDialog({ show: false, chatId: null });
    }

    return (
        <div className="App">
            <div className="chat-history">
                <button className="new-chat-btn" onClick={createNewChat}>
                    + New Chat
                </button>
                <h2>Chat History</h2>
                <ul>
                    {chats.map((chat) => (
                        <li 
                            key={chat.id}
                            className={chat.id === currentChatId ? 'active' : ''}
                            onClick={() => setCurrentChatId(chat.id)}
                        >
                            <div className="chat-info">
                                <p className="chat-title">{chat.title}</p>
                                <p className="chat-date">
                                    {new Date(chat.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button 
                                className="delete-chat-btn"
                                onClick={(e) => handleDeleteChat(chat.id, e)}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* delete confirmation dialog box */}
            {deleteDialog.show && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h3>Delete Chat</h3>
                        <p>The chat will be deleted permanently</p>
                        <div className="dialog-buttons">
                            <button className="cancel-btn" onClick={cancelDelete}>
                                Cancel
                            </button>
                            <button className="delete-btn" onClick={confirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="main-content">
                <div className="response-area">
                    {chats.find(chat => chat.id === currentChatId)?.messages?.map((msg, index) => (
                        <div key={index} className="message">
                            <div className="user-message">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={MarkdownComponents}
                                >
                                    {msg.user_message}
                                </ReactMarkdown>
                            </div>
                            <div className="ai-message">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={MarkdownComponents}
                                >
                                    {msg.ai_message}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message">
                            <div className="user-message">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={MarkdownComponents}
                                >
                                    {promptText}
                                </ReactMarkdown>
                            </div>
                            <div className="ai-message loading">
                                <p>Thinking</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="textarea">
                    <textarea 
                        name="prompt"
                        id="prompt"
                        placeholder="Enter your message..."
                        onChange={e => setPromptText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        value={promptText}
                        rows={4}
                    />
                    <button onClick={handleSubmit}>
                        Send Message
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;