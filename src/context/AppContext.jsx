import React, { createContext, useContext, useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  deleteDoc,
  setDoc,
  startAt,
  endAt,
  where,
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
        if (data.isAdmin === true) {
          totalUsers--;
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
  const fetchUsersPage = async (pageNumber, reset = false) => {
    if (reset) {
      setUsers([]);
      pageCursorsRef.current = {};
      lastFetchedPageRef.current = 0;
      setUsersPage(1);
    }
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

  const createUser = async (userData) => {
    try {
      const usersRef = collection(db, "users");
      const docRef = await addDoc(usersRef, {
        profile: {
          fullName: userData.fullName,
          email: userData.email,
          password: userData.password,
          profileSetup: false,
          created_at: new Date(), // ✅ auto timestamp
        },
      });

      await updateDoc(doc(db, "users", docRef.id), { uid: docRef.id });

      toast.success("User Created Successfully");
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
      return { success: false, message: error.message };
    }
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
        fullName_lower: updates.fullName
          ? updates.fullName.toLowerCase()
          : currentData.profile.fullName_lower ||
            currentData.profile.fullName?.toLowerCase(),
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

  const fetchUserByName = async (name) => {
    try {
      setUsersLoading(true);
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        orderBy("profile.fullName"),
        startAt(name),
        endAt(name + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    } catch (error) {
      console.error("Error fetching users by name:", error);
      toast.error("Failed to fetch users by name");
    } finally {
      setUsersLoading(false);
    }
  };

  // const fetchUserByName = async (name) => {
  //   try {
  //     setUsersLoading(true);
  //     const usersRef = collection(db, "users");
  //     const q = query(
  //       usersRef,
  //       orderBy("profile.fullName"),
  //       startAt(name.toLowerCase()),
  //       endAt(name.toLowerCase() + "\uf8ff")
  //     );

  //     const querySnapshot = await getDocs(q);

  //     return querySnapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //   } catch (error) {
  //     console.error("Error fetching users by name:", error);
  //     toast.error("Failed to fetch users by name");
  //   } finally {
  //     setUsersLoading(false);
  //   }
  // };

  const fetchUserByDate = async (fromDate, toDate) => {
    try {
      setUsersLoading(true);
      const usersRef = collection(db, "users");

      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // ✅ include entire last day

      const q = query(
        usersRef,
        where("profile.created_at", ">=", from),
        where("profile.created_at", "<=", to),
        orderBy("profile.created_at", "desc")
      );

      const querySnapshot = await getDocs(q);
      const fetchedUsers = [];
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.isAdmin !== true) {
          fetchedUsers.push({
            id: doc.id,
            ...data,
          });
        }
      });

      setUsers(fetchedUsers);
      return { success: true, users: fetchedUsers };
    } catch (error) {
      console.error("Error fetching users by date:", error);
      return { success: false, message: error.message };
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!admin) {
      setIsAuthenticated(false);
      return;
    }
  }, [admin]);

  // inside AppProvider (AppContext) — near other product functions / near top-level state
  const PRODUCTS_PAGE_SIZE = 8; // change page size if you want

  // products pagination state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [productsHasMore, setProductsHasMore] = useState(true);

  const productPageCursorsRef = React.useRef({});
  const lastFetchedProductsPageRef = React.useRef(0);

  // Create product (add name_lower for search)
  const createProduct = async (productData) => {
    try {
      const productsRef = collection(db, "products");
      const payload = {
        ...productData,
        name_lower: productData.name ? productData.name.toLowerCase() : "",
        createdAt: new Date(),
      };
      const docRef = await addDoc(productsRef, payload);
      toast.success("Product added successfully!");
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
      return { success: false, message: error.message };
    }
  };

  // Get one-time all products (keep if you use it elsewhere)
  const getAllProducts = async () => {
    try {
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      const prods = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      return { success: true, products: prods };
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
      return { success: false, message: error.message };
    }
  };

  // Fetch page of products (pagination by name_lower then doc cursor)
  const fetchProductsPage = async (pageNumber = 1, reset = false) => {
    if (reset) {
      setProducts([]);
      productPageCursorsRef.current = {};
      lastFetchedProductsPageRef.current = 0;
      setProductsPage(1);
    }
    if (lastFetchedProductsPageRef.current === pageNumber) {
      // already on requested page
      return;
    }

    setProductsLoading(true);
    try {
      const productsRef = collection(db, "products");
      let q;

      // We order by name_lower for stable deterministic ordering for pagination
      if (pageNumber === 1) {
        q = query(
          productsRef,
          orderBy("name_lower"),
          limit(PRODUCTS_PAGE_SIZE)
        );
      } else {
        const cursor = productPageCursorsRef.current[pageNumber - 1];
        if (!cursor) {
          setProductsLoading(false);
          return;
        }
        q = query(
          productsRef,
          orderBy("name_lower"),
          startAfter(cursor),
          limit(PRODUCTS_PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      if (snapshot.docs.length > 0) {
        // store last doc of this page to use as cursor for next page
        productPageCursorsRef.current[pageNumber] =
          snapshot.docs[snapshot.docs.length - 1];
      }

      setProductsHasMore(snapshot.docs.length === PRODUCTS_PAGE_SIZE);
      setProducts(fetched);
      lastFetchedProductsPageRef.current = pageNumber;
      return fetched;
    } catch (err) {
      console.error("Error fetching products page:", err);
      toast.error("Failed to fetch products");
      return null;
    } finally {
      setProductsLoading(false);
    }
  };

  const goToProductsPage = (pageNumber) => {
    setProductsPage(pageNumber);
    fetchProductsPage(pageNumber);
  };

  // Search products by name prefix (server query)
  const searchProductsByName = async (namePrefix) => {
    try {
      setProductsLoading(true);
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        orderBy("name_lower"),
        startAt(namePrefix.toLowerCase()),
        endAt(namePrefix.toLowerCase() + "\uf8ff")
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(results); // optionally set products to show search results
      setProductsHasMore(false);
      return { success: true, products: results };
    } catch (err) {
      console.error("Error searching products:", err);
      toast.error("Search failed");
      return { success: false, message: err.message };
    } finally {
      setProductsLoading(false);
    }
  };

  // Update / delete product remain same but ensure they update local state if needed:
  const updateProduct = async (id, data) => {
    try {
      const docRef = doc(db, "products", id);
      const payload = { ...data, updatedAt: new Date() };
      if (payload.name) payload.name_lower = payload.name.toLowerCase();
      await updateDoc(docRef, payload);
      toast.success("Product updated successfully!");
      // refresh local list if currently loaded (best to re-fetch current page)
      await fetchProductsPage(productsPage, true);
      return { success: true };
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
      return { success: false, message: error.message };
    }
  };

  const deleteProduct = async (id) => {
    try {
      const docRef = doc(db, "products", id);
      await deleteDoc(docRef);
      toast.success("Product deleted successfully!");
      // refresh current page
      await fetchProductsPage(productsPage, true);
      return { success: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
      return { success: false, message: error.message };
    }
  };

  const getAllDoctor = async () => {
    try {
      const DoctorRef = collection(db, "doctors");
      const snapshot = await getDocs(DoctorRef);
      const Doctors = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, doctors: Doctors }; // ✅ lowercase "doctors"
    } catch (error) {
      console.error("Error For FETCHING Doctor Data", error);
      toast.error("Failed to Get Doctor's Data");
      return { success: false, message: error.message };
    }
  };

  const addDoctors = async (doctorsData) => {
    try {
      const doctorRef = collection(db, "doctors");
      const docRef = await addDoc(doctorRef, {
        ...doctorsData,
        created_at: new Date(),
      });
      toast.success("Doctor added successfully!");
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding Doctor:", error);
      toast.error("Failed to add Doctor");
      return { success: false, message: error.message };
    }
  };

  const updateDoctor = async (id, data) => {
    try {
      const docRef = doc(db, "doctors", id);
      await updateDoc(docRef, { ...data, updatedAt: new Date() });
      toast.success("Doctor updated successfully!");
      return { success: true };
    } catch (error) {
      console.error("Error updating Doctor:", error);
      toast.error("Failed to update Doctor");
      return { success: false, message: error.message };
    }
  };

  const deleteDoctor = async (id) => {
    try {
      const docRef = doc(db, "doctors", id);
      await deleteDoc(docRef);
      toast.success("Doctor deleted successfully!");
      return { success: true };
    } catch (error) {
      console.error("Error deleting Doctor:", error);
      toast.error("Failed to delete Doctor");
      return { success: false, message: error.message };
    }
  };
  const getDoctorById = async (DoctorId) => {
    try {
      const DoctorRef = doc(db, "doctors", DoctorId);
      const snapshot = await getDoc(DoctorRef);
      if (snapshot.exists()) {
        return { success: true, doctor: snapshot.data() };
      } else {
        return { success: false, message: "Doctor not found" };
      }
    } catch (error) {
      console.error("Error fetching Doctor by ID:", error);
      return { success: false, message: error.message };
    }
  };

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
        createUser,
        getUserById,
        deleteUser,
        getDiscount,
        createOrUpdateDiscount,
        toggleDiscountStatus,
        deleteDiscount,
        dashboardDetails,

        fetchUserByName,
        fetchUserByDate,

        products,
        productsLoading,
        productsPage,
        productsHasMore,
        fetchProductsPage,
        goToProductsPage,
        createProduct,
        getAllProducts,
        updateProduct,
        deleteProduct,
        searchProductsByName,

        addDoctors,
        getAllDoctor,
        updateDoctor,
        deleteDoctor,
        getDoctorById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
