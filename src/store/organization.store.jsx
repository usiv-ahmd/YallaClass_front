// src/store/organization.store.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { organizationApi } from "../api/organization.api";
import { useAuth } from "./auth.store.jsx";

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user?.organizationId) {
      setOrganization(null);
      setMembers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [orgRes, membersRes] = await Promise.all([organizationApi.get(), organizationApi.listMembers()]);
      setOrganization(orgRes.data);
      setMembers(membersRes.data);
    } catch (e) {
      setError(e.message || "تعذّر تحميل بيانات المنظمة");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.organizationId]);

  const updateOrganization = useCallback(async (patch) => {
    const res = await organizationApi.update(patch);
    setOrganization(res.data);
    return res.data;
  }, []);

  const addMember = useCallback(async (payload) => {
    const res = await organizationApi.addMember(payload);
    setMembers((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  const updateMember = useCallback(async (memberId, patch) => {
    const res = await organizationApi.updateMember(memberId, patch);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? res.data : m)));
    return res.data;
  }, []);

  const removeMember = useCallback(async (memberId) => {
    await organizationApi.removeMember(memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({
    organization,
    members,
    loading,
    error,
    refresh,
    updateOrganization,
    addMember,
    updateMember,
    removeMember,
  }), [organization, members, loading, error, refresh, updateOrganization, addMember, updateMember, removeMember]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("[useOrganization] must be used inside <OrganizationProvider>");
  }
  return ctx;
}