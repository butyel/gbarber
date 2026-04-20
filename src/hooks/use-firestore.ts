"use client";

import useSWR, { SWRConfiguration } from "swr";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DocumentData } from "firebase/firestore";

interface FirestoreOptions {
  whereField?: string;
  whereOperator?: Parameters<typeof where>[1];
  whereValue?: unknown;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
}

export function useFirestore<T extends { id: string }>(
  collectionPath: string,
  options: FirestoreOptions = {}
) {
  const config: SWRConfiguration<T[], unknown, () => Promise<T[]>> = {
    revalidateOnFocus: options.revalidateOnFocus ?? true,
    revalidateOnReconnect: options.revalidateOnReconnect ?? true,
    dedupingInterval: options.dedupingInterval ?? 5000,
    fallbackData: [],
  };

  const fetcher = async (): Promise<T[]> => {
    if (!db) throw new Error("Firebase not initialized");
    
    const col = collection(db, collectionPath);
    let q = query(col);
    
    if (options.whereField && options.whereOperator !== undefined) {
      q = query(q, where(options.whereField, options.whereOperator, options.whereValue));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  };

  const { data, error, isLoading, mutate } = useSWR<T[]>(
    collectionPath,
    fetcher,
    config
  );

  return {
    data: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useFirestoreById<T extends { id: string }>(
  collectionPath: string,
  id: string | null
) {
  const { data, error, isLoading, mutate } = useSWR<T | null>(
    id ? `${collectionPath}/${id}` : null,
    async () => {
      if (!db || !id) return null;
      const { doc, getDoc } = await import("firebase/firestore");
      const snapshot = await getDoc(doc(db, collectionPath, id));
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as T;
    }
  );

  return {
    data: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
