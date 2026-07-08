import React, { useState, useRef } from 'react';
import { Camera, Video, Paperclip, Send, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { Page } from 'zmp-ui';
import logoImg from '../static/logo_tachnen.png';

function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showMediaToast, setShowMediaToast] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'moitruong', name: 'Môi trường' },
    { id: 'antoangiaothong', name: 'An toàn giao thông' },
    { id: 'anningtrattu', name: 'An ninh trật tự' },
    { id: 'gopyvankiendaihoi', name: 'Góp ý Văn kiện Đại hội' },
    { id: 'KHCNdoimoisangtao', name: 'KHCN & Đổi mới sáng tạo' },
    { id: 'ykiendoanhnghiep', name: "Ý kiến Doanh nghiệp" },
    { id: 'congvucongchuc', name: 'Công Vụ - Công Chức' },
    { id: 'hatangdothi', name: 'Hạ tầng đô thị' },
    { id: 'nhadatxaydung', name: 'Nhà đất - Xây dựng' },
    { id: 'baovetreem', name: 'Bảo vệ trẻ em'},
    { id: 'antoanthucpham', name: 'An toàn thực phẩm'},
    { id: 'hanghoadichvu', name: 'Hàng hóa - Dịch vụ'},
    { id: 'nguoitieudung', name: 'Người tiêu dùng'},
    { id: 'khac', name: 'Lĩnh vực khác' },
  ];
  const selectedCategoryName = categories.find(c => c.id === formData.category)?.name || '-- Chọn lĩnh vực --';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];

      filesArray.forEach(file => {
        // Giới hạn 10MB
        if (file.size > 10 * 1024 * 1024) {
          oversizedFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (oversizedFiles.length > 0) {
        alert(`Cảnh báo: Các file sau vượt quá giới hạn 10MB và không được thêm vào:\n\n${oversizedFiles.join('\n')}`);
      }

      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setShowMediaToast(true);
        setTimeout(() => setShowMediaToast(false), 3000);
      }
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setShowToast(false);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('content', formData.content);
      
      selectedFiles.forEach(file => {
        data.append('files', file);
      });

      const response = await fetch('https://zalo-test.1022.vn/api/feedbacks', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowToast(true);
        setFormData({ title: '', category: '', content: '' });
        setSelectedFiles([]);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert('Có lỗi xảy ra: ' + (result.message || 'Vui lòng thử lại sau.'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page className="min-h-screen bg-gray-100 flex justify-center font-sans relative">
      {/* Mobile container simulating Zalo Mini App */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative overflow-hidden flex flex-col">

        {/* Toast Notification */}
        {showToast && (
          <div className="absolute top-24 left-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
              <p className="text-sm font-medium leading-snug">
                Gửi phản ánh thành công! Dữ liệu đã được tiếp nhận và xử lý.
              </p>
            </div>
          </div>
        )}

        {/* Media Toast Notification */}
        {showMediaToast && (
          <div className="absolute top-24 left-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
              <p className="text-sm font-medium leading-snug">
                Thông tin đã được lưu về thiết bị
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-blue-700 px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-40 shadow-sm relative">
          <div className="w-14 h-14 bg-white rounded-full p-1 shadow-inner flex items-center justify-center flex-shrink-0">
            <img src={logoImg} alt="Logo Đà Nẵng" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-[17px] uppercase tracking-wide leading-tight">
              Cổng Góp Ý Đà Nẵng
            </h1>
            <p className="text-white/90 text-xs mt-0.5 font-medium">
              Góp ý văn minh, chính xác - Xử lý trách nhiệm, hiệu quả
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-5">

            <div className="flex flex-col gap-6">
              {/* Tiêu đề */}
              <div className="flex flex-col gap-2.5">
                <label htmlFor="title" className="text-lg font-semibold text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                />
              </div>

              {/* Lĩnh vực */}
              <div className="flex flex-col gap-2.5 relative">
                <label className="text-lg font-semibold text-gray-700">Lĩnh vực <span className="text-red-500">*</span></label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-lg bg-white flex justify-between items-center text-left ${formData.category ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    <span>{selectedCategoryName}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in-down">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: cat.id }));
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3.5 hover:bg-blue-50 transition-colors text-lg ${formData.category === cat.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nội dung */}
              <div className="flex flex-col gap-2.5">
                <label htmlFor="content" className="text-lg font-semibold text-gray-700">Nội dung chi tiết <span className="text-red-500">*</span></label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={8}
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung chi tiết..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg resize-none no-scrollbar"
                />
              </div>
            </div>

            {/* Attachment Section */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-base font-semibold text-gray-700 px-1">Đính kèm (tùy chọn)</span>
              
              {/* Hidden file inputs */}
              <input type="file" accept="image/*" capture="environment" ref={imageInputRef} className="hidden" onChange={handleFileChange} />
              <input type="file" accept="video/*" capture="environment" ref={videoInputRef} className="hidden" onChange={handleFileChange} />
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />

              <div className="flex gap-3">
                <button type="button" onClick={() => imageInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 active:bg-blue-100 transition-colors">
                  <Camera className="w-6 h-6" />
                  <span className="text-sm font-medium">Chụp Ảnh</span>
                </button>
                <button type="button" onClick={() => videoInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 active:bg-blue-100 transition-colors">
                  <Video className="w-6 h-6" />
                  <span className="text-sm font-medium">Quay Video</span>
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 active:bg-blue-100 transition-colors">
                  <Paperclip className="w-6 h-6" />
                  <span className="text-sm font-medium">Tệp đính kèm</span>
                </button>
              </div>

              {/* Hiển thị danh sách file đã chọn */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-col gap-2 mt-3">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                      <span className="text-sm text-gray-700 truncate max-w-[80%]">{file.name}</span>
                      <button type="button" onClick={() => removeFile(idx)} className="text-red-500 text-sm font-bold px-2 py-1 hover:text-red-700">X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spacer for bottom padding */}
            <div className="h-6"></div>
          </form>
        </main>

        {/* Footer with Submit Button */}
        <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-40">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-[15px] shadow-md transition-all active:scale-[0.98] ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Gửi phản ánh
              </>
            )}
          </button>
        </div>

      </div>

      {/* Basic Keyframes for Toast Animation inline */}
      <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.4s ease-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Page>
  );
}

export default HomePage;
