import { Message } from '../types/chat';

const API_BASE = '/api';
const MESSAGES_KEY = 'safety-companion-messages';

// Extended message type with chatId for storage
interface StoredMessage extends Message {
  chatId: string;
}

// Local storage helpers
const getLocalMessages = (): StoredMessage[] => {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (!stored) return [];
    const messages = JSON.parse(stored);
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('Error reading messages:', error);
    return [];
  }
};

const saveLocalMessages = (messages: StoredMessage[]): void => {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
};

// Get messages for a chat
export const getMessages = async (chatId: string): Promise<Message[]> => {
  try {
    // TODO: Implement API endpoint when backend is ready
    // For now, use localStorage
    const allMessages = getLocalMessages();
    return allMessages.filter(msg => msg.chatId === chatId);
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// Add a new message
export const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>, chatId: string = 'default'): Promise<Message> => {
  try {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    const storedMessage: StoredMessage = {
      ...newMessage,
      chatId
    };
    
    const allMessages = getLocalMessages();
    allMessages.push(storedMessage);
    saveLocalMessages(allMessages);
    
    return newMessage;
  } catch (error) {
    console.error('Error adding message:', error);
    throw new Error('Failed to add message');
  }
};

// Update a message
export const updateMessage = async (messageId: string, updates: Partial<Message>): Promise<Message | null> => {
  try {
    const allMessages = getLocalMessages();
    const index = allMessages.findIndex(msg => msg.id === messageId);
    
    if (index === -1) return null;
    
    allMessages[index] = { ...allMessages[index], ...updates };
    saveLocalMessages(allMessages);
    
    return allMessages[index];
  } catch (error) {
    console.error('Error updating message:', error);
    return null;
  }
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    const allMessages = getLocalMessages();
    const filtered = allMessages.filter(msg => msg.id !== messageId);
    
    if (filtered.length === allMessages.length) return false;
    
    saveLocalMessages(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

// Clear all messages for a chat
export const clearChatMessages = async (chatId: string): Promise<boolean> => {
  try {
    const allMessages = getLocalMessages();
    const filtered = allMessages.filter(msg => msg.chatId !== chatId);
    saveLocalMessages(filtered);
    return true;
  } catch (error) {
    console.error('Error clearing chat messages:', error);
    return false;
  }
};

// Alias for backwards compatibility
export const clearChatHistory = clearChatMessages;

// Get chat history (alias for getMessages)
export const getChatHistory = getMessages;

// Save a message (alias for addMessage)
export const saveMessage = addMessage;