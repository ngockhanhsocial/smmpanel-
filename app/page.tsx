'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShoppingCart, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomePage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalSpent: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', user.uid));
    
    // Real-time stats listener
    const unsubscribeStats = onSnapshot(q, (querySnapshot) => {
      let total = 0;
      let completed = 0;
      let pending = 0;
      let spent = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.status === 'Completed') completed++;
        if (data.status === 'Pending') pending++;
        spent += data.charge || 0;
      });

      setStats({
        totalOrders: total,
        completedOrders: completed,
        pendingOrders: pending,
        totalSpent: spent
      });
      setLoadingStats(false);
    });

    // Real-time recent orders listener
    const recentQ = query(ordersRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(recentQ, (recentSnapshot) => {
      const orders: any[] = [];
      recentSnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      setRecentOrders(orders);
    });

    return () => {
      unsubscribeStats();
      unsubscribeRecent();
    };
  }, [user]);

  const statCards = [
    { name: 'Tổng đơn hàng', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Đã hoàn thành', value: stats.completedOrders, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Đang xử lý', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Tổng chi tiêu', value: `${stats.totalSpent.toLocaleString()} đ`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chào mừng trở lại, {user?.displayName}!</h1>
          <p className="text-zinc-500">Đây là tổng quan về hoạt động của bạn trên hệ thống.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{stat.name}</p>
                {loadingStats ? (
                  <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-lg mt-1" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Đơn hàng gần đây</h2>
              <button className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Xem tất cả</button>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dịch vụ</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Số lượng</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-zinc-900">#{order.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">Dịch vụ #{order.serviceId}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{order.quantity.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-zinc-100 text-zinc-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                          Chưa có đơn hàng nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions / Info */}
          <div className="space-y-6">
            <div className="p-6 bg-zinc-900 text-white rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold mb-2">Hỗ trợ 24/7</h3>
              <p className="text-zinc-400 text-sm mb-6">Bạn gặp khó khăn? Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ.</p>
              <button className="w-full py-3 bg-white text-zinc-900 rounded-xl font-medium hover:bg-zinc-100 transition-colors">
                Gửi yêu cầu hỗ trợ
              </button>
            </div>

            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold mb-4">Thông báo</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg h-fit">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cập nhật hệ thống</p>
                    <p className="text-xs text-zinc-500">Hệ thống vừa cập nhật thêm 50+ dịch vụ TikTok mới.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
