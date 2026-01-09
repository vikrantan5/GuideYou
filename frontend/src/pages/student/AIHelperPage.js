import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Brain, Send, Loader2 } from 'lucide-react';
import * as api from '../../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

export const AIHelperPage = () => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: 'user', content: question };
    setChatHistory(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.askDoubt(question, chatHistory);
      
      const aiMessage = { role: 'assistant', content: response.data.answer };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      toast.error(error.response?.data?.detail || 'Failed to get AI response');
      
      setChatHistory(prev => prev.slice(0, -1));
      setQuestion(userMessage.content);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setQuestion('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="ai-helper-page-title">
          <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          AI Doubt Solver
        </h2>
        {chatHistory.length > 0 && (
          <Button variant="outline" onClick={handleClearChat} data-testid="clear-chat-button" className="w-full sm:w-auto">
            Clear Chat
          </Button>
        )}
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50" data-testid="ai-helper-info-card">
        <CardContent className="py-4 sm:py-6 px-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            💡 Ask me anything about your studies, programming concepts, or get help with your tasks. 
            I'm here to guide you!
          </p>
        </CardContent>
      </Card>

      <Card data-testid="chat-container">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Chat History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 min-h-[300px] sm:min-h-[400px] max-h-[500px] sm:max-h-[600px] overflow-y-auto">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] text-center px-4">
                <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-purple-300 mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No messages yet. Ask your first question!</p>
              </div>
            ) : (
              chatHistory.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`chat-message-${idx}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  <p className="text-xs sm:text-sm">AI is thinking...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="ask-question-card">
        <CardContent className="pt-4 sm:pt-6 px-4">
          <form onSubmit={handleAskQuestion} className="space-y-4">
            <Textarea
              placeholder="Ask your question here... (e.g., 'What is the difference between let and const in JavaScript?')"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              disabled={loading}
              data-testid="ai-question-input"
              className="text-sm sm:text-base"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !question.trim()} data-testid="ask-ai-button" className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask AI
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};