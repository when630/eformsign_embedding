"use client";

import DocumentList from "@/components/DocumentList";
import { CheckSquare } from "lucide-react";

export default function CompletedDocumentsPage() {
  return (
    <DocumentList
      type="03"
      title="완료 문서함"
      icon={<CheckSquare className="w-8 h-8" />}
    />
  );
}
