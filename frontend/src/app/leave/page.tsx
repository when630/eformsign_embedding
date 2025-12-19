"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { FileText, Loader2, Plane, User, Calendar, Clock, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import clsx from "clsx";

interface Document {
  id: string;
  document_name: string;
  template: {
    id: string;
    name: string;
  };
  created_date: number; // timestamp
  current_status: {
    step_name: string;
    [key: string]: any;
  };
  creator: {
    name: string;
    id: string;
  };
  fields: {
    id: string;
    value: any;
  }[];
}

export default function LeavePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Eformsign SDK State
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const eformsignRef = useRef<any>(null);
  const jqueryLoadedRef = useRef(false);

  useEffect(() => {
    fetchDocuments();

    // Load Eformsign SDK Logic (Copied from DocumentPage pattern)
    const checkJquery = setInterval(() => {
      const win = window as any;
      if (win.$) {
        clearInterval(checkJquery);
        setJqueryLoaded(true);
        jqueryLoadedRef.current = true;

        if (!win.jQuery) win.jQuery = win.$;

        if (!document.getElementById("efs_sdk_script")) {
          const script = document.createElement("script");
          script.id = "efs_sdk_script";
          script.src = "https://www.eformsign.com/lib/js/efs_embedded_v2.js";
          script.onload = () => setSdkLoaded(true);
          script.onerror = (e) => console.error("Eformsign SDK Load Failed", e);
          document.body.appendChild(script);
        } else {
          setSdkLoaded(true);
        }
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(checkJquery);
    }, 10000);

    return () => {
      clearInterval(checkJquery);
      clearTimeout(timeout);
    };
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const templateId = process.env.NEXT_PUBLIC_EFORMSIGN_LEAVE_TEMPLATE_ID || "";
      const response = await api.get(`/eformsign/documents?templateId=${templateId}&type=04`);

      let initialDocs: Document[] = [];
      if (response.data.success) {
        const resData = response.data.data;
        if (resData && resData.data && Array.isArray(resData.data.documents)) {
          initialDocs = resData.data.documents;
        } else {
          initialDocs = resData.documents || resData || [];
        }
      }

      if (initialDocs.length > 0) {
        const detailPromises = initialDocs.map((doc) =>
          api
            .get(`/eformsign/documents/${doc.id}`)
            .then((res) => {
              if (res.data.success) {
                const rData = res.data.data;
                return rData && rData.data ? rData.data : rData.document || rData;
              }
              return doc;
            })
            .catch((err) => {
              console.error(`Failed to fetch detail for ${doc.id}`, err);
              return doc;
            })
        );
        const detailedDocs = await Promise.all(detailPromises);
        setDocuments(detailedDocs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (docId: string) => {
    router.push(`/leave/info?id=${docId}`);
  };

  const handleOpenWriteModal = async () => {
    setShowWriteModal(true);
    try {
      const response = await api.get("/eformsign/token");
      if (response.data.success) {
        setTokenInfo(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch token", error);
      alert("토큰 발급에 실패했습니다.");
      setShowWriteModal(false);
    }
  };

  const handleCloseWriteModal = () => {
    setShowWriteModal(false);
    eformsignRef.current = null; // Reset instance
  };

  // Initialize Eformsign when modal is open and deps are ready
  useEffect(() => {
    if (showWriteModal && tokenInfo && sdkLoaded) {
      initializeEformsign();
    }
  }, [showWriteModal, tokenInfo, sdkLoaded]);

  const initializeEformsign = () => {
    if (eformsignRef.current) return;
    const win = window as any;
    if (!win.EformSignDocument) return;

    const options = {
      company: {
        id: tokenInfo.api_key?.company?.company_id,
        country_code: "kr",
        user_key: tokenInfo.api_key?.company?.user_key
      },
      user: {
        type: "01",
        id: tokenInfo.oauth_token.id || "user",
        access_token: tokenInfo.oauth_token.access_token,
        refresh_token: tokenInfo.oauth_token.refresh_token || ""
      },
      mode: {
        type: "01", // New Document
        template_id: process.env.NEXT_PUBLIC_EFORMSIGN_LEAVE_TEMPLATE_ID || "" // Leave Application Template ID
      },
      layout: {
        lang_code: "ko"
      },
      prefill: {
        document_name: "휴가신청서",
        fields: []
      }
    };

    const successCallback = (response: any) => {
      console.log("Eformsign Success:", response);
      if (response.code === "-1") {
        alert("휴가 신청서가 성공적으로 작성되었습니다.");
        handleCloseWriteModal();
        fetchDocuments(); // Refresh list
      }
    };

    const errorCallback = (response: any) => {
      console.error("Eformsign Error:", response);
    };

    const iframeContainer = document.getElementById("eformsign_write_iframe");
    if (iframeContainer) {
      iframeContainer.innerHTML = "";
      try {
        const eformsign = new win.EformSignDocument();
        eformsignRef.current = eformsign;
        eformsign.document(options, "eformsign_write_iframe", successCallback, errorCallback);
        eformsign.open();
      } catch (e) {
        console.error("Init Error", e);
      }
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto relative">
      <Script
        src="https://www.eformsign.com/plugins/jquery/jquery.min.js"
        strategy="lazyOnload"
      />

      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Plane className="w-8 h-8" />
            휴가 관리
          </h1>
          <p className="text-gray-500 mt-1">휴가 신청 내역을 조회하고 관리합니다.</p>
        </div>
        <button
          onClick={handleOpenWriteModal}
          disabled={!sdkLoaded}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          휴가 작성
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          {documents.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <FileText className="w-12 h-12 opacity-20" />
                <p>조회된 휴가신청서가 없습니다.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200">
                    <th className="px-4 py-3">신청자명</th>
                    <th className="px-4 py-3">신청일자</th>
                    <th className="px-4 py-3">휴가구분</th>
                    <th className="px-4 py-3">휴가기간</th>
                    <th className="px-4 py-3">일수</th>
                    <th className="px-4 py-3 text-center w-24">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => handleRowClick(doc.id)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer text-sm"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{doc.fields?.find(f => f.id === '신청자명')?.value || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{doc.fields?.find(f => f.id === '신청일')?.value || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{doc.fields?.find(f => f.id === '휴가 구분')?.value || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{doc.fields?.find(f => f.id === '휴가 시작일')?.value || '-'} {doc.fields?.find(f => f.id === '휴가 시작시각')?.value || '-'} ~ {doc.fields?.find(f => f.id === '휴가 종료일')?.value || '-'} {doc.fields?.find(f => f.id === '휴가 종료시각')?.value || doc.fields?.find(f => f.id === '휴가 종료시간')?.value || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{doc.fields?.find(f => f.id === '일간')?.value || '-'}일</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          typeof doc.current_status === 'object' && doc.current_status.step_name.includes("완료") ? "bg-green-100 text-green-800" :
                            typeof doc.current_status === 'object' && doc.current_status.step_name.includes("반려") ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                        )}>
                          {typeof doc.current_status === 'object' ? doc.current_status.step_name : doc.current_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Write Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">휴가 신청서 작성</h3>
              <button
                onClick={handleCloseWriteModal}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 bg-gray-100 relative">
              {!tokenInfo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              )}
              <iframe
                id="eformsign_write_iframe"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
