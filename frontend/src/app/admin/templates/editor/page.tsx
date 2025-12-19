"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import api from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

function TemplateEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template_id");
  const modeParam = searchParams.get("mode"); // 'edit' or 'duplicate'

  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const eformsignRef = useRef<any>(null);
  const jqueryLoadedRef = useRef(false);

  // Load Scripts Logic (Similar to Document Viewer)
  useEffect(() => {
    const checkJquery = setInterval(() => {
      const win = window as any;
      if (win.$) {
        console.log("jQuery detected via polling");
        clearInterval(checkJquery);
        setJqueryLoaded(true);
        jqueryLoadedRef.current = true;

        if (!win.jQuery) {
          win.jQuery = win.$;
        }

        if (!document.getElementById("efs_template_script")) {
          const script = document.createElement("script");
          script.id = "efs_template_script";
          script.src = "https://www.eformsign.com/lib/js/efs_embedded_form.js";
          script.onload = () => {
            console.log("Eformsign Template SDK Loaded via manual injection");
            setSdkLoaded(true);
          };
          script.onerror = (e) => {
            console.error("Eformsign Template SDK Load Failed", e);
            alert("Failed to load Eformsign Template SDK script.");
          };
          document.body.appendChild(script);
        } else {
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
    if (!templateId) {
      alert("Template ID required.");
      router.back();
      return;
    }

    const fetchToken = async () => {
      try {
        const response = await api.get("/eformsign/token");
        setTokenInfo(response.data.data);
      } catch (error) {
        console.error("Failed to fetch token", error);
        alert("인증 토큰을 가져오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [templateId]);

  useEffect(() => {
    initializeEformsign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenInfo, sdkLoaded, templateId, modeParam]);

  const initializeEformsign = () => {
    if (!tokenInfo || !sdkLoaded) return;
    if (eformsignRef.current) return;

    // Mapping mode: edit -> 02, duplicate -> 03
    let type = "02"; // default edit
    if (modeParam === 'duplicate') type = "03";

    // Configuration
    const options: any = {
      company: {
        id: tokenInfo.api_key?.company?.company_id,
        country_code: "kr",
        user_key: tokenInfo.api_key?.company?.user_key
      },
      user: {
        id: tokenInfo.oauth_token.id || "user",
        access_token: tokenInfo.oauth_token.access_token,
        accessToken: tokenInfo.oauth_token.access_token,
        refresh_token: tokenInfo.oauth_token.refresh_token || "",
        refreshToken: tokenInfo.oauth_token.refresh_token || ""
      },
      mode: {
        type: type, // 02: Edit, 03: Duplicate
        template_id: templateId,
        template_type: "form"
      },
      layout: {
        lang_code: "ko",
        header: true,
        footer: true
      }
    };

    console.log("Initializing EformSignTemplate with options:", JSON.stringify(options, null, 2));

    const successCallback = (response: any) => {
      console.log("Template Success Callback:", response);
      if (response.code === "-1") {
        alert(modeParam === 'duplicate' ? "템플릿이 복제되었습니다." : "템플릿이 수정되었습니다.");
        router.push("/admin/templates");
      } else {
        // Code might be -1 for success
      }
    };

    const errorCallback = (response: any) => {
      console.error("Template Error Callback:", response);
      if (response.code !== "1201") { // Ignore user cancel if applicable
        alert("오류 발생: " + response.message + " (" + response.code + ")");
      }
    };

    const actionCallback = (response: any) => {
      console.log("Template Action Callback:", response);
    };

    const iframeContainer = document.getElementById("eformsign_iframe");
    if (!iframeContainer) return;

    iframeContainer.innerHTML = ""; // Clear

    try {
      // Note: DIFFERENT Class for Template
      const eformsign = new (window as any).EformSignTemplate();
      eformsignRef.current = eformsign;

      setTimeout(() => {
        try {
          console.log("Calling eformsign.template()...");
          eformsign.template(options, "eformsign_iframe", successCallback, errorCallback, actionCallback);
          eformsign.open();
          // Note: Does template() have .open()? Snippet implies yes or it auto opens?
          // The user snippet ends with eformsign.template(..., args). It does NOT call .open() explicitly in the snippet?
          // Wait, the user snippet has:
          // eformsign.template(template_option, "eformsign_iframe", ...);
          // It does NOT show .open(). BUT EformSignDocument used .open().
          // I will assume .template() might auto-open or I should check if .open() exists.
          // Documentation usually suggests .open() is common pattern. Let's try calling it if it exists.
          if (eformsign.open) {
            eformsign.open();
            console.log("eformsign.open() called");
          }
        } catch (innerE) {
          console.error("Error during template open:", innerE);
        }
      }, 500);

    } catch (e) {
      console.error("Eformsign Init Error:", e);
      alert("Failed to initialize eformsign template: " + e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Script
        src="https://www.eformsign.com/plugins/jquery/jquery.min.js"
        onLoad={() => console.log("jQuery Script onLoad fired")}
      />

      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="hover:bg-gray-100 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg">
              {modeParam === 'duplicate' ? "템플릿 복제" : "템플릿 수정"}
            </h1>
            {!sdkLoaded && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded">SDK 로딩 중...</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50 flex flex-col h-[calc(100vh-80px)]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">설정 로딩 중...</div>
        ) : !tokenInfo ? (
          <div className="flex-1 flex items-center justify-center text-red-500">설정 로드 실패</div>
        ) : (
          <div className="flex-1 relative w-full h-full p-4">
            {/* Use iframe as previously discovered it's better */}
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

export default function TemplateEditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateEditorContent />
    </Suspense>
  );
}
