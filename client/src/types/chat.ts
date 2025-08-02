export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  attachments?: {
    type: 'file' | 'image' | 'audio';
    url: string;
    name: string;
    size?: number;
  }[];
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string, attachments?: File[]) => void;
  disabled?: boolean;
}