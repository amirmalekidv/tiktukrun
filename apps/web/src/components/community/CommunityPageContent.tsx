'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ActiveTeamsList from '@/components/community/ActiveTeamsList';
import LiveChatPanel from '@/components/community/LiveChatPanel';
import CreateTeamModal from '@/components/community/CreateTeamModal';

export default function CommunityPageContent() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-2xl text-red-500">انجمن</h1>
          <p className="text-gray-500 font-vazir text-sm mt-1">تیم سازی و چت زنده</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-red-900/40 border border-red-700/50 text-red-400 rounded-xl font-vazir text-sm hover:bg-red-800/50 transition-all"
        >
          <i className="fas fa-plus ml-2" />
          ساخت تیم
        </button>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <ActiveTeamsList />
        <LiveChatPanel roomType="global" title="چت زنده" />
      </div>
      <CreateTeamModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </motion.div>
  );
}
