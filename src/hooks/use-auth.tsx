"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User, Barbearia } from "@/types";

interface AuthContextType {
  user: User | null;
  barbearia: Barbearia | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nome: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              nome: userData.nome || "Usuário",
              createdAt: userData.createdAt?.toDate() || new Date(),
              plano: userData.plano || "free",
              fotoPerfil: userData.fotoPerfil,
            });

            // Check if admin
            setIsAdmin(firebaseUser.email === "admin@gbarber.com");

            const barbeariaDoc = await getDoc(
              doc(db, "barbearias", firebaseUser.uid)
            );
            if (barbeariaDoc.exists()) {
              const barbData = barbeariaDoc.data();
              setBarbearia({
                id: firebaseUser.uid,
                nome: barbData.nome || "Minha Barbearia",
                plano: barbData.plano || "free",
                createdAt: barbData.createdAt?.toDate() || new Date(),
                logo: barbData.logo,
                paleta: barbData.paleta || "dourado",
                cores: barbData.cores,
              });
            } else {
              await setDoc(doc(db, "barbearias", firebaseUser.uid), {
                nome: userData.nome || "Minha Barbearia",
                plano: "free",
                createdAt: serverTimestamp(),
              });
              setBarbearia({
                id: firebaseUser.uid,
                nome: userData.nome || "Minha Barbearia",
                plano: "free",
                createdAt: new Date(),
              });
            }
          } else {
            // Fallback if userDoc does not exist (e.g., auth created via console or latency)
            const fallbackName = firebaseUser.email?.split("@")[0] || "Usuário";
            
            await setDoc(doc(db, "users", firebaseUser.uid), {
              nome: fallbackName,
              email: firebaseUser.email || "",
              plano: "free",
              createdAt: serverTimestamp(),
            });
            
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              nome: fallbackName,
              createdAt: new Date(),
              plano: "free",
              fotoPerfil: undefined,
            });

            setIsAdmin(firebaseUser.email === "admin@gbarber.com");

            await setDoc(doc(db, "barbearias", firebaseUser.uid), {
              nome: fallbackName,
              plano: "free",
              createdAt: serverTimestamp(),
            });
            
            setBarbearia({
              id: firebaseUser.uid,
              nome: fallbackName,
              plano: "free",
              createdAt: new Date(),
              paleta: "dourado",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Provisoriamente configura usuário para evitar WSOD em caso de falha de permissão
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            nome: firebaseUser.email?.split("@")[0] || "Usuário",
            createdAt: new Date(),
            plano: "free",
            fotoPerfil: undefined,
          });
          setIsAdmin(firebaseUser.email === "admin@gbarber.com");
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setBarbearia(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, nome: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(doc(db, "users", firebaseUser.uid), {
      nome,
      email,
      plano: "free",
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, "barbearias", firebaseUser.uid), {
      nome,
      plano: "free",
      createdAt: serverTimestamp(),
    });

    setUser({
      id: firebaseUser.uid,
      email,
      nome,
      createdAt: new Date(),
      plano: "free",
    });

    setBarbearia({
      id: firebaseUser.uid,
      nome,
      plano: "free",
      createdAt: new Date(),
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setBarbearia(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{ user, barbearia, loading, isAdmin, login, register, logout, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}