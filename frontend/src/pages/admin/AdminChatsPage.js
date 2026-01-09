import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Send, Sparkles, User, Shield, MessageCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { toast } from 'sonner';
import axios from 'axios';

export const AdminChatsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const socket = getSocket();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadStudents();
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      if (chatSession) {
        socket.emit('leave_chat', { chat_id: chatSession.id });
      }
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    }
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setMessages([]);

    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Create or get chat session
      const sessionRes = await api.createChatSession(student.id);
      const session = sessionRes.data;
      setChatSession(session);

      // Load messages
      const messagesRes = await api.getMessages(session.id);
      setMessages(messagesRes.data);

      // Join socket room
      if (chatSession) {
        socket.emit('leave_chat', { chat_id: chatSession.id });
      }
      socket.emit('join_chat', { chat_id: session.id, user_id: user.id });

      // Clear unread count
      setUnreadCounts(prev => ({ ...prev, [student.id]: 0 }));
    } catch (error) {
      console.error('Failed to load chat:', error);
      toast.error('Failed to load chat');
    }
  };

  const handleNewMessage = (message) => {
    if (chatSession && message.chat_id === chatSession.id) {
      setMessages(prev => [...prev, message]);
    } else {
      const studentId = students.find(s => true)?.id;
      if (studentId) {
        setUnreadCounts(prev => ({ ...prev, [studentId]: (prev[studentId] || 0) + 1 }));
      }
    }
  };

  const handleTyping = (data) => {
    if (data.user_id !== user.id && chatSession) {
      setIsTyping(data.is_typing);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatSession) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      socket.emit('send_message', {
        chat_id: chatSession.id,
        sender_id: user.id,
        content: messageContent,
        message_type: 'text'
      });

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

  const handleTypingIndicator = () => {
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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="admin-chats-page-title">
          <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          Student Chats
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Connect with students in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: '600px' }}>
        {/* Students List */}
        <Card className="lg:col-span-1 overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="pl-10 text-sm"
                data-testid="search-students-input"
              />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No students found</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-3 sm:p-4 border-b cursor-pointer transition-all hover:bg-muted/50 ${
                    selectedStudent?.id === student.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                  data-testid={`student-chat-item-${student.id}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-sm sm:text-base">{student.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.email}</p>
                    </div>
                    {unreadCounts[student.id] > 0 && (
                      <Badge variant="destructive" className="rounded-full h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center text-xs">
                        {unreadCounts[student.id]}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 overflow-hidden">
          {!selectedStudent ? (
            <CardContent className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 sm:mb-6 shadow-xl">
                <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Select a Student</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md">Choose a student from the list to start chatting and providing support</p>
            </CardContent>
          ) : (
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{selectedStudent.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{selectedStudent.email}</p>
                  </div>
                  <Badge variant="outline" className="px-2 py-1 text-xs sm:text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Active
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-br from-gray-50/50 to-purple-50/30 dark:from-gray-900/50 dark:to-purple-900/20" data-testid="admin-messages-container">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2">Start Conversation</h3>
                    <p className="text-sm text-muted-foreground">Send the first message to {selectedStudent.name}</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.sender_id === user.id;

                    return (
                      <div
                        key={message.id || index}
                        className={`flex items-end gap-2 sm:gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} animate-slide-in`}
                        data-testid={`admin-message-${index}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                          isOwn 
                            ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                            : 'bg-gradient-to-br from-blue-400 to-purple-500'
                        }`}>
                          {isOwn ? <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                        </div>

                        <div className={`flex flex-col max-w-[75%] sm:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3 sm:px-5 py-2 sm:py-3 rounded-3xl shadow-lg transform transition-all hover:scale-105 ${
                            isOwn 
                              ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-br-sm' 
                              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm border'
                          }`}>
                            {isOwn && (
                              <p className="text-xs font-semibold mb-1 text-orange-100">You</p>
                            )}
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <span className="text-xs mt-1 px-2 text-gray-600 dark:text-gray-400">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {isTyping && (
                  <div className="flex items-end gap-2 sm:gap-3 animate-fade-in">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="px-3 sm:px-5 py-2 sm:py-3 rounded-3xl rounded-bl-sm bg-white dark:bg-gray-800 border shadow-lg">
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
              <div className="border-t bg-white dark:bg-gray-900 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTypingIndicator();
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="rounded-full pr-4 pl-4 sm:pl-6 py-5 sm:py-6 text-sm sm:text-base shadow-sm"
                      data-testid="admin-message-input"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg transform transition-all hover:scale-110"
                    data-testid="admin-send-message-button"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};