import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { Send, MessageCircle, Users, Clock } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for messages
    const q = query(
      collection(db, 'chat_messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Update user's online status
    const updateOnlineStatus = async () => {
      if (user) {
        try {
          await addDoc(collection(db, 'user_activity'), {
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || user.email,
            lastSeen: serverTimestamp(),
            isOnline: true
          });
        } catch (error) {
          console.error('Error updating online status:', error);
        }
      }
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Listen for online users
    const q = query(
      collection(db, 'user_activity'),
      where('isOnline', '==', true)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastSeen && data.lastSeen.toDate() > new Date(Date.now() - 60000)) { // Active in last minute
          users.push({
            id: doc.id,
            ...data
          });
        }
      });
      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'chat_messages'), {
        text: newMessage.trim(),
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('বার্তা পাঠাতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'আজ';
    } else if (messageDate.toDateString() === new Date(today.getTime() - 86400000).toDateString()) {
      return 'গতকাল';
    } else {
      return date.toLocaleDateString('bn-BD');
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      if (message.timestamp) {
        const dateKey = formatDate(message.timestamp);
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(message);
      }
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">কথোপকথন</h2>
          </div>
          <div className="flex items-center space-x-2 text-white">
            <Users className="w-4 h-4" />
            <span className="text-sm">{onlineUsers.length} জন অনলাইন</span>
          </div>
        </div>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="bg-gray-700/30 p-3 border-b border-gray-600/50">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>অনলাইন:</span>
            <div className="flex flex-wrap gap-2">
              {onlineUsers.map(user => (
                <span key={user.id} className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                  {user.userName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-700/50 text-gray-400 px-3 py-1 rounded-full text-sm">
                {date}
              </div>
            </div>
            
            {/* Messages for this date */}
            {dateMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userId === user.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.userId === user.uid
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-100'
                  }`}
                >
                  {message.userId !== user.uid && (
                    <div className="text-xs text-gray-400 mb-1">
                      {message.userName}
                    </div>
                  )}
                  <div className="break-words">{message.text}</div>
                  <div className={`text-xs mt-1 flex items-center space-x-1 ${
                    message.userId === user.uid ? 'text-cyan-100' : 'text-gray-400'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>এখনো কোনো বার্তা নেই। প্রথম বার্তা পাঠান!</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-600/50 p-4">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="আপনার বার্তা লিখুন..."
            disabled={loading}
            className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

