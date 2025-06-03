import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, GripVertical } from 'lucide-react';
import { AI_CHAT_CONTEXT } from '../../constants/data';

interface Message {
  type: 'ai' | 'user';
  content: string;
}

interface ChatWithAIProps {
  isNavbar?: boolean;
}

const ChatWithAI: React.FC<ChatWithAIProps> = ({ isNavbar = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 384, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragControls = useDragControls();
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleAIResponse(AI_CHAT_CONTEXT.introduction);
    }
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && chatWindowRef.current) {
        const newWidth = Math.max(300, Math.min(800, e.clientX - chatWindowRef.current.getBoundingClientRect().left));
        const newHeight = Math.max(400, Math.min(800, e.clientY - chatWindowRef.current.getBoundingClientRect().top));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (messages.length === 0) {
      const introMessage: Message = {
        type: 'ai',
        content: AI_CHAT_CONTEXT.introduction,
      };
      setMessages([introMessage]);
    }
  }, []);

  const handleAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    let response = "I understand you're asking about ";
    if (userMessage.toLowerCase().includes('experience')) {
      response = "Alief has extensive experience in Business Intelligence and Data Analysis, working with various tools and technologies. Would you like to know more about specific projects or skills?";
    } else if (userMessage.toLowerCase().includes('skills') || userMessage.toLowerCase().includes('technologies')) {
      response = "Alief is proficient in data analysis tools like Python, SQL, BigQuery, and various BI platforms. He also has experience with web development technologies.";
    } else if (userMessage.toLowerCase().includes('project')) {
      response = "Alief has worked on various projects including sales analysis dashboards, classification systems, and data visualization tools.";
    } else if (userMessage.toLowerCase().includes('contact') || userMessage.toLowerCase().includes('hire')) {
      response = "You can reach out through the contact form or directly via email at alivenata@gmail.com. Alief is available for freelance work, collaborations and any professionals work!";
    } else if (userMessage.toLowerCase().includes('education') || userMessage.toLowerCase().includes('background')) {
      response = "Alief has an educational background in Computer Science, which provides a strong foundation for his work in data analysis and software development.";
    } else if (userMessage.toLowerCase().includes('location') || userMessage.toLowerCase().includes('based')) {
      response = "Alief is based in Indonesia but open to remote opportunities and collaborations globally.";
    } else if (userMessage.toLowerCase().includes('certification') || userMessage.toLowerCase().includes('certified')) {
      response = "Alief holds certifications in Data Analytics and Business Intelligence. Let me know if you'd like details on any of them.";
    } else if (userMessage.toLowerCase().includes('language') || userMessage.toLowerCase().includes('speak')) {
      response = "Alief speaks both English and Indonesian fluently, which helps in working with diverse teams and clients.";
    } else if (userMessage.toLowerCase().includes('who is alief') || userMessage.toLowerCase().includes('about alief')) {
      response = "Alief is a data analyst and web developer with a strong background in Business Intelligence, data visualization, and automation tools. He enjoys solving problems through data.";
    } else if (userMessage.toLowerCase().includes('who are you') || userMessage.toLowerCase().includes('what is alyx')) {
      response = "I'm Alyx, a virtual assistant designed to help answer your questions about Alief's background, work, and availability. While I strive to be helpful, I do have some limitations.";
    } else if (userMessage.toLowerCase().includes('limitation') || userMessage.toLowerCase().includes('can you do')) {
      response = "As an AI assistant, I'm here to share information based on what's been programmed about Alief. I can't access private data, make decisions, or perform tasks outside of answering questions.";
    } else if (userMessage.toLowerCase().includes('feedback') || userMessage.toLowerCase().includes('suggestion') || userMessage.toLowerCase().includes('criticism') || userMessage.toLowerCase().includes('comment')) {
      response = "I'd love to hear your thoughts! You can send any feedback, suggestions, or constructive criticism directly to alivenata@gmail.com.";
    } else if (userMessage.toLowerCase().includes('sales') || userMessage.toLowerCase().includes('dashboard')) {
      response = "Alief's sales analysis dashboard helped visualize monthly and regional performance for better decision-making, using tools like Power BI, BigQuery, and Python for ETL.";
    } else if (userMessage.toLowerCase().includes('classification')) {
      response = "Alief built a classification system using Python and machine learning libraries like scikit-learn to categorize customer feedback into sentiment categories.";
    } else if (userMessage.toLowerCase().includes('visualization')) {
      response = "Alief's data visualization projects include building interactive charts and dashboards using libraries like Plotly, Tableau.";
    } else if (userMessage.toLowerCase().includes('contact') || userMessage.toLowerCase().includes('hire') || userMessage.toLowerCase().includes('freelance')) {
      response = "Yes, Alief is available for freelance work, collaborations, and other professional opportunities. You can reach out via email at alivenata@gmail.com.";
    } else {
      response = "I'm not sure I understand your question, but I can help you learn more about Alief's background, skills, or availability. What would you like to ask about?";
    }
    
    setIsTyping(false);
    setMessages(prev => [...prev, { type: 'ai', content: response }]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    await handleAIResponse(userMessage);
  };

  const handleSuggestedQuestion = async (question: string) => {
    setMessages(prev => [...prev, { type: 'user', content: question }]);
    await handleAIResponse(question);
  };

  const ChatButton = () => (
    <button
      onClick={() => setIsOpen(true)}
      className={`flex items-center gap-2 font-mono text-base transition-colors duration-300 ${
        isNavbar 
          ? "px-4 py-2 bg-space-navy rounded-md border border-neon-purple/30 hover:border-neon-purple/60"
          : "p-3 bg-neon-purple/20 rounded-full shadow-lg border border-neon-purple/30 hover:bg-neon-purple/30 hover:shadow-neon-purple/20"
      }`}
    >
      <motion.div
        whileHover={{ scale: 1.2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <MessageSquare size={20} className="text-neon-purple" />
      </motion.div>
      {isNavbar && <span>Chat Alyx</span>}
    </button>
  );

  return (
    <>
      <ChatButton />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: position.x,
              y: position.y,
              width: size.width,
              height: size.height
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragListener={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(event, info) => {
              setIsDragging(false);
              setPosition(prev => ({
                x: prev.x + info.offset.x,
                y: prev.y + info.offset.y
              }));
            }}
            className="fixed bottom-4 right-24 bg-space-navy rounded-lg shadow-lg border border-neon-purple/20 overflow-hidden z-[60]"
            style={{ 
              position: 'fixed',
              resize: 'both',
              minWidth: '300px',
              minHeight: '400px',
              maxWidth: '800px',
              maxHeight: '800px'
            }}
          >
            {/* Header with drag handle */}
            <div 
              className="bg-space-black p-4 border-b border-neon-purple/20 flex justify-between items-center cursor-move"
              onPointerDown={(e) => {
                dragControls.start(e);
                setIsDragging(true);
              }}
            >
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-white/40" />
                <Bot size={20} className="text-neon-purple" />
                <span className="text-white font-medium">Alyx</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              className="overflow-y-auto p-4 space-y-4"
              style={{ height: 'calc(100% - 8rem)' }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-neon-purple/20 text-white ml-4'
                        : 'bg-space-black text-white/90 mr-4'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'ai' ? (
                        <Bot size={16} className="text-neon-blue mt-1" />
                      ) : (
                        <User size={16} className="text-neon-purple mt-1" />
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-space-black text-white/90 p-3 rounded-lg max-w-[80%] mr-4">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-neon-blue" />
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-neon-blue/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                        <span className="w-2 h-2 bg-neon-blue/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-neon-blue/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 2 && (
              <div className="absolute bottom-16 left-0 right-0 p-4 bg-space-black/90 border-t border-neon-purple/20">
                <div className="text-white/60 text-xs mb-2">Suggested Questions:</div>
                <div className="flex flex-wrap gap-2">
                  {AI_CHAT_CONTEXT.suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-xs px-2 py-1 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/20 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="absolute bottom-0 left-0 right-0 p-4 bg-space-black border-t border-neon-purple/20"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-space-navy rounded-md px-3 py-2 text-white placeholder-white/40 border border-neon-purple/20 focus:outline-none focus:border-neon-purple/40"
                />
                <button
                  type="submit"
                  className="p-2 bg-neon-purple/20 rounded-md text-neon-purple hover:bg-neon-purple/30 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>

            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={() => setIsResizing(true)}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 bg-neon-purple/50 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWithAI;
