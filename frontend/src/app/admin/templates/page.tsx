"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Files, Copy, Trash2, Edit } from "lucide-react";

interface Template {
  form_id: string; // template id
  name: string;
  owner_name: string;
  version: number;
  update_date: number;
}

export default function TemplateManagementPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get("/eformsign/templates");
      console.log("Templates API Response:", response.data);
      const list = response.data.data?.forms || response.data.data?.templates || [];
      // Ensure it is an array
      if (Array.isArray(list)) {
        setTemplates(list);
      } else {
        console.error("Templates data is not an array:", list);
        setTemplates([]);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("정말 이 템플릿을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/eformsign/templates/${templateId}`);
      alert("템플릿이 삭제되었습니다.");
      fetchTemplates();
    } catch (error) {
      console.error("Delete failed", error);
      alert("삭제 실패");
    }
  };

  const handleDuplicate = (templateId: string) => {
    if (!confirm("이 템플릿을 복제하시겠습니까?")) return;
    router.push(`/admin/templates/editor?template_id=${templateId}&mode=duplicate`);
  };

  const handleEdit = (templateId: string) => {
    router.push(`/admin/templates/editor?template_id=${templateId}&mode=edit`);
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Files className="w-8 h-8" />
          템플릿 관리
        </h1>
        <p className="text-gray-500 mt-1">이폼사인 템플릿을 관리합니다.</p>
      </header>

      {loading ? (
        <div>Loading templates...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">템플릿명</th>
                  <th className="px-4 py-3 font-medium text-center">버전</th>
                  <th className="px-4 py-3 font-medium text-center">소유자</th>
                  <th className="px-4 py-3 font-medium text-center">수정일</th>
                  <th className="px-4 py-3 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {templates.map((tpl) => (
                  <tr key={tpl.form_id} className="hover:bg-blue-50/50 transition-colors text-sm">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <Files className="w-5 h-5 text-gray-300" />
                        {tpl.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">v{tpl.version}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{tpl.owner_name}</td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {new Date(tpl.update_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(tpl.form_id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="수정">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDuplicate(tpl.form_id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="복제">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(tpl.form_id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="삭제">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Files className="w-8 h-8 opacity-20" />
                        <p>No templates found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
