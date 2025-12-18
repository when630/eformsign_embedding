"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2, ArrowLeft } from "lucide-react";

interface DocumentDetail {
  id: string;
  document_name: string;
  current_status: {
    step_name: string;
    [key: string]: any;
  } | string;
  histories: any[];
  fields: any[];
  [key: string]: any;
}

const ACTION_TYPE_MAP: Record<string, string> = {
  "001": "문서 임시 저장",
  "002": "문서 생성",
  "003": "문서 최종 완료",
  "010": "결재요청",
  "011": "결재 반려",
  "012": "결재 승인",
  "013": "결재 요청 취소",
  "020": "내부자 요청",
  "021": "내부자 반려",
  "022": "내부자 승인",
  "023": "내부자 임시 저장",
  "030": "외부자 요청",
  "031": "외부자 반려",
  "032": "외부자 승인",
  "033": "외부자 재 요청",
  "034": "외부자 열람",
  "035": "외부자 임시 저장",
  "040": "문서 취소 요청",
  "041": "문서 취소 요청 거절",
  "042": "문서 취소",
  "043": "문서 수정",
  "044": "문서 수정 취소",
  "045": "문서 반려 요청",
  "046": "문서 반려 요청 거절",
  "047": "문서 삭제 요청",
  "048": "문서 삭제 요청 거절",
  "049": "문서 삭제",
  "050": "완료 문서 PDF 전송",
  "051": "문서 이관",
  "060": "참여자 요청",
  "061": "참여자 반려",
  "062": "참여자 승인",
  "063": "참여자 재요청(외부자)",
  "064": "참여자 문서 열람(외부자)",
  "070": "검토자 요청",
  "071": "검토자 반려",
  "072": "검토자 승인",
  "073": "검토자 재요청(외부자)",
  "074": "검토자 문서 열람(외부자)",
};

function LeaveInfoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDocumentDetail(id);
    }
  }, [id]);

  const fetchDocumentDetail = async (docId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/eformsign/documents/${docId}`);
      if (response.data.success) {
        const resData = response.data.data;
        if (resData && resData.data) {
          setDocument(resData.data);
        } else {
          setDocument(resData.document || resData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch document details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">문서를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        목록으로 돌아가기
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl text-gray-800 mb-1">
              {document.document_name}
            </h1>
            <p className="text-sm text-gray-500 font-mono">{document.id}</p>
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
            {typeof document.current_status === "object"
              ? document.current_status.step_name
              : document.current_status}
          </div>
        </div>

        <div className="p-8">
          {/* Custom Layout Fields */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
              문서 내용
            </h2>
            <div className="bg-gray-50 rounded-xl p-6 space-y-6">

              {/* 1. Applicant Department Group */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">신청부서 결재선</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {["신청부서 팀장", "신청부서 부서장", "신청부서 임원", "신청부서 대표이사", "신청부서 회장"].map(id => (
                    <div key={id} className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">{id.replace("신청부서 ", "")}</span>
                      <span className="font-medium text-gray-900 text-sm">{document.fields.find((f: any) => f.id === id)?.value || "X"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Reception Department Group */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">접수부서 결재선</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {["접수부서 담당", "접수부서 이사"].map(id => (
                    <div key={id} className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">{id.replace("접수부서 ", "")}</span>
                      <span className="font-medium text-gray-900 text-sm">{document.fields.find((f: any) => f.id === id)?.value || "X"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Leave Period & Duration */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">휴가 기간</p>
                <div className="flex flex-wrap items-end gap-x-2 text-gray-900 font-medium text-lg">
                  <span>{document.fields.find((f: any) => f.id === "휴가 시작일")?.value || ""}</span>
                  <span>{document.fields.find((f: any) => f.id === "휴가 시작시각")?.value || ""}</span>
                  <span className="mx-2 text-gray-400">~</span>
                  <span>{document.fields.find((f: any) => f.id === "휴가 종료일")?.value || ""}</span>
                  <span>{document.fields.find((f: any) => f.id === "휴가 종료시각")?.value || document.fields.find((f: any) => f.id === "휴가 종료시간")?.value || ""}</span>
                  <span className="ml-4 px-2 py-0.5 bg-blue-100 text-blue-800 text-sm rounded mx-2">
                    {document.fields.find((f: any) => f.id === "일간")?.value || "0"}일간
                  </span>
                </div>
              </div>

              {/* 4. Leave Type */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">휴가 구분</p>
                <p className="text-gray-900 font-medium">
                  {document.fields.find((f: any) => f.id === "휴가 구분")?.value || "-"}
                </p>
              </div>

              {/* 5. Leave Reason */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">휴가 사유</p>
                <p className="text-gray-900 font-medium whitespace-pre-wrap">
                  {document.fields.find((f: any) => f.id === "휴가 사유")?.value || "-"}
                </p>
              </div>

              {/* 6. Application Date */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">신청일</p>
                <p className="text-gray-900 font-medium">
                  {document.fields.find((f: any) => f.id === "신청일")?.value || "-"}
                </p>
              </div>

            </div>
          </div>

          {/* History */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
              처리 이력
            </h2>
            <div className="relative pl-4">
              {/* Vertical line backing */}
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-100"></div>

              <ul className="space-y-6 relative">
                {document.histories &&
                  document.histories.map((hist: any, idx: number) => (
                    <li key={idx} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-blue-100 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-base">
                              {hist.step_name}
                            </span>
                            {hist.action_type && (
                              <span className="text-xs text-blue-600 font-medium mt-0.5 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                {ACTION_TYPE_MAP[hist.action_type] || hist.action_type}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-400 font-mono">
                            {new Date(hist.executed_date).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-md inline-flex">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                            {hist.executor?.name ? hist.executor.name[0] : "?"}
                          </div>
                          <span className="font-medium text-sm">
                            {hist.executor?.name}
                            <span className="text-gray-400 font-normal ml-1">
                              ({hist.executor?.id})
                            </span>
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaveInfoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
      <LeaveInfoContent />
    </Suspense>
  );
}
