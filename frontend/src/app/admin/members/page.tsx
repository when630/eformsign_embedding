"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, User, Plus, Edit, Trash2, X, Settings } from "lucide-react";

interface Member {
  id?: number; // Local ID
  loginId: string;
  name: string;
  role?: string;
}

export default function MemberManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ loginId: "", password: "", name: "" });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get("/members"); // Local members
      setMembers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/members", formData);
      alert("멤버가 추가되었습니다.");
      setIsModalOpen(false);
      setFormData({ loginId: "", password: "", name: "" });
      fetchMembers();
    } catch (error) {
      console.error("Failed to create member", error);
      alert("멤버 추가 실패");
    }
  };

  // Sync to Eformsign (Optional button to specific member?)
  // Requirement says "API로 멤버 추가(이걸로 아이디 만들어줌)".
  // My implementation of POST /members creates LOCAL member.
  // I should probably also call Eformsign create member if needed, or the Service does it?
  // Service `createMember` in `MemberService` (local) only saves to DB. 
  // Service `createMember` in `EformsignService` calls API.
  // The requirement implies managing Eformsign members via API.
  // *Correction*: The user requirement: "멤버 관리 ... API로 멤버 추가(이걸로 아이디 만들어줌)".
  // This likely means I should use `EformsignService.createMember` (via `EformsignController`).
  // The current `MemberManagementPage` is calling ` / members` which is `MemberController` (Local).
  // I should probably call `/ eformsign / company / members` (the one I added to `EformsignController`).
  // But wait, `MemberController` is for local auth.
  // If I use Eformsign members, does Eformsign handle auth?
  // The current structure seems to use Local Auth (JWT) and then maps to Eformsign member.
  // If I create a member in Eformsign, checks "this creates an ID".
  // Maybe I should list Eformsign Members?
  // I'll stick to what I implemented in EformsignController `/ eformsign / company / members`.

  // Let's change this to use `/ eformsign / company / members` to match the requirement "API로 멤버 추가".
  // I'll assume the list returned matches `Member` interface roughly (or whatever Eformsign returns).

  // Actually, I'll implement both or just Eformsign one?
  // "회사 관리자 계정 -> 멤버 관리 -> 멤버 목록".
  // This likely refers to Eformsign Members.
  // I'll use `/ eformsign / company / members`.

  const fetchEformsignMembers = async () => {
    try {
      const response = await api.get("/eformsign/company/members");
      // Adjust according to actual response structure
      const list = response.data.data?.members || response.data.data || [];
      setMembers(list);
    } catch (e) {
      console.error("Fetch eformsign members failed", e);
    }
  };

  // ... Retrying with Eformsign API focus ...
  // But wait, the `fetchMembers` above uses ` / members` (local).
  // The user probably wants Eformsign members.
  // I'll switch to use `/ eformsign / company / members` endpoints.

  /* Start Over for fetch/create using Eformsign API endpoints */

  return <EformsignMemberManager />;
}

function EformsignMemberManager() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Eformsign Member Fields: id (email?), name, ...
  // const [formData, setFormData] = useState({ id: "", name: "", password: "" }); // Moved closer to usage

  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get("/eformsign/company/members");
      const list = response.data.data?.members || response.data.data || [];
      setMembers(list);
    } catch (error) {
      console.error("Failed", error);
    } finally {
      setLoading(false);
    }
  };

  /* Create Form State */
  const [formData, setFormData] = useState({ id: "", password: "", name: "", contactRaw: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        account: {
          id: formData.id,
          password: formData.password,
          name: formData.name,
          contact: {
            number: formData.contactRaw, // Mapping contactRaw to number (User sample: 010-...)
            tel: "",
            country_number: "+82"
          },
          role: []
        }
      };

      await api.post("/eformsign/company/members", payload);
      alert("멤버가 추가되었습니다.");
      setIsModalOpen(false);
      setFormData({ id: "", password: "", name: "", contactRaw: "" });
      fetchMembers();
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.response?.data?.message || e.message || "추가 실패";
      alert(`추가 실패: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await api.delete(`/eformsign/company/members/${id}`);
      alert("삭제되었습니다.");
      fetchMembers();
    } catch (e) {
      alert("삭제 실패");
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  /* Edit State */
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({
    id: "",
    name: "",
    department: "",
    position: "",
    enabled: true,
    contact: { tel: "", email: "" },
    role: []
  });

  const handleEditClick = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditFormData({
      id: member.id || member.member_id,
      name: member.name,
      department: member.department || "",
      position: member.position || "",
      enabled: member.enabled !== false,
      contact: {
        tel: member.contact?.tel || "",
        email: member.contact?.email || ""
      },
      role: member.role || []
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Structure based on user request: { account: { ... } }
      const payload = {
        account: {
          id: editFormData.id,
          name: editFormData.name,
          enabled: editFormData.enabled,
          contact: {
            tel: editFormData.contact.tel,
            // User sample didn't explicitly show email in contact but it's likely part of it or separate?
            // User sample: contact: { number: ..., tel: ... }
            // Existing data has email. Good to keep it.
            // But user sample delete didn't have contact. Update sample did.
            // I'll stick to what seemed to be there + user sample.
            // User Sample: contact: { number, tel }
            // I'll use tel as primary.
            number: editFormData.contact.tel // Map tel to number too just in case? Or just send tel.
          },
          department: editFormData.department,
          position: editFormData.position,
          role: editFormData.role
        }
      };

      await api.patch(`/eformsign/company/members/${editFormData.id}`, payload);
      alert("멤버 정보가 수정되었습니다.");
      setIsEditModalOpen(false);
      fetchMembers();
    } catch (e) {
      console.error(e);
      alert("수정 실패");
    }
  };

  const toggleRole = (role: string) => {
    setEditFormData((prev: any) => {
      const roles = prev.role.includes(role)
        ? prev.role.filter((r: string) => r !== role)
        : [...prev.role, role];
      return { ...prev, role: roles };
    });
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8" />
            멤버 관리 (eformsign)
          </h1>
          <p className="text-gray-500 mt-1">eformsign 멤버를 관리합니다.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          멤버 추가
        </button>
      </header>

      {loading ? <div>Loading...</div> : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">ID/Email</th>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">부서/직급</th>
                  <th className="px-4 py-3 font-medium">권한</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((m: any) => (
                  <tr
                    key={m.id || m.member_id}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors text-sm"
                    onClick={() => setSelectedMember(m)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{m.id || m.member_id}</td>
                    <td className="px-4 py-3 text-gray-700">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {m.department} {m.position && `/ ${m.position}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.role && m.role.slice(0, 2).map((r: string) => (
                          <span key={r} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs border border-gray-200">
                            {r}
                          </span>
                        ))}
                        {m.role && m.role.length > 2 && <span className="text-xs text-gray-400">+{m.role.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {m.enabled ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => handleEditClick(m, e)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(m.id || m.member_id, e)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 opacity-20" />
                        <p>멤버가 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">새 멤버 추가</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID (Email)</label>
                  <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                  <input required type="password" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="최소 8자, 특수문자 포함" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="홍길동" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락처 (Mobile)</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={formData.contactRaw} onChange={e => setFormData({ ...formData, contactRaw: e.target.value })} placeholder="010-1234-5678" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors font-medium shadow-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow transition-all font-bold"
                >
                  추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">멤버 정보 수정</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">ID (Email) - 수정 불가</label>
                  <input disabled type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" value={editFormData.id} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <div className="h-[42px] flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editFormData.enabled} onChange={e => setEditFormData({ ...editFormData, enabled: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                      <span className="text-sm text-gray-900">활성화 (Enabled)</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={editFormData.department} onChange={e => setEditFormData({ ...editFormData, department: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={editFormData.position} onChange={e => setEditFormData({ ...editFormData, position: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={editFormData.contact.tel} onChange={e => setEditFormData({ ...editFormData, contact: { ...editFormData.contact, tel: e.target.value } })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">역할 (Roles)</label>
                  <div className="flex gap-2 flex-wrap">
                    {["company_manager", "template_manager", "member"].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${editFormData.role.includes(role)
                          ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors font-medium shadow-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow transition-all font-bold"
                >
                  수정 사항 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMember.name}</h2>
                  <p className="text-sm text-gray-500">{selectedMember.id || selectedMember.member_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">계정 ID</label>
                  <p className="font-medium text-gray-900">{selectedMember.id || selectedMember.member_id}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">이름</label>
                  <p className="font-medium text-gray-900">{selectedMember.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">부서</label>
                  <p className="font-medium text-gray-900">{selectedMember.department || "-"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">직급</label>
                  <p className="font-medium text-gray-900">{selectedMember.position || "-"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">연락처</label>
                  <p className="font-medium text-gray-900">
                    {selectedMember.contact?.tel ? selectedMember.contact.tel : "-"}
                    {selectedMember.contact?.email && ` (${selectedMember.contact.email})`}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">생성일</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedMember.create_date)}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> 권한 및 상태
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">상태 (Enabled)</label>
                    <span className={`px-2.5 py-1 rounded-md text-sm font-bold border ${selectedMember.enabled ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {selectedMember.enabled ? "YES" : "NO"}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">탈퇴 여부</label>
                    <span className="text-gray-900 font-medium">{selectedMember.isWithdrawal ? "Y" : "N"}</span>
                  </div>
                  <div className="col-span-2 mt-2">
                    <label className="text-sm font-medium text-gray-500 block mb-2">역할 (Roles)</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.role && selectedMember.role.map((r: string) => (
                        <span key={r} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 shadow-sm">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-2 text-right">
              <button onClick={() => setSelectedMember(null)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">
                닫기
              </button>
              <button
                onClick={(e) => { setSelectedMember(null); handleEditClick(selectedMember, e); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm border border-transparent transition-all"
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
