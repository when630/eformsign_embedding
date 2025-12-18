"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText, Files, Home, LogOut, User, Users,
  Settings, CheckSquare, Clock, Grid2X2, UserPlus,
  ClipboardList, Folder, ChevronDown, ChevronRight,
  Plane,
} from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";

interface MenuItem {
  name: string;
  href?: string;
  icon: any;
  children?: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);

  // State for expanded menus. Default 'electronic-doc' to true.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "electronic-doc": true
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await api.get("/members/me");
        if (response.data.success) {
          setUserInfo(response.data.data);
        }
      } catch (e) {
        console.error("Failed to fetch user info", e);
      }
    };

    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUserInfo();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Don't show sidebar on login page
  if (pathname === "/login") return null;

  // 1. Common functionality menus (Eformsign)
  const commonDocsDeps = [
    { name: "대시보드", href: "/", icon: Grid2X2 },
    { name: "전체 문서함", href: "/documents", icon: Files },
    { name: "처리할 문서함", href: "/documents/todo", icon: FileText },
    { name: "진행 중 문서함", href: "/documents/inprogress", icon: Clock },
    { name: "완료 문서함", href: "/documents/completed", icon: CheckSquare },
  ];

  // 2. Admin specific functionality
  const adminDeps = [
    ...commonDocsDeps,
    { name: "템플릿 관리", href: "/admin/templates", icon: Files },
    { name: "멤버 관리", href: "/admin/members", icon: Users },
    { name: "그룹 관리", href: "/admin/groups", icon: UserPlus },
  ];

  // Determine children based on role
  const eformsignChildren = userInfo?.role === "MANAGER" ? adminDeps : commonDocsDeps;

  // 3. Define Top-Level Menu Structure
  const menuStructure: MenuItem[] = [
    { name: "홈", href: "/home", icon: Home },
    { name: "게시판", href: "/board", icon: ClipboardList },
    {
      name: "전자문서",
      icon: Folder,
      children: eformsignChildren
    },
    { name: "휴가 관리", href: "/leave", icon: Plane },
    { name: "설정", href: "/settings", icon: Settings },
  ];

  const renderMenuItem = (item: MenuItem, index: number, depth = 0) => {
    // If it has children, render as a group
    if (item.children) {
      const isExpanded = expanded["electronic-doc"]; // Simplified for now, can use item.name/id
      const isActiveChild = item.children.some(child => child.href === pathname);

      return (
        <div key={index} className="mb-2">
          <button
            onClick={() => toggleExpand("electronic-doc")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActiveChild ? "text-blue-800 bg-blue-50/50" : "text-gray-700 hover:bg-gray-50"
              }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-500" />
              <span>{item.name}</span>
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children.map((child, cIndex) => renderMenuItem(child, cIndex, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Leaf node
    const isActive = pathname === item.href;
    const paddingLeft = depth === 0 ? "px-4" : "pl-12 pr-4"; // Indent for depth 2

    return (
      <Link
        key={index}
        href={item.href || "#"}
        className={`flex items-center gap-3 ${paddingLeft} py-3 rounded-lg text-sm font-medium transition-colors ${isActive
          ? "bg-blue-50 text-blue-600"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
        {item.name}
      </Link>
    );
  };


  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-black-600">Embeding Sample</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuStructure.map((item, index) => renderMenuItem(item, index))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        {userInfo && (
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userInfo.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {userInfo.role === "MANAGER" ? "관리자" : "멤버"}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
