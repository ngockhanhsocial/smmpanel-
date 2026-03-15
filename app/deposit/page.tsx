'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Wallet, QrCode, CreditCard, Info, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function DepositPage() {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState<number>(50000);
  const [method, setMethod] = useState('vietqr');

  const depositMethods = [
    { id: 'vietqr', name: 'VietQR (Tự động)', icon: QrCode, description: 'Nạp tiền tự động qua mã QR ngân hàng.' },
    { id: 'bank', name: 'Chuyển khoản', icon: CreditCard, description: 'Chuyển khoản thủ công tới số tài khoản.' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nạp tiền vào tài khoản</h1>
          <p className="text-zinc-500">Chọn phương thức nạp tiền phù hợp với bạn.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {depositMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    method === m.id 
                      ? 'border-zinc-900 bg-white shadow-md' 
                      : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  <div className={`p-2 rounded-xl w-fit mb-4 ${method === m.id ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 border border-zinc-200'}`}>
                    <m.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-1">{m.name}</h3>
                  <p className="text-xs text-zinc-500">{m.description}</p>
                </button>
              ))}
            </div>

            {/* Amount Selection */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold">Số tiền cần nạp</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[20000, 50000, 100000, 200000, 500000, 1000000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${
                      amount === val 
                        ? 'bg-zinc-900 text-white border-zinc-900' 
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900'
                    }`}
                  >
                    {val.toLocaleString()}
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Số tiền tùy chỉnh</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 font-bold text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">VND</span>
                </div>
                <p className="text-xs text-zinc-500">Tối thiểu: 10,000 VND. Tối đa: 100,000,000 VND.</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6 sticky top-24">
              <h3 className="text-lg font-bold">Thông tin thanh toán</h3>
              
              {method === 'vietqr' ? (
                <div className="space-y-6 text-center">
                  <div className="aspect-square bg-white rounded-xl flex items-center justify-center border-2 border-zinc-200 p-2 shadow-inner relative overflow-hidden">
                    <Image 
                      src={`https://img.vietqr.io/image/MB-1234567890-compact2.png?amount=${amount}&addInfo=NAP%20${user?.uid.slice(0, 6).toUpperCase()}&accountName=NGUYEN%20VAN%20A`}
                      alt="VietQR Code"
                      fill
                      className="object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-500">Nội dung chuyển khoản:</p>
                    <div className="p-3 bg-zinc-900 text-white rounded-xl font-mono text-lg font-bold tracking-wider relative group">
                      NAP {user?.uid.slice(0, 6).toUpperCase()}
                      <button 
                        onClick={() => navigator.clipboard.writeText(`NAP ${user?.uid.slice(0, 6).toUpperCase()}`)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-red-500 font-bold uppercase">Quan trọng: Nhập đúng nội dung để nạp tự động</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1 relative group">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Ngân hàng</p>
                    <p className="font-bold">MB BANK (Quân Đội)</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText('MB BANK')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1 relative group">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Số tài khoản</p>
                    <p className="font-bold text-lg">1234567890</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText('1234567890')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1 relative group">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Chủ tài khoản</p>
                    <p className="font-bold uppercase">NGUYEN VAN A</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText('NGUYEN VAN A')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                  <Info className="w-4 h-4" />
                  <span>Tiền sẽ được cộng vào tài khoản sau 1-5 phút.</span>
                </div>
                <button className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                  Xác nhận đã chuyển
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
