import React, { useState, useRef } from 'react';
import { Camera, Send, Loader2, CheckCircle2, Navigation, AlertCircle } from 'lucide-react';
import { Page } from 'zmp-ui';
import { getLocation } from 'zmp-sdk';
import logoImg from '../static/logo_tachnen.png';

export type FormData = {
  name: string;
  email: string;
  phone: string;
  content: string;
  location: string;
};

export type UploadedFile = {
  id: string;
  file: File;
  url?: string;
  preview?: string;
  isUploading: boolean;
  isError: boolean;
};

function HomePage() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = isLocalhost ? '' : (import.meta.env.VITE_API_DOMAIN || 'https://gopy-danang-proxy.vercel.app');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    content: '',
    location: ''
  });

  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result as string;
      encoded = encoded.replace(/^data:(.*,)?/, '');
      resolve(encoded);
    };
    reader.onerror = error => reject(error);
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substring(2, 9),
        file: file,
        preview: URL.createObjectURL(file),
        isUploading: true,
        isError: false
      };

      setSelectedImage(newFile);

      const apiUser = import.meta.env.VITE_API_USER || 'appdnsmartcity';
      const apiPass = import.meta.env.VITE_API_PASS || '6LklPeKBZL5YTTzNGefenw0RhGfIWiiX';
      const authHeader = 'Basic ' + btoa(`${apiUser}:${apiPass}`);

      // Check file size (15MB limit) to prevent Base64 memory crash
      if (file.size > 15 * 1024 * 1024) {
        alert('File quá lớn! Vui lòng chọn ảnh/video dưới 15MB để tránh lỗi bộ nhớ.');
        setSelectedImage(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
        return;
      }

      try {
        const base64Content = await toBase64(file);
        const uploadPayload = {
          ten: file.name,
          base64Content: base64Content
        };

        const uploadRes = await fetch(`${API_BASE}/base-api/public/file`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(uploadPayload)
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          // API Đà Nẵng trả về { url: '...' }
          const returnedUrl = uploadData.url || uploadData.base64Content || '';
          setSelectedImage(prev => prev ? { ...prev, url: returnedUrl, isUploading: false } : null);
        } else {
          console.error('Lỗi upload file:', await uploadRes.text());
          setSelectedImage(prev => prev ? { ...prev, isUploading: false, isError: true } : null);
        }
      } catch (error) {
        console.error('Lỗi khi upload file', file.name, error);
        setSelectedImage(prev => prev ? { ...prev, isUploading: false, isError: true } : null);
      }
    }
    // Reset input value to allow selecting another file if needed
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      let lat = 0;
      let lon = 0;
      try {
        const result = await getLocation({});
        lat = Number(result.latitude);
        lon = Number(result.longitude);
      } catch (zmpError) {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } else {
          throw new Error('Not supported');
        }
      }

      if (lat && lon) {
        setLatitude(lat);
        setLongitude(lon);
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const parts: string[] = [];
          
          // 1. Vị trí chính xác (Số nhà + Tên đường, hoặc tên toà nhà)
          const street = addr.road || addr.pedestrian || addr.street || '';
          const exactLocation = addr.house_number ? `${addr.house_number} ${street}`.trim() : street;
          if (exactLocation) parts.push(exactLocation);
          else if (addr.amenity || addr.building || addr.shop) parts.push(addr.amenity || addr.building || addr.shop);
          
          // 2. Phường / Xã
          const ward = addr.suburb || addr.quarter || addr.village || addr.hamlet;
          if (ward && !ward.toLowerCase().includes('(cũ)')) parts.push(ward);
          
          // 3. Quận / Huyện
          const district = addr.city_district || addr.county || addr.district;
          if (district) parts.push(district);
          
          // 4. Thành phố / Tỉnh
          const city = addr.city || addr.state || addr.province || addr.town;
          if (city) parts.push(city);
          
          const locationString = parts.length > 0 ? parts.join(', ') : data.display_name;
          setFormData(prev => ({ ...prev, location: locationString }));
        } else if (data && data.display_name) {
          setFormData(prev => ({ ...prev, location: data.display_name }));
        }
      }
    } catch (error) {
      console.error('Lỗi lấy vị trí:', error);
      alert('Không thể lấy vị trí hiện tại. Vui lòng cấp quyền vị trí cho ứng dụng.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.content.trim()) {
      alert("Vui lòng nhập đầy đủ Họ và tên, Số điện thoại và Nội dung.");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setShowToast(false);

    try {
      if (selectedImage?.isUploading) {
        alert("Vui lòng đợi ảnh tải lên hoàn tất.");
        setIsLoading(false);
        return;
      }

      const apiUser = import.meta.env.VITE_API_USER || 'appdnsmartcity';
      const apiPass = import.meta.env.VITE_API_PASS || '6LklPeKBZL5YTTzNGefenw0RhGfIWiiX';
      const authHeader = 'Basic ' + btoa(`${apiUser}:${apiPass}`);

      const hinhAnhs: { url: string, ten: string }[] = [];
      if (selectedImage && selectedImage.url && !selectedImage.isError) {
        hinhAnhs.push({ url: selectedImage.url, ten: selectedImage.file.name });
      }

      let finalPhone = formData.phone.trim();
      let finalEmail = formData.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(finalPhone)) {
        finalEmail = finalPhone;
        finalPhone = '';
      }

      // Create feedback
      const payload = {
        userId: 123,
        tenDayDu: formData.name || "Người dùng Zalo Mini App",
        email: finalEmail,
        soDienThoai: finalPhone,
        tieuDe: "Góp ý từ Zalo Mini App",
        noiDungYKien: formData.content,
        noiDienRa: formData.location,
        latitude: latitude,
        longitude: longitude,
        ngayDienRa: "",
        thoiGianDienRa: "",
        videos: "",
        amThanh: "",
        hinhAnhs: hinhAnhs,
        fileDinhKem: { url: "", ten: "" },
        linhVucId: 1, // Default category
        nguonGopY: "ZALO"
      };

      const response = await fetch(`${API_BASE}/api/gopy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowToast(true);
        setFormData(prev => ({ ...prev, content: '', location: '' })); // Keep name, email, phone
        setLatitude(0);
        setLongitude(0);
        handleRemoveImage();
        
        // Hide toast after 3 seconds
        setTimeout(() => setShowToast(false), 3000);
      } else {
        const errorText = await response.text();
        alert('Có lỗi xảy ra: ' + errorText);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert('Không thể kết nối đến máy chủ. Lỗi chi tiết: ' + (error?.message || JSON.stringify(error)));
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
                <label className="text-lg font-semibold text-gray-700">Email</label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleInputChange}
                  placeholder="Nhập địa chỉ email (không bắt buộc)"
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
                <label className="text-lg font-semibold text-gray-700">Địa điểm diễn ra</label>
                <div className="flex gap-2">
                  <input
                    type="text" name="location" value={formData.location} onChange={handleInputChange}
                    placeholder="Địa chỉ hoặc tọa độ..."
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:border-blue-500"
                  />
                  <button type="button" onClick={handleGetLocation} disabled={isGettingLocation} className="px-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 active:bg-blue-100 transition-colors flex items-center justify-center disabled:opacity-50">
                    {isGettingLocation ? <Loader2 className="w-6 h-6 animate-spin" /> : <Navigation className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-lg font-semibold text-gray-700">Nội dung <span className="text-red-500">*</span></label>
                <textarea
                  name="content" required rows={5} value={formData.content} onChange={handleInputChange}
                  placeholder="Vui lòng nhập nội dung góp ý, phản ánh của bạn"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

            </div>

            <div className="flex flex-col gap-2 mt-2">
              <span className="text-base font-semibold text-gray-700 px-1">File đính kèm, hình ảnh, video (nếu có)</span>

              <input type="file" accept="image/*,video/*" ref={imageInputRef} className="hidden" onChange={handleImageChange} />

              {!selectedImage ? (
                <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-6 bg-blue-50 text-blue-600 rounded-xl border-2 border-dashed border-blue-200 active:bg-blue-100 transition-colors">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm font-medium">Chụp hoặc Chọn file</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  {selectedImage.file.type.startsWith('video/') ? (
                    <video src={selectedImage.preview} className="w-full h-48 object-cover" controls />
                  ) : (
                    <img src={selectedImage.preview} alt="Selected" className="w-full h-48 object-cover" />
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    {selectedImage.isUploading && (
                      <span className="bg-white/90 px-2 py-1 rounded-lg flex items-center gap-1 text-sm text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                      </span>
                    )}
                    {selectedImage.isError && (
                      <span className="bg-white/90 px-2 py-1 rounded-lg flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" /> Lỗi tải lên
                      </span>
                    )}
                  </div>
                  <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">
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
