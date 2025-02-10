import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaHeadset } from 'react-icons/fa';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await axios.post('http://localhost:5004/chat', { message: '__initial_greeting__' });
        setMessages([{ text: response.data.greeting, sender: 'bot' }]);
      } catch (err) {
        console.error('Error al obtener el saludo inicial:', err);
        setMessages([{ text: 'Error al conectar con el chatbot.', sender: 'bot' }]);
      }
    };

    if (isOpen) {
      fetchGreeting();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (userInput.trim() === '') return;

    const newMessages = [...messages, { text: userInput, sender: 'user' }];
    setMessages(newMessages);
    setUserInput('');

    try {
      const response = await axios.post('http://localhost:5004/chat', { message: userInput });
      setMessages([...newMessages, { text: response.data.response, sender: 'bot' }]);
    } catch (err) {
      console.error('Error al conectar con el chatbot:', err);
      setMessages([...newMessages, { text: 'Error al conectar con el chatbot.', sender: 'bot' }]);
    }
  };

  return (
    <>
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
          }}
        >
          <button
            onClick={toggleChat}
            style={{
              backgroundColor: '#007bff',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
            }}
          >
            <FaHeadset size={30} color="white" />
          </button>
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '500px',
            backgroundColor: 'white',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px',
              borderTopLeftRadius: '15px',
              borderTopRightRadius: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>Asistente Virtual</span>
            <button
              onClick={toggleChat}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: '10px',
              overflowY: 'auto',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  margin: '10px 0',
                  padding: '10px',
                  backgroundColor: msg.sender === 'bot' ? '#f1f1f1' : '#007bff',
                  color: msg.sender === 'bot' ? '#333' : 'white',
                  borderRadius: '10px',
                  alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                  maxWidth: '80%',
                }}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          <div
            style={{
              borderTop: '1px solid #ddd',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '10px',
                borderRadius: '20px',
                backgroundColor: '#f1f1f1',
              }}
            />
            <button
              onClick={handleSend}
              style={{
                marginLeft: '10px',
                backgroundColor: '#007bff',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
