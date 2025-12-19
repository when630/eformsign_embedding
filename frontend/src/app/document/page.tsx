"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import api from "@/lib/api";
import { FileText, ArrowLeft } from "lucide-react";

// Declare globals for Eformsign
declare global {
  interface Window {
    EformSignDocument: any;
  }
}

function DocumentViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template_id");
  const documentId = searchParams.get("document_id");
  const viewMode = searchParams.get("mode"); // "action" or "preview"

  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const eformsignRef = useRef<any>(null);

  const jqueryLoadedRef = useRef(false); // Ref for timeout check

  useEffect(() => {
    // 1. Check for jQuery
    const checkJquery = setInterval(() => {
      const win = window as any;
      if (win.$) {
        console.log("jQuery detected via polling");
        clearInterval(checkJquery);
        setJqueryLoaded(true);
        jqueryLoadedRef.current = true;

        // Ensure alias exists
        if (!win.jQuery) {
          win.jQuery = win.$;
        }

        // 2. Load SDK dynamically ONLY after jQuery is confirmed
        if (!document.getElementById("efs_sdk_script")) {
          const script = document.createElement("script");
          script.id = "efs_sdk_script";
          script.src = "https://www.eformsign.com/lib/js/efs_embedded_v2.js";
          script.onload = () => {
            console.log("Eformsign SDK Loaded via manual injection");
            setSdkLoaded(true);
          };
          script.onerror = (e) => {
            console.error("Eformsign SDK Load Failed", e);
            alert("Failed to load Eformsign SDK script.");
          };
          document.body.appendChild(script);
        } else {
          // Already appended but maybe not loaded?
          // If we are re-mounting, it might be there.
          setSdkLoaded(true);
        }
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(checkJquery);
      if (!jqueryLoadedRef.current) console.error("jQuery load timed out");
    }, 10000);

    return () => {
      clearInterval(checkJquery);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!templateId && !documentId) {
      alert("Invalid access. Template ID or Document ID required.");
      router.push("/templates");
      return;
    }

    // 1. Fetch Token
    const fetchToken = async () => {
      try {
        const response = await api.get("/eformsign/token");
        setTokenInfo(response.data.data);
      } catch (error) {
        console.error("Failed to fetch token", error);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [templateId, documentId]);

  const initializeEformsign = () => {
    if (!tokenInfo || !sdkLoaded) {
      console.log("Waiting for token or SDK...", { token: !!tokenInfo, sdk: sdkLoaded });
      return;
    }
    if (eformsignRef.current) return; // Already initialized

    // Configuration from Application.yml (via API response or env)
    const options: any = {
      company: {
        id: tokenInfo.api_key?.company?.company_id,
        country_code: "kr",
        user_key: tokenInfo.api_key?.company?.user_key
      },
      user: {
        type: "01", // Member
        id: tokenInfo.oauth_token.id || "user",
        access_token: tokenInfo.oauth_token.access_token,
        accessToken: tokenInfo.oauth_token.access_token, // Alias in case SDK expects camelCase
        refresh_token: tokenInfo.oauth_token.refresh_token || "",
        refreshToken: tokenInfo.oauth_token.refresh_token || "" // Alias
      },
      layout: {
        lang_code: "ko",
        header: true,
        footer: false
      }
    };

    if (documentId) {
      options.mode = {
        type: viewMode === "preview" ? "03" : "02", // 02: Processing, 03: Preview
        document_id: documentId
      };
    } else {
      options.mode = {
        type: "01", // New Document
        template_id: templateId
      };
    }

    console.log("Initializing Eformsign with options:", JSON.stringify(options, null, 2));

    const successCallback = (response: any) => {
      console.log("Eformsign Success Callback:", response);
      if (response.code === "-1") {
        // Successful document creation/processing from the user's perspective
        console.log("Document ID:", response.document_id);
      }
      // You might want to refresh or redirect here based on action
    };

    const errorCallback = (response: any) => {
      console.error("Eformsign Error Callback:", response);
      // alert("Eformsign Error: " + response.message);
    };

    const actionCallback = (response: any) => {
      console.log("Eformsign Action Callback:", response);
    };

    // Verify element exists
    const iframeContainer = document.getElementById("eformsign_iframe");
    if (!iframeContainer) {
      console.error("Iframe container not found!");
      return;
    }

    // Clear container to prevent duplicate iframes or stale content
    iframeContainer.innerHTML = "";
    console.log("Iframe container found and cleared:", iframeContainer);

    try {
      console.log("Creating new EformSignDocument instance...");
      const eformsign = new window.EformSignDocument();
      eformsignRef.current = eformsign; // Set ref immediately

      // Add a small delay to ensure strict ordering/DOM readiness if needed
      setTimeout(() => {
        try {
          console.log("Calling eformsign.document()...");
          eformsign.document(options, "eformsign_iframe", successCallback, errorCallback, actionCallback);
          console.log("Calling eformsign.open()...");
          eformsign.open();
          console.log("Eformsign open() completed");
        } catch (innerE) {
          console.error("Error during open():", innerE);
          alert("Error opening Eformsign: " + innerE);
        }
      }, 500); // Increased delay

    } catch (e) {
      console.error("Eformsign Init Error:", e);
      alert("Failed to initialize eformsign: " + e);
    }
  };

  useEffect(() => {
    initializeEformsign();
  }, [tokenInfo, sdkLoaded, templateId, documentId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Script
        src="https://www.eformsign.com/plugins/jquery/jquery.min.js"
        // No strategy specified defaults to afterInteractive, but we want it ASAP.
        // However, we are polling for it, so it's fine.
        onLoad={() => {
          console.log("jQuery Script onLoad fired");
        }}
        onError={(e) => console.error("jQuery Load Failed", e)}
      />

      {/* Removed Eformsign SDK Script Component - Loaded manually in useEffect */}

      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="hover:bg-gray-100 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg">
              {documentId ? "문서 뷰어" : "새 문서 작성"}
            </h1>
            {!sdkLoaded && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded">SDK 로딩 중...</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50 flex flex-col h-[calc(100vh-80px)]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading Configuration...</div>
        ) : !tokenInfo ? (
          <div className="flex-1 flex items-center justify-center text-red-500">Failed to load configuration.</div>
        ) : (
          <div className="flex-1 relative w-full h-full p-4">
            {/* If sdkLoaded is true but tokenInfo is missing keys, user might see blank. */}
            {!tokenInfo.api_key?.company?.user_key && <div className="text-red-500 mb-2">Warning: User Key missing from config</div>}
            <iframe
              id="eformsign_iframe"
              className="w-full h-full bg-white shadow-sm border border-gray-200"
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function DocumentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DocumentViewerContent />
    </Suspense>
  );
}
