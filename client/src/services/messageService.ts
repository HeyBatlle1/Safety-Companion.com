import { Message } from '../types/chat';
import supabase, { getCurrentUser } from './supabase';

// Save chat message to database
export const saveMessage = async (message: Omit<Message, 'id'>): Promise<Message> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: user.id,
        text: message.text,
        sender: message.sender,
        attachments: message.attachments || null
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      text: data.text,
      sender: data.sender as 'user' | 'bot',
      timestamp: data.created_at,
      attachments: data.attachments || undefined
    };
  } catch (error) {
    console.error('Error saving message to Supabase:', error);
    
    // If Supabase fails, create a message with a local ID
    return {
      ...message,
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
  }
};

// Get chat history
export const getChatHistory = async (limit = 50): Promise<Message[]> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    
    // Transform from database format to application format
    return data.map(msg => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender as 'user' | 'bot',
      timestamp: msg.created_at,
      attachments: msg.attachments || undefined
    }));
  } catch (error) {
    console.error('Error fetching chat history from Supabase:', error);
    return [];
  }
};

// Clear chat history
export const clearChatHistory = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error clearing chat history from Supabase:', error);
    return false;
  }
};

// Get message by ID
export const getMessageById = async (messageId: string): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      text: data.text,
      sender: data.sender as 'user' | 'bot',
      timestamp: data.created_at,
      attachments: data.attachments || undefined
    };
  } catch (error) {
    console.error('Error fetching message by ID:', error);
    return null;
  }
};

// Update message (e.g., for editing)
export const updateMessage = async (messageId: string, updates: Partial<Message>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        text: updates.text,
        attachments: updates.attachments || null
      })
      .eq('id', messageId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating message:', error);
    return false;
  }
};

// Delete a specific message
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

export default {
  saveMessage,
  getChatHistory,
  clearChatHistory,
  getMessageById,
  updateMessage,
  deleteMessage
};