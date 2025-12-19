"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { FileText, Clock, History as HistoryIcon, User, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

// Interfaces based on provided JSON
interface Recipient {
  recipient_type: string;
  id: string;
  name: string;
}

interface CurrentStatus {
  status_type: string;
  status_doc_type: string;
  status_doc_detail: string;
  step_type: string;
  step_index: string;
  step_name: string;
  step_recipients: Recipient[];
}

interface History {
  step_type: string;
  action_type: string;
  executor: Recipient;
  executed_date: number;
  comment: string;
}

interface Field {
  id: string;
  value: string;
  type: string;
}

interface Template {
  id: string;
  name: string;
}

interface Document {
  id: string;
  document_number: string;
  document_name: string;
  template: Template;
  creator: Recipient;
  created_date: number;
  last_editor: Recipient;
  updated_date: number;
  current_status: CurrentStatus;
  fields: Field[];
  histories: History[];
}

interface DocumentListProps {
  type: string; // "01", "02", "03", "04"
  title: string;
  icon?: React.ReactNode;
}

export default function DocumentList({ type, title, icon }: DocumentListProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Reset page when type changes
    setPage(1);
  }, [type]);

  useEffect(() => {
    fetchDocuments();
  }, [type, page]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      console.log(`Fetching documents with type: ${type}, page: ${page}, limit: ${limit}`);
      const response = await api.get("/eformsign/documents", {
        params: { type, page, limit }
      });
      console.log("Documents API Response:", response.data);
      const resData = response.data.data || response.data;
      const list = resData.documents || [];
      const total = resData.total_rows || resData.total_count || list.length;

      setDocuments(list);
      setTotalCount(total);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = (docId: string) => {
    // Todo (02) -> action (processing)
    // Others -> preview (view)
    const mode = type === "02" ? "action" : "preview";
    router.push(`/document?document_id=${docId}&mode=${mode}`);
  };

  const calculateElapsedDays = (createdDate: number) => {
    const diff = Date.now() - createdDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  };

  const getStatusText = (statusType: string) => {
    switch (statusType) {
      case "060": return "진행중";
      case "001": return "임시저장";
      case "099": return "완료";
      default: return "진행중";
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case "099": return "bg-green-100 text-green-800";
      case "001": return "bg-gray-100 text-gray-800";
      case "060": return "bg-blue-100 text-blue-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          {icon || <FileText className="w-8 h-8" />}
          {title}
        </h1>
        <p className="text-gray-500 mt-1">Manage and track your documents</p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200">
                    <th className="px-4 py-3 text-center w-24">상태</th>
                    <th className="px-4 py-3">제목</th>
                    <th className="px-4 py-3">단계</th>
                    <th className="px-4 py-3 text-center">경과일</th>
                    <th className="px-4 py-3">작성자</th>
                    <th className="px-4 py-3">처리자</th>
                    <th className="px-4 py-3 text-center">이력</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer text-sm"
                      onClick={() => handleOpenDocument(doc.id)}
                    >
                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getStatusColor(doc.current_status.status_type))}>
                          {doc.current_status.step_name}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{doc.document_name}</span>
                          <span className="text-xs text-gray-400">{doc.document_number}</span>
                        </div>
                      </td>

                      {/* Step */}
                      <td className="px-4 py-3 text-gray-700">
                        {doc.current_status.step_name}
                      </td>

                      {/* Elapsed Days */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{calculateElapsedDays(doc.created_date)}일</span>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-gray-400" />
                          {doc.creator.name}
                        </div>
                      </td>

                      {/* Handler - Join names */}
                      <td className="px-4 py-3 text-gray-700">
                        {doc.current_status.step_recipients?.map(r => r.name).join(", ") || "-"}
                      </td>

                      {/* History - Count */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs">
                          <HistoryIcon className="w-3 h-3" />
                          {doc.histories?.length || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-8 h-8 opacity-20" />
                          <p>No documents found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls - Visually Separated */}
          {totalCount > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={clsx(
                          "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                          page === i + 1
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || totalPages === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
