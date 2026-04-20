"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseCrudOptions<T> {
  collectionPath: (userId: string) => string;
  defaultFormData: T;
  onSuccess?: (action: "create" | "update" | "delete") => void;
}

interface UseCrudReturn<T extends { id: string }> {
  data: T[];
  loading: boolean;
  submitting: boolean;
  formData: T;
  isModalOpen: boolean;
  editingId: string | null;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  setIsModalOpen: (open: boolean) => void;
  openCreateModal: () => void;
  openEditModal: (item: T) => void;
  closeModal: () => void;
  create: (additionalData?: Partial<T>) => Promise<void>;
  update: (additionalData?: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  fetchData: () => Promise<void>;
}

export function useCrud<T extends { id: string }>(
  userId: string | undefined,
  options: UseCrudOptions<T>
): UseCrudReturn<T> {
  const { toast } = useToast();
  const { collectionPath, defaultFormData, onSuccess } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<T>(defaultFormData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { db } = await import("@/lib/firebase");
      const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
      
      const snapshot = await getDocs(
        query(collection(db, collectionPath(userId)), orderBy("nome"))
      );
      
      setData(snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, collectionPath]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = useCallback(() => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsModalOpen(true);
  }, [defaultFormData]);

  const openEditModal = useCallback((item: T) => {
    setFormData(item);
    setEditingId(item.id);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData(defaultFormData);
    setEditingId(null);
  }, [defaultFormData]);

  const create = useCallback(async (additionalData?: Partial<T>) => {
    if (!userId) return;
    
    setSubmitting(true);
    try {
      const { db } = await import("@/lib/firebase");
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      
      await addDoc(collection(db, collectionPath(userId)), {
        ...formData,
        ...additionalData,
        createdAt: serverTimestamp(),
      } as Record<string, unknown>);
      
      toast({ title: editingId ? "Atualizado!" : "Criado!" });
      closeModal();
      fetchData();
      onSuccess?.("create");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setSubmitting(false);
    }
  }, [userId, formData, editingId, closeModal, fetchData, onSuccess, toast, collectionPath]);

  const update = useCallback(async (additionalData?: Partial<T>) => {
    if (!userId || !editingId) return;
    
    setSubmitting(true);
    try {
      const { db } = await import("@/lib/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      await updateDoc(doc(db, collectionPath(userId), editingId), {
        ...formData,
        ...additionalData,
      } as Record<string, unknown>);
      
      toast({ title: "Atualizado!" });
      closeModal();
      fetchData();
      onSuccess?.("update");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setSubmitting(false);
    }
  }, [userId, editingId, formData, closeModal, fetchData, onSuccess, toast, collectionPath]);

  const remove = useCallback(async (id: string) => {
    if (!userId || !confirm("Tem certeza que deseja excluir?")) return;
    
    try {
      const { db } = await import("@/lib/firebase");
      const { doc, deleteDoc } = await import("firebase/firestore");
      
      await deleteDoc(doc(db, collectionPath(userId), id));
      toast({ title: "Excluído!" });
      fetchData();
      onSuccess?.("delete");
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  }, [userId, fetchData, onSuccess, toast, collectionPath]);

  return {
    data,
    loading,
    submitting,
    formData,
    isModalOpen,
    editingId,
    setFormData,
    setIsModalOpen,
    openCreateModal,
    openEditModal,
    closeModal,
    create,
    update,
    remove,
    fetchData,
  };
}
