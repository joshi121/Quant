import React, { useState, useEffect } from 'react';
import { getAllMessages, getAllLoggedin, getTodayMessages, sendMessage } from '../services/messageService.js';
import { socket } from '../utils/socket';
import AllChats from '../components/Allchats';
import Sidebar from '../components/Sidebar';
import NewsSection from '../components/NewsSection';
import BlinkNewsSection from '../components/BlinkNewsSection';
import StockIntelligenceSection from '../components/StockIntelligenceSection';
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [conversations, setConversations] = useState([]);
  const [currentHost, setCurrentHost] = useState(null);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [todaysMessages, setTodaysMessages] = useState([]);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [openTodayDropdownId, setOpenTodayDropdownId] = useState(null);
  const navigate = useNavigate();

  const toggleSelectUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u._id === user._id);
      return exists ? prev.filter((u) => u._id !== user._id) : [...prev, user];
    });
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...users]);
    }
  };

  useEffect(() => {
    const storedHost = localStorage.getItem("host_user");
    if (!storedHost) {
      navigate("/login");
      return;
    }

    const parsedHost = JSON.parse(storedHost);
    setCurrentHost(parsedHost);
    setLoading(false);

    const fetchGlobalFeed = async () => {
      try {
        const response = await getAllMessages();
        setConversations(response.data);

        const usersRes = await getAllLoggedin();
        setUsers(usersRes.data);

        const todaysRes = await getTodayMessages();
        setTodaysMessages(todaysRes.data);

      } catch (err) {
        console.error("Timeline data loading failed:", err);
      }
    };

    fetchGlobalFeed();

    socket.io.opts.query = {
      userId: parsedHost.id || parsedHost._id
    };
    socket.connect();

    socket.on('newMessage', (newMessage) => {
      setConversations((prevConversations) => {
        const currentHostId = parsedHost.id || parsedHost._id;
        const rawSenderId = newMessage.senderId?._id || newMessage.senderId;
        const rawReceiverId = newMessage.receiverId?._id || newMessage.receiverId;

        const structuredSocketMessage = {
          ...newMessage,
          senderId: newMessage.senderId?.name ? newMessage.senderId : {
            _id: rawSenderId,
            name: rawSenderId === currentHostId ? (parsedHost.name || "You") : "User"
          },
          receiverId: newMessage.receiverId?.name ? newMessage.receiverId : {
            _id: rawReceiverId,
            name: rawReceiverId === currentHostId ? (parsedHost.name || "You") : "User"
          }
        };

        return [structuredSocketMessage, ...prevConversations];
      });

      const isToday = new Date(newMessage.createdAt).toDateString() === new Date().toDateString();
      if (isToday) {
        setTodaysMessages((prevTodays) => {
          const currentHostId = parsedHost.id || parsedHost._id;
          const rawSenderId = newMessage.senderId?._id || newMessage.senderId;
          const rawReceiverId = newMessage.receiverId?._id || newMessage.receiverId;

          const structuredSocketMessage = {
            ...newMessage,
            senderId: newMessage.senderId?.name ? newMessage.senderId : {
              _id: rawSenderId,
              name: rawSenderId === currentHostId ? (parsedHost.name || "You") : "User"
            },
            receiverId: newMessage.receiverId?.name ? newMessage.receiverId : {
              _id: rawReceiverId,
              name: rawReceiverId === currentHostId ? (parsedHost.name || "You") : "User"
            }
          };

          return [...prevTodays, structuredSocketMessage];
        });
      }
    });

    socket.on('getOnlineUsers', (onlineIds) => {
      setOnlineUserIds(onlineIds);
    });

    return () => {
      socket.off('newMessage');
      socket.off('getOnlineUsers');
      socket.disconnect();
    };
  }, [navigate]); //dependency array 

  const handleSendMessage = async () => {
    if (selectedUsers.length === 0 || !messageText.trim()) return;

    const textToSend = messageText;
    setMessageText("");

    for (const targetUser of selectedUsers) {
      try {
        const response = await sendMessage(targetUser._id, { message: textToSend });
        const sentMessage = response.data.newMessage || response.data;

        const currentHostId = currentHost?.id || currentHost?._id;
        const structuredMessage = {
          ...sentMessage,
          senderId: sentMessage.senderId?._id ? sentMessage.senderId : {
            _id: currentHostId,
            name: currentHost?.name || "You"
          },
          receiverId: sentMessage.receiverId?._id ? sentMessage.receiverId : {
            _id: targetUser._id,
            name: targetUser.name
          }
        };

        setConversations((prev) => [structuredMessage, ...prev]);
        setTodaysMessages((prev) => [...prev, structuredMessage]);
      } catch (err) {
        console.error(`Message send failed for ${targetUser.name}:`, err);
      }
    }
  };

  // Textarea KeyDown handler for Shift + Enter (new line) vs Enter (send)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Deduplicate today's sent messages
  const groupSentTodayMessages = () => {
    const groups = [];
    const hostIdStr = String(currentHost?.id || currentHost?._id || '');

    todaysMessages.forEach((msg) => {
      const rawSenderId = String(msg.senderId?._id || msg.senderId?.id || (typeof msg.senderId === 'string' ? msg.senderId : ''));
      if (rawSenderId !== hostIdStr) return;

      const rawReceiverId = String(msg.receiverId?._id || msg.receiverId?.id || (typeof msg.receiverId === 'string' ? msg.receiverId : ''));
      const matchedReceiver = users.find(u => String(u._id || u.id) === rawReceiverId);
      const receiverObj = msg.receiverId?.name && msg.receiverId.name !== 'User'
        ? msg.receiverId
        : { _id: rawReceiverId, name: matchedReceiver?.name || 'User' };

      const timeMs = new Date(msg.createdAt || Date.now()).getTime();
      const msgText = (msg.message || '').trim();

      const existingGroup = groups.find(g =>
        g.message.trim() === msgText &&
        Math.abs(g.createdAtTime - timeMs) < 30000
      );

      if (existingGroup) {
        if (!existingGroup.receivers.some(r => String(r._id || r.id) === rawReceiverId)) {
          existingGroup.receivers.push(receiverObj);
        }
      } else {
        groups.push({
          _id: String(msg._id || `${rawSenderId}-${timeMs}`),
          receivers: [receiverObj],
          message: msgText,
          createdAt: msg.createdAt,
          createdAtTime: timeMs
        });
      }
    });

    return groups;
  };

  const groupedSentToday = groupSentTodayMessages();
  const hostIdStr = String(currentHost?.id || currentHost?._id || '');
  const receivedToday = todaysMessages.filter(msg => {
    const senderStr = String(msg.senderId?._id || msg.senderId?.id || (typeof msg.senderId === 'string' ? msg.senderId : ''));
    return senderStr !== hostIdStr;
  });

  if (loading) {
    return (
      <div className='w-screen h-screen flex justify-center items-center bg-blue-50 text-blue-800 font-semibold'>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentHost={currentHost} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {activeTab === "news" ? (
          <NewsSection />
        ) : activeTab === "blinknews" ? (
          <BlinkNewsSection />
        ) : activeTab === "stock" ? (
          <StockIntelligenceSection />
        ) : (
          <div className='w-full min-h-screen flex flex-col justify-center items-center bg-blue-50 p-4 gap-3 overflow-y-auto'>
            <h1 className='font-bold text-xl text-blue-800 tracking-wider text-center'>Real-Time Chat Dashboard</h1>

            <div className='w-full max-w-[1150px] lg:h-[550px] flex flex-col lg:flex-row gap-4 p-4 lg:p-6 bg-white rounded-xl shadow-lg text-black items-stretch min-w-0 overflow-hidden'>

              {/* Column 1: All Conversations (Global Feed) */}
              <AllChats
                conversations={conversations}
                currentUserId={currentHost?.id || currentHost?._id}
                users={users} 
              />

              {/* Column 2: Today's Chat History */}
              <div className='w-full lg:w-[450px] lg:flex-shrink-0 h-[480px] bg-white rounded-lg p-4 flex flex-col border border-blue-200 min-w-0'>
                <h2 className='text-sm font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-3 text-center'>
                  Today's History (Live)
                </h2>

                <div className='flex gap-2 flex-1 overflow-hidden'>
                  {/* RECEIVED */}
                  <div className='flex-1 bg-blue-50 p-2.5 rounded overflow-y-auto border border-blue-200 flex flex-col space-y-3 max-h-[400px]'>
                    <span className='text-[10px] text-center font-bold text-blue-900 block mb-1 sticky top-0 bg-blue-50 py-1 z-10 border-b border-blue-200'>RECEIVED</span>
                    {receivedToday.length > 0 ? (
                      receivedToday.map(msg => {
                        const currentSenderId = msg.senderId?._id || msg.senderId;
                        const matchedUser = users.find(u => u._id === currentSenderId);
                        const displayName = msg.senderId?.name || matchedUser?.name || 'User';

                        return (
                          <div key={msg._id} className='bg-blue-100 p-2.5 rounded-lg text-[11px] border border-blue-200 shadow-sm break-words flex-shrink-0'>
                            <div className="border-b border-blue-200 pb-1 mb-1.5">
                              <span className='font-bold text-blue-900'>From {displayName}:</span>
                            </div>
                            <span className="text-black font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</span>
                            <span className='text-[9px] text-gray-600 block mt-1 text-right font-medium'>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      <p className='text-[10px] text-gray-400 text-center mt-4'>No messages received today</p>
                    )}
                  </div>

                  {/* SENT */}
                  <div className='flex-1 bg-slate-50 p-2.5 rounded overflow-y-auto border border-slate-200 flex flex-col space-y-3 max-h-[400px]'>
                    <span className='text-[10px] text-center font-bold text-slate-700 block mb-1 sticky top-0 bg-slate-50 py-1 z-10 border-b border-slate-200'>SENT</span>
                    {groupedSentToday.length > 0 ? (
                      groupedSentToday.map(msg => {
                        const isDropdownOpen = openTodayDropdownId === msg._id;

                        return (
                          <div key={msg._id} className='bg-slate-100 p-2.5 rounded-lg text-[11px] border border-slate-300 shadow-sm break-words flex-shrink-0 relative'>
                            <div className="border-b border-slate-200 pb-1 mb-1.5">
                              <div className="relative">
                                {msg.receivers.length === 1 ? (
                                  <span className='font-bold text-slate-800'>To {msg.receivers[0].name}:</span>
                                ) : (
                                  <div>
                                    <button
                                      onClick={() => setOpenTodayDropdownId(isDropdownOpen ? null : msg._id)}
                                      className="font-bold text-blue-700 hover:text-blue-900 underline text-[11px] flex items-center gap-1"
                                    >
                                      To: {msg.receivers.length} Receivers ▾
                                    </button>
                                    {isDropdownOpen && (
                                      <div className="absolute left-0 top-6 z-50 bg-white border border-blue-300 rounded-md shadow-lg p-2 min-w-[130px] max-h-24 overflow-y-auto">
                                        <p className="text-[9px] font-bold text-slate-400 border-b pb-1 mb-1 uppercase">Receivers List</p>
                                        {msg.receivers.map((r, i) => (
                                          <p key={r._id || i} className="text-[10px] font-semibold text-blue-900 py-0.5 border-b border-slate-100 last:border-0">
                                            • {r.name}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-black font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</span>
                            <span className='text-[9px] text-gray-500 block mt-1 text-right font-medium'>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      <p className='text-[10px] text-gray-400 text-center mt-4'>No messages sent today</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 3: Registered Users (Multi-Select Supported) */}
              <div className='w-full lg:w-[300px] lg:flex-shrink-0 h-[480px] bg-white rounded-lg p-4 flex flex-col justify-between border border-blue-200 min-w-0'>
                <div className='flex flex-col gap-2 overflow-y-auto max-h-[340px]'>
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <h2 className='text-xs font-semibold text-blue-800'>
                      Registered Users ({users.length})
                    </h2>
                    {users.length > 0 && (
                      <button
                        onClick={handleSelectAllUsers}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline"
                      >
                        {selectedUsers.length === users.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>

                  {users && users.length > 0 ? (
                    users.map((user) => {
                      const isSelected = selectedUsers.some((u) => u._id === user._id);
                      const isOnline = onlineUserIds.includes(String(user._id));
                      return (
                        <div
                          key={user._id}
                          onClick={() => toggleSelectUser(user)}
                          className={`flex justify-between items-center p-2 rounded text-xs cursor-pointer transition-all ${isSelected
                            ? 'bg-blue-600 text-white border border-blue-700 font-semibold shadow-sm'
                            : 'bg-blue-100 text-black hover:bg-blue-200 border border-transparent'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-blue-400 text-blue-700 focus:ring-0 cursor-pointer pointer-events-none"
                            />
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            <span className="truncate">{user.name}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] bg-white text-blue-700 px-1.5 py-0.2 rounded font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className='text-xs text-gray-400 text-center mt-4'>No other users found</p>
                  )}
                </div>

                {/* Textarea Input with Shift+Enter Support */}
                <div className='flex flex-col gap-2 pt-2 border-t border-blue-200'>
                  <textarea
                    rows={2}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      selectedUsers.length > 0
                        ? `Type a message... (Shift + Enter for new line)`
                        : 'Select user(s) to chat...'
                    }
                    disabled={selectedUsers.length === 0}
                    className='w-full p-2 rounded bg-blue-50 text-xs border border-blue-200 focus:outline-none focus:border-blue-500 text-black placeholder:text-gray-500 disabled:opacity-50 resize-none font-medium'
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={selectedUsers.length === 0 || !messageText.trim()}
                    className='w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
                  >
                    {selectedUsers.length > 1
                      ? `SEND TO ${selectedUsers.length} USERS`
                      : 'SEND'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;