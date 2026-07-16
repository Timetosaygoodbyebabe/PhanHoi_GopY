import React, { useState } from 'react';
import { Page, Header, Box, Text, Button, useNavigate } from 'zmp-ui';
import { Search, Clock, MapPin, AlertCircle } from 'lucide-react';

export default function HistoryPage() {
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!phone) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/feedback-history?phone=${phone}`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.content) {
        setHistory(result.data.content);
      } else if (result.success && Array.isArray(result.data)) {
        setHistory(result.data);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHUA_XU_LY': return 'text-yellow-600 bg-yellow-50';
      case 'CHO_DUYET': return 'text-purple-600 bg-purple-50';
      case 'DANG_XU_LY': return 'text-blue-600 bg-blue-50';
      case 'DA_XU_LY': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50 border border-gray-100';
    }
  };

  return (
    <Page className="bg-gray-100 min-h-screen">
      <Header title="Lịch sử góp ý" onBackClick={() => navigate(-1)} />
      
      <Box className="p-4 bg-white shadow-sm mb-4">
        <Text className="text-sm text-gray-600 mb-2 font-medium">Nhập số điện thoại đã gửi phản ánh:</Text>
        <div className="flex gap-2">
          <input 
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ví dụ: 0912345678"
            className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <Button onClick={handleSearch} loading={isLoading} className="bg-blue-600 text-white rounded-lg px-4 flex items-center justify-center h-10 w-12">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </Box>

      <Box className="px-4 pb-8">
        {isLoading && <Text className="text-center text-gray-500 mt-8">Đang tải dữ liệu...</Text>}
        
        {!isLoading && hasSearched && history.length === 0 && (
          <div className="text-center mt-12 flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
            <Text className="text-gray-500 text-lg">Không tìm thấy góp ý nào</Text>
            <Text className="text-gray-400 text-sm mt-1">Vui lòng kiểm tra lại số điện thoại</Text>
          </div>
        )}

        {!isLoading && history.map((item, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <Text className="font-semibold text-gray-800 line-clamp-2 flex-1 pr-2 leading-tight">
                {item.noiDungYKien || item.tieuDe || "Góp ý không có nội dung"}
              </Text>
              <span className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${getStatusColor(item.tinhTrangXuLy)}`}>
                {item.tenTinhTrangXuLy || item.tinhTrangXuLy || "Đã tiếp nhận"}
              </span>
            </div>
            
            <div className="flex items-center text-gray-500 text-xs mt-3 gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <Text className="line-clamp-1">{item.noiDienRa || "Chưa có địa chỉ cụ thể"}</Text>
            </div>
            
            <div className="flex items-center justify-between text-gray-400 text-[11px] mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{item.ngayGui || item.ngayTao || item.ngayDienRa || "Gần đây"}</span>
              </div>
              <span className="font-medium text-gray-500">Mã: {item.maGopY || item.id || "#"}</span>
            </div>
          </div>
        ))}
      </Box>
    </Page>
  );
}
