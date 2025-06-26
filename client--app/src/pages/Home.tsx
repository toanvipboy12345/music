import React from 'react';
import { CollectionList } from './CollectionList'; // Điều chỉnh đường dẫn nếu cần

export const Home: React.FC = () => {
  return (
    <>
      <CollectionList /> {/* Nhúng danh sách tuyển tập */}
    </>
  );
};