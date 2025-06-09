import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, GripVertical, Maximize2, Minus } from 'lucide-react';
import { AI_CHAT_CONTEXT } from '../../constants/data';

interface Message {
  type: 'ai' | 'user';
  content: string;
  endingType?: string;
}

interface SuggestionNode {
  question: string;
  answer: string;
  followUps?: SuggestionNode[];
}

interface ChatWithAIProps {
  isNavbar?: boolean;
}

const ChatWithAI: React.FC<ChatWithAIProps> = ({ isNavbar = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestionNode[]>(AI_CHAT_CONTEXT.suggestedQuestionsTree);
  const [isTyping, setIsTyping] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 384, height: 600 });
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  
  const dragControls = useDragControls();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ type: 'ai', content: AI_CHAT_CONTEXT.introduction }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Resize functionality
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!chatRef.current) return;
      
      const rect = chatRef.current.getBoundingClientRect();
      const newWidth = Math.max(300, Math.min(800, e.clientX - rect.left));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 100, e.clientY - rect.top));
      
      setChatSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const resizeElement = resizeRef.current;
    if (resizeElement) {
      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', handleMouseUp);
      };

      resizeElement.addEventListener('mousedown', handleMouseDown);
      return () => {
        resizeElement.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, []);

  const handleAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    let response = "I'm not sure I understand your question, but I can help you learn more about Alief's background, skills, or availability. What would you like to ask about?";
    let endingType = '';
    let nextQuestion = null;
    let matched = false;

    const findInTree = (nodes: SuggestionNode[]): SuggestionNode | null => {
      for (const node of nodes) {
        if (node.question.toLowerCase() === userMessage.toLowerCase()) {
          return node;
        }
        if (node.followUps) {
          const found = findInTree(node.followUps);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findInTree(AI_CHAT_CONTEXT.suggestedQuestionsTree);
    if (node) {
      response = node.answer;
      endingType = node.endingType || '';
      nextQuestion = node.next || null;
      setCurrentSuggestions(node.followUps || AI_CHAT_CONTEXT.suggestedQuestionsTree);
      matched = true;
    }

    if (!matched) {
      const lower = userMessage.toLowerCase();
      
      if (lower.includes('experience')) {
        response = "Alief has extensive experience in Business Intelligence and Data Analysis, working with various tools and technologies. Would you like to know more about specific projects or skills?";
        matched = true;
      } else if (lower.includes('skills') || lower.includes('technologies')) {
        response = "Alief is proficient in data analysis tools like Python, SQL, BigQuery, and various BI platforms. He also has experience with web development technologies.";
      } else if (lower.includes('project')) {
        response = "Alief has worked on various projects including sales analysis dashboards, classification systems, and data visualization tools.";
      } else if (lower.includes('contact') || lower.includes('hire')) {
        response = "You can reach out through the contact form or directly via email at alivenata@gmail.com. Alief is available for freelance work, collaborations, and any professional work!";
      } else if (lower.includes('education') || lower.includes('background')) {
        response = "Alief has an educational background in Computer Science, which provides a strong foundation for his work in data analysis and software development.";
      } else if (lower.includes('location') || lower.includes('based')) {
        response = "Alief is based in Indonesia but open to remote opportunities and collaborations globally.";
      } else if (lower.includes('certification') || lower.includes('certified')) {
        response = "Alief holds certifications in Data Analytics and Business Intelligence. Let me know if you'd like details on any of them.";
      } else if (lower.includes('language') || lower.includes('speak')) {
        response = "Alief speaks both English and Indonesian fluently, which helps in working with diverse teams and clients.";
      } else if (lower.includes('who are you') || lower.includes('who is alyx')) {
        response = "I am Alyx's AI Assistant. I am here to help answer questions about Alief Akbar, his skills, projects, and other details. Feel free to ask anything!";
      } else if (lower.includes('who is alief akbar') || lower.includes('who is alief')) {
        response = "Alief Akbar is a skilled professional in Business Intelligence and Data Analysis, with expertise in various technologies. He has worked on multiple data-driven projects and is passionate about solving complex data challenges.";
      } else if (lower.includes('what is your relationship with alief') || lower.includes('how are you related to alief')) {
        response = "I am an AI assistant created to support Alief in answering questions about his work, projects, and skills. I don't have a personal relationship with him, but I am here to provide useful information about his professional background!";
      } else if (lower.includes('passion') || lower.includes('interests')) {
        response = "Alief is passionate about solving complex data problems and is always interested in learning more about emerging technologies. He also enjoys mentoring others in the field of data science.";
      } else if (lower.includes('availability') || lower.includes('open')) {
        response = "Alief is open to new opportunities and collaborations, whether short-term or long-term. Feel free to get in touch for potential work or project discussions!";
      } else if (lower.includes('portfolio') || lower.includes('work samples')) {
        response = "Sure! Alief's portfolio includes a variety of projects such as data visualization dashboards, predictive models, and machine learning systems. Some tools and technologies he's used include Python, R, SQL, Tableau, and BigQuery. Would you like to see specific examples or learn about the tools he used in a particular project?";
      } else if (lower.includes('specific examples') || lower.includes('examples')) {
        response = "I would love to share more details! One of my favorite projects was building a sales analysis dashboard using Tableau and SQL. I used Python to clean and process the data before visualizing it. Would you like more details on that project or perhaps a different one?";
      } else if (lower.includes('tools used') || lower.includes('technologies')) {
        response = "For data analysis, I primarily use Python with libraries like pandas and scikit-learn. For visualization, I often use Tableau and BigQuery for handling large datasets. Let me know if you'd like me to elaborate on any of these tools!";
      } else if (lower.includes('projects') || lower.includes('more information')) {
        response = "My portfolio includes a range of projects from machine learning models for predictive analytics to data dashboards that support business decision-making. I can share more information on any of these, just let me know what interests you most!";
      }
    }

    setIsTyping(false);
    setMessages(prev => [...prev, { type: 'ai', content: response, endingType: endingType }]);

    if (nextQuestion) {
      setMessages(prev => [
        ...prev,
        { type: 'ai', content: nextQuestion.answer },
        ...(nextQuestion.ending
          ? [{ type: 'ai', content: nextQuestion.ending, endingType: nextQuestion.endingType || '' }]
          : []),
        { type: 'ai', content: nextQuestion.question }
      ]);

      if (endingType) {
        setCurrentSuggestions(AI_CHAT_CONTEXT.suggestedQuestionsTree);
      }

      const nextSuggestions: SuggestionNode[] = [];
      if (nextQuestion.followUps) {
        nextSuggestions.push(...nextQuestion.followUps);
      } else {
        nextSuggestions.push(nextQuestion);
      }

      setCurrentSuggestions(nextSuggestions);
    }

    // Check if this is "The Wedding at the Vineyard" ending and reset suggestions
    if (response.includes("The Wedding at the Vineyard") || 
        response.includes("Crimson Vow") || 
        endingType === "Best Ending") {
      setTimeout(() => {
        setCurrentSuggestions(AI_CHAT_CONTEXT.suggestedQuestionsTree);
      }, 1000);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    await handleAIResponse(userMessage);
  };

  const handleSuggestedQuestion = async (node: SuggestionNode) => {
    setMessages(prev => [...prev, { type: 'user', content: node.question }]);
    await handleAIResponse(node.question);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset chat only when closing, not when minimizing
    setMessages([]);
    setCurrentSuggestions(AI_CHAT_CONTEXT.suggestedQuestionsTree);
    setInput('');
    setIsMinimized(false);
    setIsMaximized(false);
  };

  const ChatButton = () => (
    <motion.button
      onClick={() => setIsOpen(true)}
      className={`flex items-center gap-2 font-mono relative group ${
        isNavbar
          ? "px-3 py-2 sm:px-4 sm:py-3 bg-space-navy hover:border-neon-purple/60 hover:bg-neon-purple/10 transition-all duration-300 text-xs sm:text-sm"
          : "p-3 bg-neon-purple/20 rounded-full shadow-lg border border-neon-purple/30 hover:bg-neon-purple/30"
      }`}
    >
      <MessageSquare size={isNavbar ? 16 : 18} className="animate-neon-stroke-glow-no-shadow" />
      {isNavbar && (
        <>
          <span className="text-xs sm:text-sm relative z-10 hidden sm:inline">Chat Alyx</span>
          <span className="text-xs relative z-10 sm:hidden">Chat</span>
        </>
      )}
    </motion.button>
  );

  // Check if we're on desktop
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;

  return (
    <>
      <ChatButton />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Minimized state */}
            {isMinimized ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`fixed bg-space-navy rounded-lg shadow-lg border border-neon-purple/20 z-[70] ${
                  isDesktop 
                    ? 'bottom-2 right-2 w-64 h-12' 
                    : 'bottom-20 left-4 right-4 h-12'
                }`}
              >
                <div className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-neon-purple" />
                    <span className="text-white font-medium text-sm">Alyx</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMinimized(false)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button
                      onClick={handleClose}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Full chat window */
              <motion.div
                ref={chatRef}
                drag
                dragControls={dragControls}
                dragMomentum={false}
                dragElastic={0}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: chatPosition.x,
                  y: chatPosition.y
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`fixed bg-space-navy rounded-lg shadow-lg border border-neon-purple/20 overflow-hidden flex flex-col ${
                  isMaximized 
                    ? 'inset-4 z-[70]' 
                    : 'z-[70]'
                }`}
                style={
                  isMaximized 
                    ? {} 
                    : {
                        // Mobile positioning
                        ...(window.innerWidth < 640 ? {
                          bottom: '5rem',
                          left: '1rem',
                          width: 'calc(100vw - 2rem)',
                          height: 'calc(100vh - 12rem)',
                        } : {
                          // Desktop positioning - positioned to completely cover scroll up button and extend beyond
                          bottom: '0rem',
                          right: '0rem',
                          width: `${Math.max(chatSize.width, 400)}px`,
                          height: `${Math.max(chatSize.height, 550)}px`,
                          maxWidth: '800px',
                          maxHeight: '90vh',
                          minWidth: '400px',
                          minHeight: '550px'
                        })
                      }
                }
              >
                {/* Header */}
                <div 
                  className="bg-space-black p-3 sm:p-4 border-b border-neon-purple/20 flex justify-between items-center cursor-move"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-white/40 hidden sm:block" />
                    <Bot size={18} className="text-neon-purple" />
                    <span className="text-white font-medium text-sm sm:text-base">Alyx</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMinimize}
                      className="text-white/60 hover:text-white transition-colors"
                      title="Minimize"
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      onClick={toggleMaximize}
                      className="text-white/60 hover:text-white transition-colors hidden sm:block"
                      title={isMaximized ? "Restore" : "Maximize"}
                    >
                      <Maximize2 size={16} />
                    </button>
                    <button
                      onClick={handleClose}
                      className="text-white/60 hover:text-white transition-colors"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a #0F1A30' }}>
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-neon-purple/20 text-white ml-2 sm:ml-4'
                          : 'bg-space-black text-white/90 mr-2 sm:mr-4'
                      }`}>
                        <div className="flex items-start gap-2">
                          {message.type === 'ai' ? (
                            <Bot size={14} className="text-neon-blue mt-1 flex-shrink-0" />
                          ) : (
                            <User size={14} className="text-neon-purple mt-1 flex-shrink-0" />
                          )}
                          <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                           {message.endingType && (
                              <p className="text-xs text-gray-500 mt-1">Ending Type: {message.endingType}</p>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-space-black text-white/90 p-2 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[80%] mr-2 sm:mr-4">
                        <div className="flex items-center gap-2">
                          <Bot size={14} className="text-neon-blue flex-shrink-0" />
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neon-blue/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neon-blue/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neon-blue/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                <div className="bg-space-black border-t border-neon-purple/20 p-3 sm:p-4">
                  <div className="text-white/60 text-xs mb-2">Suggested Questions:</div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-20 sm:max-h-24 overflow-y-auto">
                    {currentSuggestions.map((node, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(node)}
                        className="text-xs px-2 py-1 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/20 transition-colors whitespace-nowrap"
                      >
                        {node.question}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="bg-space-black border-t border-neon-purple/20 p-3 sm:p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-space-navy rounded-md px-2 sm:px-3 py-2 text-white placeholder-white/40 border border-neon-purple/20 focus:outline-none focus:border-neon-purple/40 text-sm"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-neon-purple/20 rounded-md text-neon-purple hover:bg-neon-purple/30 transition-colors flex-shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>

                {/* Resize handle - only show on desktop */}
                {!isMaximized && (
                  <div
                    ref={resizeRef}
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hidden sm:block"
                    style={{
                      background: 'linear-gradient(-45deg, transparent 30%, #9D00FF 30%, #9D00FF 70%, transparent 70%)'
                    }}
                  />
                )}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWithAI;