'use client';

import { useEffect, useState } from 'react';

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    topBuyer: '—',
  });

  const fetchStats = async () => {
    try {
      const [pendingRes, statsRes] = await Promise.all([
        fetch('/api/admin/rfp/list?status=in_review'),
        fetch('/api/admin/rfp/stats')
      ]);

      const pendingData = await pendingRes.json();
      const statsData = await statsRes.json();

      setStats({
        totalPending: pendingData.rfps?.length || 0,
        totalApproved: statsData.totalApproved || 0,
        totalRejected: statsData.totalRejected || 0,
        topBuyer: statsData.topBuyer || 'No activity yet',
      });
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-6 mb-10">
      {/* Total Pending */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Total Pending</p>
            <p className="text-5xl font-semibold text-gray-900 mt-3">{stats.totalPending}</p>
          </div>
        </div>
      </div>

      {/* Total Approved */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Total Approved</p>
            <p className="text-5xl font-semibold text-emerald-600 mt-3">{stats.totalApproved}</p>
          </div>
        </div>
      </div>

      {/* Total Rejected */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Total Rejected</p>
            <p className="text-5xl font-semibold text-red-600 mt-3">{stats.totalRejected}</p>
          </div>
        </div>
      </div>

      {/* Most Active Buyer */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Most Active Buyer</p>
            <p className="text-2xl font-semibold text-gray-900 mt-3">{stats.topBuyer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}