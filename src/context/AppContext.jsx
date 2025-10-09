import React, { createContext, useContext, useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase.js";
import { toast } from "react-toastify";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem("adminData");
    return raw ? JSON.parse(raw) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("adminToken");
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // users pagination state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(true);

  const PAGE_SIZE = 10;
  const pageCursorsRef = React.useRef({});
  const lastFetchedPageRef = React.useRef(0);

  const login = async (email, password) => {
    setLoading(true);
    setError("");

    try {
      const creds = await signInWithEmailAndPassword(auth, email, password);
      const user = creds.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        throw new Error("No user profile found");
      }

      const userData = userSnap.data();

      if (userData.isAdmin !== true) {
        await signOut(auth);
        throw new Error("You are not authorized as admin");
      }

      const token = await user.getIdToken();
      const adminData = { ...userData, uid: user.uid };

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminData", JSON.stringify(adminData));

      setAdmin(adminData);
      setIsAuthenticated(true);

      toast.success("Login successful");
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      const message = err?.message || "Login failed";
      setError(message);
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const dashboardDetails = async () => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);

      let totalUsers = 0;
      let subscribedUsers = 0;
      let activeUsers = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const profile = data.profile || {};

        totalUsers++;

        if (profile.subscription === true) {
          subscribedUsers++;
        }

        if (profile.profileSetup === true) {
          activeUsers++;
        }
      });

      return {
        totalUsers,
        subscribedUsers,
        activeUsers,
      };
    } catch (error) {
      console.error("Error getting dashboard details:", error);
      return {
        totalUsers: 0,
        subscribedUsers: 0,
        activeUsers: 0,
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out failed:", e);
    }
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setAdmin(null);
    setIsAuthenticated(false);
    toast.info("Logged out");
  };
  const fetchUsersPage = async (pageNumber) => {
    if (lastFetchedPageRef.current === pageNumber) {
      return;
    }

    setUsersLoading(true);
    try {
      const usersRef = collection(db, "users");
      let q;

      if (pageNumber === 1) {
        q = query(
          usersRef,
          orderBy("profile.created_at", "desc"),
          limit(PAGE_SIZE)
        );
      } else {
        const cursor = pageCursorsRef.current[pageNumber - 1];
        if (!cursor) {
          setUsersLoading(false);
          return;
        }
        q = query(
          usersRef,
          orderBy("profile.created_at", "desc"),
          startAfter(cursor),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const fetchedUsers = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.isAdmin !== true) {
          fetchedUsers.push({
            id: doc.id,
            ...data,
          });
        }
      });

      if (snapshot.docs.length > 0) {
        pageCursorsRef.current[pageNumber] =
          snapshot.docs[snapshot.docs.length - 1];
      }

      setUsersHasMore(snapshot.docs.length === PAGE_SIZE);
      setUsers(fetchedUsers);
      lastFetchedPageRef.current = pageNumber;
      return fetchedUsers;
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  };

  const goToUsersPage = (pageNumber) => {
    setUsersPage(pageNumber);
    fetchUsersPage(pageNumber);
  };

  const updateUser = async (userId, updates) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const currentData = userSnap.data();
      const updatedProfile = {
        ...currentData.profile,
        ...updates,
      };

      await updateDoc(userRef, {
        profile: updatedProfile,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, profile: updatedProfile } : u
        )
      );

      toast.success("User updated successfully");
      return { success: true };
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Failed to update user");
      return { success: false, message: err.message };
    }
  };
  const getUserById = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      return {
        success: true,
        user: {
          id: userSnap.id,
          ...userSnap.data(),
        },
      };
    } catch (err) {
      console.error("Error fetching user:", err);
      toast.error("Failed to fetch user details");
      return { success: false, message: err.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);

      setUsers((prev) => prev.filter((u) => u.id !== userId));

      toast.success("User deleted successfully");
      return { success: true };
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user");
      return { success: false, message: err.message };
    }
  };
  const getDiscount = async () => {
    try {
      const discountRef = doc(db, "discount", "current");
      const discountSnap = await getDoc(discountRef);

      if (discountSnap.exists()) {
        return {
          success: true,
          discount: discountSnap.data(),
        };
      }
      return { success: true, discount: null };
    } catch (err) {
      console.error("Error fetching discount:", err);
      toast.error("Failed to fetch discount");
      return { success: false, message: err.message };
    }
  };

  const createOrUpdateDiscount = async (discountValue) => {
    try {
      const discountRef = doc(db, "discount", "current");
      await setDoc(discountRef, {
        discount: discountValue,
        isActive: true,
        updatedAt: new Date(),
      });

      toast.success("Discount saved successfully");
      return { success: true };
    } catch (err) {
      console.error("Error saving discount:", err);
      toast.error("Failed to save discount");
      return { success: false, message: err.message };
    }
  };

  const toggleDiscountStatus = async (isActive) => {
    try {
      const discountRef = doc(db, "discount", "current");
      await updateDoc(discountRef, {
        isActive: isActive,
        updatedAt: new Date(),
      });

      toast.success(`Discount ${isActive ? "activated" : "deactivated"}`);
      return { success: true };
    } catch (err) {
      console.error("Error toggling discount:", err);
      toast.error("Failed to update discount status");
      return { success: false, message: err.message };
    }
  };

  const deleteDiscount = async () => {
    try {
      const discountRef = doc(db, "discount", "current");
      await deleteDoc(discountRef);

      toast.success("Discount deleted successfully");
      return { success: true };
    } catch (err) {
      console.error("Error deleting discount:", err);
      toast.error("Failed to delete discount");
      return { success: false, message: err.message };
    }
  };

  useEffect(() => {
    if (!admin) {
      setIsAuthenticated(false);
      return;
    }
  }, [admin]);

  return (
    <AppContext.Provider
      value={{
        admin,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        setAdmin,
        users,
        usersLoading,
        usersPage,
        usersHasMore,
        goToUsersPage,
        updateUser,
        fetchUsersPage,
        getUserById,
        deleteUser,
        getDiscount,
        createOrUpdateDiscount,
        toggleDiscountStatus,
        deleteDiscount,
        dashboardDetails
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
