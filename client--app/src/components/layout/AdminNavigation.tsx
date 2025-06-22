import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Menu, X, Home, Users, Music, Disc, List, Tag, Heart, BarChart, Image, ChevronDown } from 'react-feather';

interface AdminNavigationProps {
  onNavClick: (page: string) => void;
  activePage: string;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({ onNavClick, activePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['dashboard']);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const navItems = [
    {
      section: 'dashboard',
      label: 'Bảng điều khiển',
      icon: <Home className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" />,
      items: [
        { page: 'dashboard', label: 'Tổng quan', icon: <Home className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
      ],
    },
    {
      section: 'users',
      label: 'Quản lý người dùng',
      icon: <Users className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" />,
      items: [
        { page: 'users', label: 'Người dùng', icon: <Users className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
        { page: 'interactions', label: 'Tương tác', icon: <Heart className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
      ],
    },
    {
      section: 'music',
      label: 'Quản lý nội dung âm nhạc',
      icon: <Music className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" />,
      items: [
        { page: 'artists', label: 'Ca sĩ', icon: <Image className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
        { page: 'songs', label: 'Bài hát', icon: <Music className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
        { page: 'albums', label: 'Album', icon: <Disc className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
        { page: 'playlists', label: 'Danh sách phát', icon: <List className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
        { page: 'genres', label: 'Thể loại', icon: <Tag className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
        { page: 'reports', label: 'Báo cáo & Thống kê', icon: <BarChart className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
        { page: 'media', label: 'Nội dung đa phương tiện', icon: <Image className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" /> },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        className="md:hidden fixed top-4 left-4 z-50 text-white bg-gray-900 hover:bg-gray-900 rounded-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors duration-200" /> : <Menu className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors duration-200" />}
      </Button>

      {/* Sidebar */}
      <nav
        className={`bg-gray-900 text-white w-64 p-4 h-screen fixed top-0 left-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 z-40 overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <Button
            variant="ghost"
            className="md:hidden text-white bg-gray-900 hover:bg-gray-900 rounded-none"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors duration-200" />
          </Button>
        </div>
        <ul className="space-y-2">
          {navItems.map((section) => (
            <li key={section.section}>
              <Collapsible
                open={openSections.includes(section.section)}
                onOpenChange={() => toggleSection(section.section)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left text-white bg-gray-900 hover:bg-gray-900 group border-l border-transparent hover:border-l-4 hover:border-gray-500 rounded-none"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        {section.icon}
                        <span className="text-white">{section.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-200 ${
                          openSections.includes(section.section) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-1">
                  {section.items.map((item) => (
                    <Button
                      key={item.page}
                      variant={activePage === item.page ? 'secondary' : 'ghost'}
                      className={`w-full justify-start text-left text-white bg-gray-900 hover:bg-gray-900 border-l border-transparent hover:border-l-4 hover:border-gray-500 ${
                        activePage === item.page ? 'border-l-4 border-white' : ''
                      } group rounded-none`}
                      onClick={() => {
                        onNavClick(item.page);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        {item.icon}
                        <span className="text-white">{item.label}</span>
                      </div>
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </li>
          ))}
        </ul>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};