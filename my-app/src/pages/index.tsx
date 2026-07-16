import React, { useState, useRef } from 'react';
import { Camera, Send, Loader2, CheckCircle2, Navigation } from 'lucide-react';
import { Page } from 'zmp-ui';
import logoImg from '../static/logo_tachnen.png';

function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    content: '',
    location: ''
  });
  const [selectedImage, setSelectedImage] = useState<{ file: File, base64: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          file,
          base64: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: `${position.coords.latitude}, ${position.coords.longitude}`
          }));
        },
        (error) => {
          alert('Không thể lấy vị trí. Vui lòng bật định vị trên thiết bị.');
        }
      );
    } else {
      alert('Trình duyệt không hỗ trợ định vị.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.name || !formData.phone || !formData.content) {
      alert('Vui lòng điền đầy đủ Tên, Số điện thoại và Nội dung!');
      return;
    }

    setIsLoading(true);
    setShowToast(false);

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        content: formData.content,
        location: formData.location,
        media_base64: selectedImage ? selectedImage.base64 : null,
        media_name: selectedImage ? selectedImage.file.name : "image.jpg"
      };

      // Gọi qua proxy của Vite, tránh bị chặn tường lửa
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowToast(true);
        setFormData({ name: '', phone: '', content: '', location: '' });
        setSelectedImage(null);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert('Có lỗi xảy ra: ' + (result.detail || 'Vui lòng thử lại sau.'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page className="min-h-screen bg-gray-100 flex justify-center font-sans relative">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative overflow-hidden flex flex-col">

        {showToast && (
          <div className="absolute top-24 left-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
              <p className="text-sm font-medium leading-snug">
                Gửi phản ánh thành công! Dữ liệu đã được tiếp nhận.
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
              Cổng góp ý Đà Nẵng
            </h1>
            <p className="text-white/90 text-xs mt-0.5 font-medium">
              Góp ý văn minh, chính xác - Xử lý trách nhiệm, hiệu quả
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-5">
            <div className="flex flex-col gap-5">

              <div className="flex flex-col gap-2.5">
                <label className="text-lg font-semibold text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                <input
                  type="text" name="name" required value={formData.name} onChange={handleInputChange}
                  placeholder="Nhập họ tên của bạn"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-lg font-semibold text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                <input
                  type="tel" name="phone" required value={formData.phone} onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-lg font-semibold text-gray-700">Vị trí hiện trường</label>
                <div className="flex gap-2">
                  <input
                    type="text" name="location" value={formData.location} onChange={handleInputChange}
                    placeholder="Địa chỉ hoặc tọa độ..."
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:border-blue-500"
                  />
                  <button type="button" onClick={getLocation} className="px-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 active:bg-blue-100 transition-colors flex items-center justify-center">
                    <Navigation className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-lg font-semibold text-gray-700">Nội dung <span className="text-red-500">*</span></label>
                <textarea
                  name="content" required rows={5} value={formData.content} onChange={handleInputChange}
                  placeholder="Nhập nội dung phản ánh..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

            </div>

            <div className="flex flex-col gap-2 mt-2">
              <span className="text-base font-semibold text-gray-700 px-1">Đính kèm ảnh</span>

              <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageChange} />

              {!selectedImage ? (
                <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-6 bg-blue-50 text-blue-600 rounded-xl border-2 border-dashed border-blue-200 active:bg-blue-100 transition-colors">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm font-medium">Chụp hoặc Chọn ảnh</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={selectedImage.base64} alt="Selected" className="w-full h-48 object-cover" />
                  <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">
                    X
                  </button>
                </div>
              )}
            </div>
            <div className="h-6"></div>
          </form>
        </main>

        <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-40">
          <button
            onClick={handleSubmit} disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-[15px] shadow-md transition-all active:scale-[0.98] ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
            ) : (
              <><Send className="w-5 h-5" /> Gửi phản ánh</>
            )}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.4s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </Page>
  );
}

export default HomePage;
