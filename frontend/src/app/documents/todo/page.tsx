"use client";

import DocumentList from "@/components/DocumentList";
import { FileText } from "lucide-react";

export default function TodoDocumentsPage() {
  return (
    <DocumentList
      type="02"
      title="처리할 문서함"
      icon={<FileText className="w-8 h-8" />}
    />
  );
}
