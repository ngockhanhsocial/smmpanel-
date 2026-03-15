'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Users, 
  ShoppingCart, 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'orders' | 'users'>('services');
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [providerUrl, setProviderUrl] = useState('');
  const [providerKey, setProviderKey] = useState('');
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);
  const [newService, setNewService] = useState({
    name: '',
    categoryId: '',
    platformId: '',
    description: '',
    price: 0,
    costPrice: 0,
    min: 100,
    max: 10000,
    serviceType: 'Default',
    providerId: '',
    providerServiceId: '',
    status: 'Active',
    refill: false,
    cancel: false
  });

  useEffect(() => {
    if (!profile || profile.rank !== 'Admin') return;

    const unsubServices = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'profiles'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubServices();
      unsubOrders();
      unsubUsers();
    };
  }, [profile]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (profile?.rank !== 'Admin') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold">Truy cập bị từ chối</h1>
          <p className="text-zinc-500">Bạn không có quyền truy cập vào trang này.</p>
        </div>
      </DashboardLayout>
    );
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'services', serviceId), { 
        status: currentStatus === 'Active' ? 'Inactive' : 'Active' 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'services'), {
        ...newService,
        price: Number(newService.price),
        costPrice: Number(newService.costPrice),
        min: Number(newService.min),
        max: Number(newService.max),
        createdAt: new Date().toISOString()
      });
      setIsAddServiceModalOpen(false);
      setNewService({
        name: '',
        categoryId: '',
        platformId: '',
        description: '',
        price: 0,
        costPrice: 0,
        min: 100,
        max: 10000,
        serviceType: 'Default',
        providerId: '',
        providerServiceId: '',
        status: 'Active',
        refill: false,
        cancel: false
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteDoc(doc(db, 'services', serviceToDelete.id));
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProviderServices = async () => {
    if (!providerUrl || !providerKey) return;
    setSyncLoading(true);
    try {
      // SMM Provider API V2 standard: action=services
      const response = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          key: providerKey,
          action: 'services'
        })
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setProviderServices(data);
      } else {
        alert('Không thể lấy dữ liệu từ nhà cung cấp. Vui lòng kiểm tra lại URL và Key.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối API nhà cung cấp.');
    } finally {
      setSyncLoading(false);
    }
  };

  const importService = async (providerSvc: any) => {
    try {
      await addDoc(collection(db, 'services'), {
        name: providerSvc.name,
        categoryId: providerSvc.category || '',
        platformId: '', // Need manual mapping or leave empty
        description: providerSvc.name,
        price: Number(providerSvc.rate) * 1.5, // Default 50% margin
        costPrice: Number(providerSvc.rate),
        min: Number(providerSvc.min),
        max: Number(providerSvc.max),
        serviceType: providerSvc.type || 'Default',
        providerId: providerUrl,
        providerServiceId: providerSvc.service,
        status: 'Active',
        refill: providerSvc.refill === '1' || providerSvc.refill === true,
        cancel: providerSvc.cancel === '1' || providerSvc.cancel === true,
        createdAt: new Date().toISOString()
      });
      alert(`Đã nhập thành công: ${providerSvc.name}`);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi nhập dịch vụ.');
    }
  };

  const filteredData = (() => {
    if (activeTab === 'services') {
      return services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (activeTab === 'orders') {
      return orders.filter(o => o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.userId.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (activeTab === 'users') {
      return users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return [];
  })();

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Control Panel</h1>
            <p className="text-zinc-500">Quản lý hệ thống, dịch vụ và người dùng.</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-zinc-200">
            <button 
              onClick={() => { setActiveTab('services'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'services' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Dịch vụ
            </button>
            <button 
              onClick={() => { setActiveTab('orders'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Đơn hàng
            </button>
            <button 
              onClick={() => { setActiveTab('users'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Người dùng
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder={`Tìm kiếm ${activeTab === 'services' ? 'dịch vụ' : activeTab === 'orders' ? 'đơn hàng' : 'người dùng'}...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          {activeTab === 'services' && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Đồng bộ API
              </button>
              <button 
                onClick={() => setIsAddServiceModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm dịch vụ
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {activeTab === 'services' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tên dịch vụ</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Giá / 1k</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Min / Max</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedData.map((service) => (
                    <tr key={service.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-zinc-900">{service.name}</p>
                        <p className="text-xs text-zinc-500">ID: {service.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">{service.price.toLocaleString()} đ</td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{service.min} / {service.max}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleServiceStatus(service.id, service.status)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            service.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {service.status}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setServiceToDelete(service);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID / User</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dịch vụ</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Số lượng / Giá</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedData.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-zinc-900">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-zinc-500">User: {order.userId.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">ID: {order.serviceId}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{order.quantity.toLocaleString()}</p>
                        <p className="text-xs text-zinc-500">{order.charge.toLocaleString()} đ</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-zinc-100 text-zinc-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Completed')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Hoàn thành"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Canceled')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Hủy đơn"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tên hiển thị</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Số dư</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Chi tiêu</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cấp bậc</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedData.map((u) => (
                    <tr key={u.uid} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-mono text-zinc-500">#{u.uid.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-zinc-900">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-zinc-900">{u.displayName || 'Chưa đặt tên'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">{u.balance.toLocaleString()} đ</td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{u.totalSpent.toLocaleString()} đ</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.rank === 'Admin' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {u.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg" title="Chỉnh sửa">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Xóa người dùng">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="text-sm text-zinc-500">
              Hiển thị <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> trong tổng số <span className="font-medium">{filteredData.length}</span> kết quả
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      currentPage === page 
                        ? 'bg-zinc-900 text-white shadow-md' 
                        : 'hover:bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
          >
            <div className="sticky top-0 bg-white px-8 py-6 border-b border-zinc-100 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">Thêm dịch vụ mới</h2>
              <button 
                onClick={() => setIsAddServiceModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Tên dịch vụ</label>
                  <input 
                    required
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    placeholder="Ví dụ: Tăng Like Facebook"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Loại dịch vụ</label>
                  <select 
                    value={newService.serviceType}
                    onChange={(e) => setNewService({...newService, serviceType: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  >
                    <option value="Default">Mặc định</option>
                    <option value="Package">Gói</option>
                    <option value="Custom Comments">Bình luận tùy chỉnh</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">ID Danh mục</label>
                  <input 
                    type="text"
                    value={newService.categoryId}
                    onChange={(e) => setNewService({...newService, categoryId: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">ID Nền tảng</label>
                  <input 
                    type="text"
                    value={newService.platformId}
                    onChange={(e) => setNewService({...newService, platformId: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Giá bán (VND / 1k)</label>
                  <input 
                    required
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Giá gốc (VND / 1k)</label>
                  <input 
                    type="number"
                    value={newService.costPrice}
                    onChange={(e) => setNewService({...newService, costPrice: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Min</label>
                  <input 
                    required
                    type="number"
                    value={newService.min}
                    onChange={(e) => setNewService({...newService, min: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Max</label>
                  <input 
                    required
                    type="number"
                    value={newService.max}
                    onChange={(e) => setNewService({...newService, max: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">ID Nhà cung cấp</label>
                  <input 
                    type="text"
                    value={newService.providerId}
                    onChange={(e) => setNewService({...newService, providerId: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">ID Dịch vụ Nhà cung cấp</label>
                  <input 
                    type="text"
                    value={newService.providerServiceId}
                    onChange={(e) => setNewService({...newService, providerServiceId: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Mô tả</label>
                <textarea 
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none min-h-[100px]"
                  placeholder="Nhập mô tả dịch vụ..."
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={newService.refill}
                    onChange={(e) => setNewService({...newService, refill: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-700">Hỗ trợ Refill</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={newService.cancel}
                    onChange={(e) => setNewService({...newService, cancel: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-700">Hỗ trợ Hủy</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700">Trạng thái:</span>
                  <select 
                    value={newService.status}
                    onChange={(e) => setNewService({...newService, status: e.target.value})}
                    className="px-3 py-1 border border-zinc-200 rounded-lg text-sm"
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Inactive">Bảo trì</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-zinc-200 text-zinc-600 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20"
                >
                  Lưu dịch vụ
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Xác nhận xóa dịch vụ?</h2>
                <p className="text-zinc-500">
                  Bạn có chắc chắn muốn xóa dịch vụ <span className="font-semibold text-zinc-900">&quot;{serviceToDelete?.name}&quot;</span>? 
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setServiceToDelete(null);
                }}
                className="flex-1 px-6 py-3 border border-zinc-200 text-zinc-600 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleDeleteService}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Xóa ngay
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sync from Provider Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
          >
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-zinc-900" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Đồng bộ dịch vụ từ Nhà cung cấp</h2>
                  <p className="text-sm text-zinc-500">Kết nối API V2 để nhập dịch vụ nhanh chóng</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSyncModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">API URL (V2)</label>
                  <input 
                    type="text"
                    value={providerUrl}
                    onChange={(e) => setProviderUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    placeholder="https://provider.com/api/v2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">API Key</label>
                  <input 
                    type="password"
                    value={providerKey}
                    onChange={(e) => setProviderKey(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    placeholder="Nhập API Key của bạn"
                  />
                </div>
              </div>

              <button 
                onClick={fetchProviderServices}
                disabled={syncLoading || !providerUrl || !providerKey}
                className="w-full py-3 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {syncLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Lấy danh sách dịch vụ
              </button>

              {providerServices.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Danh sách dịch vụ ({providerServices.length})</h3>
                    <p className="text-xs text-zinc-500 italic">* Giá bán mặc định = Giá gốc + 50% lợi nhuận</p>
                  </div>
                  <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 border-b border-zinc-100">
                        <tr>
                          <th className="px-4 py-3 font-semibold">ID</th>
                          <th className="px-4 py-3 font-semibold">Tên dịch vụ</th>
                          <th className="px-4 py-3 font-semibold">Giá gốc</th>
                          <th className="px-4 py-3 font-semibold">Min/Max</th>
                          <th className="px-4 py-3 font-semibold">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {providerServices.map((svc) => (
                          <tr key={svc.service} className="hover:bg-zinc-50/50">
                            <td className="px-4 py-3 text-zinc-500">#{svc.service}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-zinc-900">{svc.name}</p>
                              <p className="text-xs text-zinc-400">{svc.category}</p>
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-600">{Number(svc.rate).toLocaleString()} đ</td>
                            <td className="px-4 py-3 text-zinc-500">{svc.min} / {svc.max}</td>
                            <td className="px-4 py-3">
                              <button 
                                onClick={() => importService(svc)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-900 hover:text-white rounded-lg transition-all text-xs font-medium"
                              >
                                <Plus className="w-3 h-3" />
                                Nhập
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
