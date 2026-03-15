'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs, query, where, addDoc, doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Suspense } from 'react';

function NewOrderForm() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('service') || '');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, where('status', '==', 'Active'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData: any[] = [];
      querySnapshot.forEach((doc) => {
        servicesData.push({ id: doc.id, ...doc.data() });
      });
      setServices(servicesData);
    });

    return () => unsubscribe();
  }, []);

  const selectedService = useMemo(() => 
    services.find(s => s.id === selectedServiceId), 
  [services, selectedServiceId]);

  const totalCharge = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    return (selectedService.price / 1000) * quantity;
  }, [selectedService, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !selectedService) return;

    setError('');
    setLoading(true);

    if (quantity < selectedService.min || quantity > selectedService.max) {
      setError(`Số lượng phải từ ${selectedService.min} đến ${selectedService.max}`);
      setLoading(false);
      return;
    }

    if (profile.balance < totalCharge) {
      setError('Số dư không đủ. Vui lòng nạp thêm tiền.');
      setLoading(false);
      return;
    }

    try {
      // Create order
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        serviceId: selectedService.id,
        link,
        quantity,
        charge: totalCharge,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      });

      // Update user balance
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        balance: increment(-totalCharge),
        totalSpent: increment(totalCharge)
      });

      setSuccess(true);
      setTimeout(() => router.push('/orders'), 2000);
    } catch (err) {
      console.error(err);
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Đặt đơn mới</h1>
        <p className="text-zinc-500">Chọn dịch vụ và nhập thông tin để bắt đầu.</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700"
          >
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Đặt hàng thành công! Đang chuyển hướng...</p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Dịch vụ</label>
          <select 
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            required
          >
            <option value="">Chọn dịch vụ...</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price.toLocaleString()} đ / 1k
              </option>
            ))}
          </select>
        </div>

        {selectedService && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2"
          >
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Thông tin dịch vụ</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Tối thiểu:</span>
                <span className="ml-2 font-medium">{selectedService.min.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-500">Tối đa:</span>
                <span className="ml-2 font-medium">{selectedService.max.toLocaleString()}</span>
              </div>
            </div>
            {selectedService.description && (
              <p className="text-xs text-zinc-500 mt-2">{selectedService.description}</p>
            )}
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Link / Username</label>
          <input 
            type="text" 
            placeholder="Nhập link bài viết hoặc username..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Số lượng</label>
          <input 
            type="number" 
            placeholder="Nhập số lượng..."
            value={quantity || ''}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            required
          />
        </div>

        <div className="pt-4 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-6">
            <span className="text-zinc-500 font-medium">Tổng thanh toán:</span>
            <span className="text-2xl font-bold">{totalCharge.toLocaleString()} VND</span>
          </div>
          
          <button 
            type="submit"
            disabled={loading || !selectedService || success}
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Đặt hàng ngay
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>}>
        <NewOrderForm />
      </Suspense>
    </DashboardLayout>
  );
}
