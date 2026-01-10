"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Wifi, WifiOff, Radio, X, Share2 } from 'lucide-react';
import { useCollaboration } from '@/hooks/useCollaboration';

/**
 * CollaborationPanel - UI for real-time collaborative DJ sessions
 * 
 * Phase 4: Advanced Features - Collaboration (Optional)
 * 
 * Features:
 * - Room creation/joining
 * - Connected peer list
 * - Connection status
 * - Sync state visualization
 * - User presence indicators
 */

interface CollaborationPanelProps {
  onClose?: () => void;
}

export function CollaborationPanel({ onClose }: CollaborationPanelProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  
  const collaboration = useCollaboration({
    roomName: hasJoined ? roomName : '',
    userName: userName || 'Anonymous DJ',
    enabled: isEnabled && hasJoined,
    debug: true,
  });
  
  const handleJoinRoom = () => {
    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }
    
    setIsEnabled(true);
    setHasJoined(true);
  };
  
  const handleLeaveRoom = () => {
    setIsEnabled(false);
    setHasJoined(false);
  };
  
  const peerInfo = collaboration.getPeerInfo();
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg bg-zinc-900 border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 font-mono overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-950 border-b border-purple-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              Collaboration
            </h2>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          )}
        </div>
        
        {/* Connection Status */}
        {hasJoined && (
          <div className="p-4 bg-zinc-950/50 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {collaboration.isConnected ? (
                    <>
                      <Wifi className="w-5 h-5 text-green-500" />
                      <motion.div
                        className="absolute -inset-1"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <Wifi className="w-5 h-5 text-green-500" />
                      </motion.div>
                    </>
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                </div>
                
                <div className="text-sm">
                  <div className="text-white font-bold">
                    {collaboration.isConnected ? 'Connected' : 'Connecting...'}
                  </div>
                  <div className="text-white/60 text-xs">
                    Room: {roomName}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLeaveRoom}
                className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {!hasJoined ? (
            // Join Room Form
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="DJ Name (optional)"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 text-white placeholder-white/40 focus:border-purple-500/50 focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 text-white placeholder-white/40 focus:border-purple-500/50 focus:outline-none transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleJoinRoom();
                  }}
                />
              </div>
              
              <button
                onClick={handleJoinRoom}
                className="w-full px-6 py-3 bg-purple-500 text-white font-bold uppercase tracking-wider hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Join Room
              </button>
              
              <div className="text-white/40 text-xs text-center space-y-1">
                <p>🎵 Collaborate in real-time with other DJs</p>
                <p>🔒 Peer-to-peer connection (no server)</p>
                <p>🌐 Share mixer controls and effects</p>
              </div>
            </motion.div>
          ) : (
            // Connected View
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Peer List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold uppercase tracking-wider text-sm">
                    Connected DJs ({collaboration.peerCount})
                  </h3>
                  
                  {collaboration.peerCount > 0 && (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>Live</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {collaboration.peerCount === 0 ? (
                    <div className="text-center py-8 text-white/40 text-sm">
                      <Share2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Waiting for others to join...</p>
                      <p className="text-xs mt-1">Share the room name: <span className="text-purple-400 font-bold">{roomName}</span></p>
                    </div>
                  ) : (
                    peerInfo.map((peer) => (
                      <motion.div
                        key={peer.id}
                        className="flex items-center gap-3 p-3 bg-black/40 border border-purple-500/20"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <div className="flex-1">
                          <div className="text-white font-bold text-sm">
                            {peer.name}
                          </div>
                          <div className="text-white/40 text-xs font-mono">
                            ID: {peer.id.slice(0, 8)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Sync Status */}
              {collaboration.state && Object.keys(collaboration.state).length > 0 && (
                <div>
                  <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-3">
                    Synced State
                  </h3>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-black/40 border border-white/10">
                        <div className="text-white/40">Crossfader</div>
                        <div className="text-white font-bold">
                          {((collaboration.state.crossfader as number) * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="p-2 bg-black/40 border border-white/10">
                        <div className="text-white/40">Master Volume</div>
                        <div className="text-white font-bold">
                          {((collaboration.state.masterVolume as number) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-zinc-950/50 border-t border-white/10 text-xs text-white/40">
          <p>
            💡 Tip: All mixer changes are synchronized in real-time across all connected DJs.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
