'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { HelpCircle, MessageSquare, Mail, Phone, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const faqs = [
  {
    question: 'Làm thế nào để nạp tiền?',
    answer: 'Bạn có thể nạp tiền qua VietQR hoặc chuyển khoản ngân hàng tại trang "Nạp tiền". Hệ thống sẽ tự động cộng tiền sau 1-5 phút nếu bạn nhập đúng nội dung chuyển khoản.'
  },
  {
    question: 'Đơn hàng của tôi khi nào bắt đầu?',
    answer: 'Hầu hết các dịch vụ sẽ bắt đầu ngay lập tức hoặc sau vài phút. Tuy nhiên, một số dịch vụ có thể mất đến 24h để bắt đầu tùy thuộc vào tình trạng hệ thống.'
  },
  {
    question: 'Tôi có được hoàn tiền nếu đơn hàng lỗi không?',
    answer: 'Có, hệ thống sẽ tự động hoàn tiền vào số dư tài khoản nếu đơn hàng bị hủy hoặc không thể hoàn thành.'
  },
  {
    question: 'Làm thế nào để trở thành đại lý?',
    answer: 'Khi tổng chi tiêu của bạn đạt mốc nhất định, hệ thống sẽ tự động nâng cấp hạng thành viên của bạn để nhận được mức giá ưu đãi hơn.'
  }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Trung tâm hỗ trợ</h1>
          <p className="text-zinc-500">Chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm text-center space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl w-fit mx-auto">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold">Live Chat</h3>
              <p className="text-xs text-zinc-500">Hỗ trợ trực tuyến 24/7</p>
            </div>
            <button className="w-full py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium">Chat ngay</button>
          </div>

          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm text-center space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl w-fit mx-auto">
              <Phone className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold">Zalo / Telegram</h3>
              <p className="text-xs text-zinc-500">0987.xxx.xxx</p>
            </div>
            <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">Liên hệ Zalo</button>
          </div>

          <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm text-center space-y-4">
            <div className="p-3 bg-purple-50 rounded-xl w-fit mx-auto">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold">Email</h3>
              <p className="text-xs text-zinc-500">support@smmpanel.vn</p>
            </div>
            <button className="w-full py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium">Gửi Email</button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="w-6 h-6" />
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-4 text-sm text-zinc-600 leading-relaxed"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-200 text-center space-y-4">
          <h3 className="text-lg font-bold">Bạn vẫn còn thắc mắc?</h3>
          <p className="text-zinc-500">Nếu bạn không tìm thấy câu trả lời trong FAQ, hãy gửi yêu cầu hỗ trợ cho chúng tôi.</p>
          <button className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors">
            Gửi Ticket hỗ trợ
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
