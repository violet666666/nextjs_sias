'use client';
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, User, Check, CheckCheck } from 'lucide-react';
import { io } from 'socket.io-client';

// Chat Context
const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

// Chat Provider
export const ChatProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState({});

  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('join_user', { userId: user._id || user.id });
    });

    newSocket.on('conversations', (data) => {
      setConversations(data);
    });

    newSocket.on('messages', (data) => {
      setMessages(data);
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv._id === message.conversationId 
            ? { ...conv, lastMessage: message }
            : conv
        )
      );
    });

    newSocket.on('typing', (data) => {
      setIsTyping(prev => ({ ...prev, [data.conversationId]: data.isTyping }));
    });

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const sendMessage = (conversationId, content, type = 'text') => {
    if (!socket || !content.trim()) return;

    const message = {
      conversationId,
      sender: user._id || user.id,
      content,
      type,
      timestamp: new Date()
    };

    socket.emit('send_message', message);
  };

  const startTyping = (conversationId) => {
    if (!socket) return;
    socket.emit('typing', { conversationId, isTyping: true });
  };

  const stopTyping = (conversationId) => {
    if (!socket) return;
    socket.emit('typing', { conversationId, isTyping: false });
  };

  const createConversation = (participants) => {
    if (!socket) return;
    socket.emit('create_conversation', { participants });
  };

  const value = {
    socket,
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    createConversation,
    setActiveConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Chat Container
export const ChatContainer = ({ className = '' }) => {
  const { conversations, activeConversation, setActiveConversation } = useChat();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex h-96">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <ConversationsList />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <ChatArea conversation={activeConversation} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Conversations List
const ConversationsList = () => {
  const { conversations, activeConversation, setActiveConversation, onlineUsers } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => 
      p.nama.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Conversations
          </h3>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => {
          const otherParticipant = conversation.participants.find(p => 
            p._id !== (JSON.parse(localStorage.getItem('user'))?._id || JSON.parse(localStorage.getItem('user'))?.id)
          );

          return (
            <div
              key={conversation._id}
              onClick={() => setActiveConversation(conversation)}
              className={`
                p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors duration-200
                ${activeConversation?._id === conversation._id
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {otherParticipant?.nama?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  {isOnline(otherParticipant?._id) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {otherParticipant?.nama}
                    </h4>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Chat Area
const ChatArea = ({ conversation }) => {
  const { messages, sendMessage, startTyping, stopTyping, isTyping } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherParticipant = conversation.participants.find(p => 
    p._id !== (JSON.parse(localStorage.getItem('user'))?._id || JSON.parse(localStorage.getItem('user'))?.id)
  );

  const conversationMessages = messages.filter(m => m.conversationId === conversation._id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessage(conversation._id, newMessage);
    setNewMessage('');
    stopTyping(conversation._id);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Start typing indicator
    startTyping(conversation._id);
    
    // Stop typing after 1 second of no input
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversation._id);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {otherParticipant?.nama?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {otherParticipant?.nama}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {otherParticipant?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationMessages.map((message) => {
          const isOwnMessage = message.sender === (JSON.parse(localStorage.getItem('user'))?._id || JSON.parse(localStorage.getItem('user'))?.id);
          
          return (
            <div
              key={message._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                  ${isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <p className="text-sm">{message.content}</p>
                <div className={`flex items-center justify-end space-x-1 mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                  <span className="text-xs">{formatTime(message.timestamp)}</span>
                  {isOwnMessage && (
                    <CheckCheck className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping[conversation._id] && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Paperclip className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Smile className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer; 