"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { FileText, Clock, CheckSquare, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    todo: 0,
    inprogress: 0,
    completed: 0
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    checkUserAndFetchStats();
  }, []);

  const checkUserAndFetchStats = async () => {
    try {
      // 1. Get User Info
      const userRes = await api.get("/members/me");
      const user = userRes.data.data;

      setUserName(user.name);

      if (user.role === "MANAGER") {
        router.push("/admin");
        return;
      }

      // 2. Fetch Document Stats for Member
      // We will fetch lists and count them. 
      // Optimized approach would be a dedicated stats API, but lists work for POC.
      const [todoRes, inprogressRes, completedRes] = await Promise.allSettled([
        api.get("/eformsign/documents?type=02"), // Todo (Processing)
        api.get("/eformsign/documents?type=01"), // In Progress
        api.get("/eformsign/documents?type=03")  // Completed
      ]);

      let todoCount = 0;
      let inprogressCount = 0;
      let completedCount = 0;

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
        todo: todoCount,
        inprogress: inprogressCount,
        completed: completedCount
      });
      setLoading(false);

    } catch (error) {
      console.error("Failed to initialize dashboard", error);
      // If auth fails, redirect to login
      router.push("/login");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const statCards = [
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
      color: "blue",
      href: "/documents/inprogress"
    },
    {
      title: "완료된 문서",
      count: stats.completed,
      icon: CheckSquare,
      color: "green",
      href: "/documents/completed"
    }
  ];

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">반갑습니다, {userName}님!</h1>
        <p className="text-gray-500 mt-1">오늘의 문서 업무 현황입니다.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${card.color}-50 text-${card.color}-600`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{card.count}</span>
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

      {/* Recent Activity / Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-64 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <Activity className="w-12 h-12 opacity-20 mb-4" />
            <p className="font-medium">최근 활동 내역이 없습니다.</p>
            <p className="text-sm">문서를 작성하거나 서명하면 이곳에 표시됩니다.</p>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 text-white h-64 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">새 문서 작성</h3>
              <p className="text-blue-100 text-sm">템플릿을 사용하여 새로운 문서를 작성해보세요.</p>
            </div>
            <Link href="/documents" className="bg-white text-blue-600 py-3 px-4 rounded-lg font-bold text-center hover:bg-blue-50 transition-colors shadow-sm">
              문서 작성하기
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
