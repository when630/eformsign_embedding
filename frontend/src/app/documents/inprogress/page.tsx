"use client";

import DocumentList from "@/components/DocumentList";
import { Clock } from "lucide-react";

export default function InProgressDocumentsPage() {
  return (
    <DocumentList
      type="01"
      title="진행 중 문서함"
      icon={<Clock className="w-8 h-8" />}
    />
  );
}
