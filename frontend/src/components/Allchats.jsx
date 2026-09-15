import React, { useState } from 'react';

const AllChats = ({ conversations = [], currentUserId, users = [] }) => {
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const extractId = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (val._id) return String(val._id);
        if (val.id) return String(val.id);
        return String(val);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Robust Message Grouping / Deduplication Logic
    const groupMessages = (messagesList) => {
        const groups = [];
        const hostIdStr = extractId(currentUserId);

        messagesList.forEach((msg) => {
            const rawSenderId = extractId(msg.senderId);
            const rawReceiverId = extractId(msg.receiverId);

            const matchedReceiver = users.find(u => extractId(u) === rawReceiverId);
            const receiverObj = msg.receiverId?.name && msg.receiverId.name !== 'User' 
                ? msg.receiverId 
                : { _id: rawReceiverId, name: matchedReceiver?.name || 'User' };

            const matchedSender = users.find(u => extractId(u) === rawSenderId);
            const senderName = msg.senderId?.name && msg.senderId.name !== 'User'
                ? msg.senderId.name
                : (matchedSender?.name || (rawSenderId === hostIdStr ? 'You' : 'User'));

            const timeMs = new Date(msg.createdAt || Date.now()).getTime();
            const msgText = (msg.message || '').trim();

            // Match sender & exact message content created within 30 seconds
            const existingGroup = groups.find(g =>
                g.rawSenderId === rawSenderId &&
                g.message.trim() === msgText &&
                Math.abs(g.createdAtTime - timeMs) < 30000
            );

            if (existingGroup) {
                if (!existingGroup.receivers.some(r => extractId(r) === rawReceiverId)) {
                    existingGroup.receivers.push(receiverObj);
                }
            } else {
                groups.push({
                    _id: extractId(msg._id || `${rawSenderId}-${timeMs}`),
                    rawSenderId: rawSenderId,
                    senderName: senderName,
                    receivers: [receiverObj],
                    message: msgText,
                    createdAt: msg.createdAt,
                    createdAtTime: timeMs
                });
            }
        });

        return groups;
    };

    const groupedConversations = groupMessages(conversations);
    const hostIdStr = extractId(currentUserId);

    return (
        <div className='flex-1 min-w-[300px] h-[480px] bg-white rounded-lg p-4 flex flex-col overflow-y-auto border border-blue-200'>
            <h2 className='text-sm font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-3 sticky top-0 bg-white z-[9999]'>
                All Conversations
            </h2>

            {groupedConversations.length === 0 ? (
                <p className='text-xs text-gray-400 text-center mt-4'>No conversation data found</p>
            ) : (
                <div className="space-y-3">
                    {groupedConversations.map((msg) => {
                        const isSentByMe = msg.rawSenderId === hostIdStr;
                        const isDropdownOpen = openDropdownId === msg._id;

                        return (
                            <div 
                                key={msg._id} 
                                className={`flex w-full mb-3 ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`p-3 rounded-lg text-xs border shadow-sm transition-all max-w-[85%] flex flex-col items-start relative ${
                                        isSentByMe
                                            ? 'bg-slate-100 border-slate-300'
                                            : 'bg-blue-100 border-blue-200'
                                    }`}
                                >
                                    {/* Header: From / To with Recipient List Popover */}
                                    <div className="flex items-center justify-between w-full border-b border-slate-200 pb-1.5 mb-2 gap-3 min-w-[180px]">
                                        <div className="relative">
                                            {isSentByMe ? (
                                                msg.receivers.length === 1 ? (
                                                    <p className='font-bold text-blue-900'>To: {msg.receivers[0].name}</p>
                                                ) : (
                                                    <div>
                                                        <button
                                                            onClick={() => setOpenDropdownId(isDropdownOpen ? null : msg._id)}
                                                            className="font-bold text-blue-800 hover:text-blue-950 underline flex items-center gap-1 text-xs"
                                                        >
                                                            To: {msg.receivers.length} Receivers ▾
                                                        </button>

                                                        {/* Dropdown scrollable list of receivers */}
                                                        {isDropdownOpen && (
                                                            <div className="absolute left-0 top-6 z-50 bg-white border border-blue-300 rounded-md shadow-lg p-2 min-w-[140px] max-h-28 overflow-y-auto">
                                                                <p className="text-[9px] font-bold text-slate-400 border-b pb-1 mb-1 uppercase">Receivers List</p>
                                                                {msg.receivers.map((r, i) => (
                                                                    <p key={r._id || i} className="text-[11px] font-semibold text-blue-900 py-0.5 border-b border-slate-100 last:border-0">
                                                                        • {r.name}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            ) : (
                                                <p className='font-bold text-blue-900'>From: {msg.senderName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Content */}
                                    <p className='my-1 text-slate-900 font-medium break-words leading-relaxed whitespace-pre-wrap'>
                                        {msg.message}
                                    </p>

                                    {/* Footer Timestamp */}
                                    <span className='text-[10px] text-slate-500 block text-right mt-1 w-full font-medium'>
                                        {formatTime(msg.createdAt)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AllChats;