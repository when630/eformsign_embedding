"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Plus, Trash2, Edit, X, Search, UserPlus, Check, ChevronDown } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email?: string; // Sometimes id IS email, but let's handle if they are separate
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: Member[];
}

export default function GroupManagementPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Member Selection State
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Create/Edit Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    selectedMembers: Member[];
  }>({
    name: "",
    description: "",
    selectedMembers: []
  });

  useEffect(() => {
    fetchGroups();
    fetchMembers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get("/eformsign/company/groups");
      const list = response.data.data?.groups || response.data.data || [];
      setGroups(list);
    } catch (error) {
      console.error("Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      // Reusing the member list endpoint
      const response = await api.get("/eformsign/company/members");
      const list = response.data.data?.members || response.data.data || [];
      // Ensure specific structure
      const formattedList = list.map((m: any) => ({
        id: m.id || m.email, // Fallback if structure varies
        name: m.name || m.id || "Unknown",
        email: m.id // Assuming ID is email as per previous context
      }));
      setAllMembers(formattedList);
    } catch (error) {
      console.error("Failed to fetch members", error);
    }
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingGroupId(null);
    setFormData({ name: "", description: "", selectedMembers: [] });
    setIsModalOpen(true);
    setMemberSearchTerm("");
  };

  const handleOpenEdit = (group: Group) => {
    setIsEditMode(true);
    setEditingGroupId(group.id);

    // Map existing members to Member objects
    // The API response for group.members might be array of Objects or IDs.
    // Based on previous code, let's look at fetchGroups response structure.
    // If group.members is [{id: "...", name: "..."}], we use it.
    // If text only, we map to object using allMembers lookup?
    // Let's assume group.members contains objects.

    // Correction: ensure we match format
    const existingMembers = (group.members || []).map((m: any) => ({
      id: m.id || m,
      name: m.name || m.id || m, // Best effort name
      email: m.id
    }));

    setFormData({
      name: group.name || "",
      description: group.description || "",
      selectedMembers: existingMembers
    });
    setIsModalOpen(true);
    setMemberSearchTerm("");
  };

  const handleAddMember = (member: Member) => {
    if (!formData.selectedMembers.some(m => m.id === member.id)) {
      setFormData(prev => ({
        ...prev,
        selectedMembers: [...prev.selectedMembers, member]
      }));
    }
    setMemberSearchTerm("");
    // Keep dropdown open for multiple selection? Or close? Let's keep open.
  };

  const handleRemoveMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.filter(m => m.id !== memberId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const memberList = formData.selectedMembers.map(m => m.id);

      const payload = {
        group: {
          name: formData.name,
          description: formData.description,
          members: memberList
        }
      };

      if (isEditMode && editingGroupId) {
        await api.patch(`/eformsign/company/groups/${editingGroupId}`, payload);
        alert("그룹이 수정되었습니다.");
      } else {
        await api.post("/eformsign/company/groups", payload);
        alert("그룹이 생성되었습니다.");
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.response?.data?.message || e.message || "작업 실패";
      alert(`실패: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/eformsign/company/groups/${id}`);
      alert("삭제되었습니다.");
      fetchGroups();
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.response?.data?.message || e.message || "삭제 실패";
      alert(`삭제 실패: ${errorMessage}`);
    }
  };

  // Filtering for member dropdown
  const filteredAllMembers = allMembers.filter(m =>
    !formData.selectedMembers.some(selected => selected.id === m.id) &&
    (m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(memberSearchTerm.toLowerCase()))
  );

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-8 h-8" />
            그룹 관리
          </h1>
          <p className="text-gray-500 mt-1">조직의 그룹을 관리하고 멤버를 할당합니다.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>새 그룹 추가</span>
        </button>
      </header>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200">
                <th className="px-4 py-3 font-medium">그룹명</th>
                <th className="px-4 py-3 font-medium">설명</th>
                <th className="px-4 py-3 font-medium text-center">멤버 수</th>
                <th className="px-4 py-3 font-medium text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGroups.map((group) => (
                <tr
                  key={group.id}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors text-sm"
                  onClick={() => handleOpenEdit(group)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                    {group.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{group.description || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {group.members ? group.members.length : 0}명
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(group); }}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                        title="수정"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(group.id, e)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredGroups.length === 0 && (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
              <UserPlus size={48} className="mb-4 opacity-20" />
              <p>등록된 그룹이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? "그룹 수정" : "새 그룹 추가"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">그룹 이름</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  placeholder="예: 개발팀"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  placeholder="그룹에 대한 설명 (선택)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">멤버 추가</label>

                {/* Dropdown Input */}
                <div className="relative">
                  <div
                    className="flex items-center border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white overflow-hidden"
                    onClick={() => setIsMemberDropdownOpen(true)}
                  >
                    <Search size={18} className="ml-3 text-gray-400" />
                    <input
                      type="text"
                      className="w-full px-3 py-2 border-none outline-none text-sm placeholder:text-gray-400"
                      placeholder="멤버 이름 또는 ID로 검색..."
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        setIsMemberDropdownOpen(true);
                      }}
                      onFocus={() => setIsMemberDropdownOpen(true)}
                    />
                    <button type="button" className="mr-2 text-gray-400">
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isMemberDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                      {filteredAllMembers.length > 0 ? (
                        <div className="py-1">
                          {filteredAllMembers.map(member => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleAddMember(member)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between text-sm group transition-colors"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 group-hover:text-blue-700">{member.name}</span>
                                <span className="text-xs text-gray-500">{member.id}</span>
                              </div>
                              <Plus size={16} className="text-gray-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Members Chips - Moved below dropdown */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.selectedMembers.map(member => (
                    <div key={member.id} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border border-blue-100">
                      <span>{member.name} ({member.id})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {formData.selectedMembers.length === 0 && (
                    <span className="text-sm text-gray-400 py-1">선택된 멤버가 없습니다.</span>
                  )}
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
                  {isEditMode ? "수정 사항 저장" : "그룹 생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
