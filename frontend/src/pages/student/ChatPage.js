import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Send, Sparkles, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { toast } from 'sonner';
import axios from 'axios';

export const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatSession, setChatSession] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = getSocket();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    initializeChat();
    return () => {
      if (chatSession) {
        socket.emit('leave_chat', { chat_id: chatSession.id });
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Get or create chat session
      const sessionsRes = await api.getChatSessions();
      let session = sessionsRes.data[0];

      if (!session) {
        // For students, admin will create the session, so we wait
        setLoading(false);
        return;
      }

      setChatSession(session);

      // Load messages
      const messagesRes = await api.getMessages(session.id);
      setMessages(messagesRes.data);

      // Join socket room
      socket.emit('join_chat', { chat_id: session.id, user_id: user.id });

      // Listen for new messages
      socket.on('new_message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      // Listen for typing
      socket.on('user_typing', (data) => {
        if (data.user_id !== user.id) {
          setIsTyping(data.is_typing);
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast.error('Failed to load chat');
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatSession) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Send via socket for real-time
      socket.emit('send_message', {
        chat_id: chatSession.id,
        sender_id: user.id,
        content: messageContent,
        message_type: 'text'
      });

      // Stop typing indicator
      socket.emit('typing', {
        chat_id: chatSession.id,
        user_id: user.id,
        is_typing: false
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!chatSession) return;

    socket.emit('typing', {
      chat_id: chatSession.id,
      user_id: user.id,
      is_typing: true
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        chat_id: chatSession.id,
        user_id: user.id,
        is_typing: false
      });
    }, 2000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chatSession) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-16 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Chat Not Available Yet</h3>
          <p className="text-muted-foreground">Your admin will initiate the chat session with you.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2" data-testid="chat-page-title">
            <Sparkles className="w-8 h-8 text-primary" />
            Chat with Admin
          </h2>
          <p className="text-muted-foreground mt-1">Get instant support and guidance</p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Online
        </Badge>
      </div>

      {/* Unique Chat Container with Glassmorphism */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ height: '600px' }}>
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-300/20 to-blue-400/20">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Glass Effect Container */}
        <div className="relative h-full backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border border-white/20 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Start the Conversation</h3>
                <p className="text-muted-foreground max-w-md">Send your first message to get help from your admin!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender_id === user.id;
                const isAdmin = message.sender_id !== user.id;

                return (
                  <div
                    key={message.id || index}
                    className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} animate-slide-in`}
                    data-testid={`message-${index}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                      isAdmin 
                        ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                        : 'bg-gradient-to-br from-blue-400 to-purple-500'
                    }`}>
                      {isAdmin ? <Shield className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                    </div>

                    {/* Message Card */}
                    <div className={`flex flex-col max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3 rounded-3xl shadow-lg transform transition-all hover:scale-105 ${
                        isOwn 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-sm' 
                          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-white rounded-bl-sm border border-white/30'
                      }`}>
                        {!isOwn && (
                          <p className="text-xs font-semibold mb-1 text-orange-600 dark:text-orange-400">Admin</p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <span className={`text-xs mt-1 px-2 ${isOwn ? 'text-right' : 'text-left'} text-gray-600 dark:text-gray-400`}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-end gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="px-5 py-3 rounded-3xl rounded-bl-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 shadow-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/20 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="rounded-full pr-4 pl-6 py-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/30 focus:ring-2 focus:ring-purple-500 text-base shadow-lg"
                  data-testid="message-input"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="rounded-full h-12 w-12 p-0 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transform transition-all hover:scale-110"
                data-testid="send-message-button"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
