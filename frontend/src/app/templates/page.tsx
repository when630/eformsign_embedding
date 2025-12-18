"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { FilePlus, Layout, ArrowRight } from "lucide-react";

interface Template {
  form_id: string;
  name: string;
  version: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get("/eformsign/templates");
      console.log("Templates API Response:", response.data);
      const list = response.data.data?.templates || response.data.data?.forms || [];
      setTemplates(list);
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (templateId: string) => {
    if (creating) return;
    setCreating(templateId);
    try {
      const response = await api.post("/eformsign/documents", { templateId });
      console.log("Create Document Response:", response.data);
      const newDocId = response.data.data?.document?.id;
      if (newDocId) {
        router.push(`/document?document_id=${newDocId}`);
      } else {
        alert("Failed to get document ID");
        setCreating(null);
      }
    } catch (error) {
      console.error("Failed to create document", error);
      alert("Failed to create document");
      setCreating(null);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Layout className="w-8 h-8" />
          템플릿 목록
        </h1>
        <p className="text-gray-500 mt-1">문서를 생성할 템플릿을 선택하세요</p>
      </header>

      {loading ? (
        <div>템플릿 목록 불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.form_id}
              className={`card hover:border-gray-300 cursor-pointer group transition-all ${creating === template.form_id ? 'opacity-70 pointer-events-none' : ''}`}
              onClick={() => handleCreateDocument(template.form_id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <FilePlus className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  v{template.version}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {template.name}
              </h3>
              <div className="flex items-center text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {creating === template.form_id ? "생성 중..." : <>문서 생성 <ArrowRight className="w-4 h-4 ml-1" /></>}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              표시할 템플릿이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
