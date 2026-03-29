'use client';

import { useEffect, useState } from 'react';

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalPending: 0,
    urgentReview: 0,
    approvedThisWeek: 0,
    topBuyer: '—'
  });

  const fetchStats = async () => {
    try {
      // Pending RFPs
      const pendingRes = await fetch('/api/admin/rfp/pending');
      const pendingData = await pendingRes.json();

      const pending = pendingData.rfps?.length || 0;
      const urgent = pendingData.rfps?.filter((r: any) => 
        r.budget && parseFloat(r.budget) > 100000
      ).length || 0;

      // Stats API (Option A)
      const statsRes = await fetch('/api/admin/rfp/stats');
      const statsData = await statsRes.json();

      setStats({
        totalPending: pending,
        urgentReview: urgent,
        approvedThisWeek: statsData.approvedThisWeek || 0,
        topBuyer: statsData.topBuyer || '—'
      });
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-6 mb-10">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Total Pending</p>
            <p className="text-5xl font-semibold text-gray-900 mt-3">{stats.totalPending}</p>
          </div>
          <div className="text-4xl text-gray-300">📄</div>
        </div>
        <p className="text-blue-600 text-sm mt-4">+3 new this hour</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Urgent Review</p>
            <p className="text-5xl font-semibold text-orange-600 mt-3">{stats.urgentReview}</p>
          </div>
          <div className="text-4xl">⏰</div>
        </div>
        <p className="text-gray-500 text-sm mt-4">Avg 4.2h</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Approved & Published</p>
            <p className="text-5xl font-semibold text-emerald-600 mt-3">{stats.approvedThisWeek}</p>
          </div>
          <div className="text-4xl text-emerald-500">✓</div>
        </div>
        <p className="text-gray-500 text-sm mt-4">This week</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Top Buyer Activity</p>
            <p className="text-2xl font-semibold text-gray-900 mt-3">{stats.topBuyer}</p>
          </div>
          <div className="text-4xl text-purple-500">👥</div>
        </div>
        <p className="text-emerald-600 text-sm mt-4">Active</p>
      </div>
    </div>
  );
}