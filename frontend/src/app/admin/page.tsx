"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Users, Files, Settings, Activity, ArrowRight, FileText, Clock, CheckSquare, UserPlus, } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    templates: 0,
    members: 0,
    groups: 0,
    todo: 0,
    inprogress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [templatesRes, membersRes, groupsRes, todoRes, inprogressRes, completedRes] = await Promise.allSettled([
        api.get("/eformsign/templates"),
        api.get("/eformsign/company/members"),
        api.get("/eformsign/company/groups"),
        api.get("/eformsign/documents?type=02"), // Todo
        api.get("/eformsign/documents?type=01"), // In Progress
        api.get("/eformsign/documents?type=03")  // Completed
      ]);

      let templatesCount = 0;
      let membersCount = 0;
      let groupsCount = 0;
      let todoCount = 0;
      let inprogressCount = 0;
      let completedCount = 0;

      if (templatesRes.status === "fulfilled") {
        const data = templatesRes.value.data;
        const list = data.data?.forms || data.data?.templates || [];
        if (Array.isArray(list)) templatesCount = list.length;
      }

      if (membersRes.status === "fulfilled") {
        const data = membersRes.value.data;
        const list = data.data?.members || data.data || [];
        if (Array.isArray(list)) membersCount = list.length;
      }

      if (groupsRes.status === "fulfilled") {
        const data = groupsRes.value.data;
        const list = data.data?.groups || data.data || [];
        if (Array.isArray(list)) groupsCount = list.length;
      }

      if (todoRes.status === "fulfilled") {
        const list = todoRes.value.data.data?.documents || [];
        if (Array.isArray(list)) todoCount = list.length;
      }
      if (inprogressRes.status === "fulfilled") {
        const list = inprogressRes.value.data.data?.documents || [];
        if (Array.isArray(list)) inprogressCount = list.length;
      }
      if (completedRes.status === "fulfilled") {
        const list = completedRes.value.data.data?.documents || [];
        if (Array.isArray(list)) completedCount = list.length;
      }

      setStats({
        templates: templatesCount,
        members: membersCount,
        groups: groupsCount,
        todo: todoCount,
        inprogress: inprogressCount,
        completed: completedCount
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: "템플릿",
      count: stats.templates,
      icon: Files,
      color: "blue",
      href: "/admin/templates"
    },
    {
      title: "멤버",
      count: stats.members,
      icon: Users,
      color: "green",
      href: "/admin/members"
    },
    {
      title: "그룹",
      count: stats.groups,
      icon: UserPlus,
      color: "purple",
      href: "/admin/groups"
    }
  ];

  const docCards = [
    {
      title: "처리할 문서",
      count: stats.todo,
      icon: FileText,
      color: "red",
      href: "/documents/todo"
    },
    {
      title: "진행 중 문서",
      count: stats.inprogress,
      icon: Clock,
      color: "orange",
      href: "/documents/inprogress"
    },
    {
      title: "완료된 문서",
      count: stats.completed,
      icon: CheckSquare,
      color: "indigo",
      href: "/documents/completed"
    }
  ];

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">이폼사인 관리자 현황 대시보드입니다.</p>
      </header>

      {/* Admin Stats Grid */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">관리 현황</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {adminCards.map((card) => (
          <div key={card.title} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${card.color}-50 text-${card.color}-600`}>
                <card.icon className="w-6 h-6" />
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">{card.count}</span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <span className="text-gray-500 font-medium">{card.title}</span>
              <Link href={card.href} className={`text-sm font-semibold text-${card.color}-600 hover:text-${card.color}-700 flex items-center gap-1`}>
                관리하기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Document Stats Grid */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">문서 현황</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {docCards.map((card) => (
          <div key={card.title} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${card.color}-50 text-${card.color}-600`}>
                <card.icon className="w-6 h-6" />
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">{card.count}</span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <span className="text-gray-500 font-medium">{card.title}</span>
              <Link href={card.href} className={`text-sm font-semibold text-${card.color}-600 hover:text-${card.color}-700 flex items-center gap-1`}>
                바로가기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Menus */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                바로가기
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/templates" className="group p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3 group-hover:bg-blue-200 transition-colors">
                  <Files className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-700">템플릿 관리</h4>
                  <p className="text-sm text-gray-500">서식 생성 및 편집</p>
                </div>
              </Link>

              <Link href="/admin/members" className="group p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3 group-hover:bg-green-200 transition-colors">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-green-700">멤버 관리</h4>
                  <p className="text-sm text-gray-500">사용자 권한 설정</p>
                </div>
              </Link>

              <Link href="/admin/groups" className="group p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-3 group-hover:bg-purple-200 transition-colors">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-purple-700">그룹 관리</h4>
                  <p className="text-sm text-gray-500">부서/그룹 조직도</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-500" />
                최근 활동
              </h3>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
              <Activity className="w-12 h-12 opacity-20" />
              <p className="text-sm">최근 활동 내역이 없습니다.<br />(미구현)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
