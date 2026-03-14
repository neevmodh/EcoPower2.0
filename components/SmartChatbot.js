'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SmartChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { sender: 'bot', text: `Hi ${user?.name || 'there'}! I'm your EcoPower AI Assistant. How can I help you today? Try asking "What is EaaS?", "Pay my bill", or "Report issue".` }
      ]);
    }
  }, [isOpen, user, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate RAG / AI processing delay
    setTimeout(() => {
      const responseText = generateBotResponse(userMsg.text.toLowerCase());
      setMessages(prev => [...prev, { sender: 'bot', text: responseText }]);
    }, 800 + Math.random() * 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Simulated AI Logic (Keyword matching mock)
  const generateBotResponse = (input) => {
    if (input.includes('eaas') || input.includes('energy as a service')) {
      return "Energy-as-a-Service (EaaS) is our model where we install and maintain solar/battery systems at your property for zero upfront cost. You just pay a flat monthly subscription or per-unit fee for the clean energy generated!";
    }
    if (input.includes('bill') || input.includes('pay') || input.includes('invoice')) {
      return "You can view and pay your latest invoices by navigating to the 'Billing & Payments' section in your dashboard. Would you like me to open a support ticket if there's a billing dispute?";
    }
    if (input.includes('ticket') || input.includes('issue') || input.includes('broken')) {
      return "I can help with that! Please go to the 'Help & Support' section in your dashboard to submit a detailed ticket. Our Ahmedabad technical team typically responds within 4 hours.";
    }
    if (input.includes('hello') || input.includes('hi')) {
      return `Hello ${user?.name}! Hope your day is going well. Any energy questions?`;
    }
    if (input.includes('ahmedabad')) {
      return "Yes! Our primary operations currently cover multiple areas in Ahmedabad including SG Highway, Prahlad Nagar, Bopal, and Sanand.";
    }
    
    return "I'm not entirely sure about that. I'm an AI assistant in training. For precise answers, you can check our documentation or raise a support ticket in your dashboard.";
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '60px', height: '60px', borderRadius: '50%',
          backgroundColor: 'var(--primary-green)', color: 'white',
          border: 'none', boxShadow: '0 10px 25px rgba(16,185,129,0.4)',
          cursor: 'pointer', zIndex: 100, display: isOpen ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}
      >
        <MessageSquare size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '350px', height: '500px', backgroundColor: 'white',
          borderRadius: '1rem', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ backgroundColor: 'var(--primary-green)', padding: '1rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Bot size={20} /> AI Support
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Message Area */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: msg.sender === 'user' ? '#e2e8f0' : '#d1fae5', color: msg.sender === 'user' ? '#64748b' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.sender === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>
                <div style={{ backgroundColor: msg.sender === 'user' ? 'var(--primary-green)' : 'white', color: msg.sender === 'user' ? 'white' : '#1e293b', padding: '0.75rem', borderRadius: '1rem', borderTopRightRadius: msg.sender === 'user' ? 0 : '1rem', borderTopLeftRadius: msg.sender === 'bot' ? 0 : '1rem', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', maxWidth: '80%', lineHeight: 1.4 }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              style={{ flex: 1, padding: '0.75rem', borderRadius: '2rem', border: '1px solid #cbd5e1', outline: 'none' }}
            />
            <button 
              onClick={handleSend}
              style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
