import React from "react";
import { Instagram, Twitter, Facebook } from "react-feather";

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 text-white w-full py-6 px-4 md:px-10 mb-5">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 border-t border-b border-gray-700 py-12 md:py-24">
          <div>
            <p className="text-lg font-semibold mb-2">Công ty</p>
            <p className="text-gray-400 text-base hover:underline">Giới thiệu</p>
            <p className="text-gray-400 text-base hover:underline">Việc làm</p>
            <p className="text-gray-400 text-base hover:underline">For the Record</p>
          </div>
          <div>
            <p className="text-lg font-semibold mb-2">Cộng đồng</p>
            <p className="text-gray-400 text-base hover:underline">Dành cho các Nghệ sĩ</p>
            <p className="text-gray-400 text-base hover:underline">Nhà phát triển</p>
            <p className="text-gray-400 text-base hover:underline">Quảng cáo</p>
            <p className="text-gray-400 text-base hover:underline">Nhà đầu tư</p>
            <p className="text-gray-400 text-base hover:underline">Nhà cung cấp</p>
          </div>
          <div>
            <p className="text-lg font-semibold mb-2">Liên kết hữu ích</p>
            <p className="text-gray-400 text-base hover:underline">Hỗ trợ</p>
            <p className="text-gray-400 text-base hover:underline">Ứng dụng Di động Miễn phí</p>
            <p className="text-gray-400 text-base hover:underline">Phó biên theo quốc gia</p>
          </div>
          <div>
            <p className="text-lg font-semibold mb-2">Các gói của Spotify</p>
            <p className="text-gray-400 text-base hover:underline">Premium Individual</p>
            <p className="text-gray-400 text-base hover:underline">Premium Student</p>
            <p className="text-gray-400 text-base hover:underline">Spotify Free</p>
          </div>
          <div>
            <div className="flex space-x-4 mb-4">
              <Instagram className="h-6 w-6 text-white hover:text-gray-300 transition-colors duration-200" />
              <Twitter className="h-6 w-6 text-white hover:text-gray-300 transition-colors duration-200" />
              <Facebook className="h-6 w-6 text-white hover:text-gray-300 transition-colors duration-200" />
            </div>
          </div>
        </div>
        <div className="text-base flex flex-col md:flex-row justify-between items-center mt-4">
          <div className="flex flex-wrap gap-4">
            <p className="text-left text-gray-400 hover:text-white">Pháp lý</p>
            <p className="text-left text-gray-400 hover:text-white">Trưng tâm an toàn với quyền riêng tư</p>
            <p className="text-left text-gray-400 hover:text-white">Chính sách quyền riêng tư</p>
            <p className="text-left text-gray-400 hover:text-white">Cookie</p>
            <p className="text-left text-gray-400 hover:text-white">Giới thiệu Quảng cáo</p>
            <p className="text-left text-gray-400 hover:text-white">Hỗ trợ thiết bị</p>
          </div>
          <p className="text-right mt-2 md:mt-0">© 2025 Spotify AB</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;