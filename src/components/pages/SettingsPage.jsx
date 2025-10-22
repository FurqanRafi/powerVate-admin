// src/components/pages/SettingsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth, db } from "../../services/firebase.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

export default function SettingsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [email, setEmailField] = useState("");
  // password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [uid, setUid] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/");
      return;
    }
    setUid(user.uid);
    // fetch fresh profile from Firestore
    (async () => {
      setLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          toast.error("Admin profile not found");
          navigate("/");
          return;
        }
        const data = snap.data();
        const profile = data.profile || {};
        setName(profile.fullName || "");
        // prefer profile.email if present otherwise auth.email
        setEmailField(profile.email || user.email || "");
      } catch (err) {
        console.error("Failed to load admin profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: reauthenticate using current password
  const reauthenticate = async (password) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const handleSaveProfile = async () => {
    if (!uid) return;
    setSavingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Auth user not found");

      // 1) If email changed => update Auth email (requires recent login)
      if (email !== user.email) {
        // We try to update without reauth first; if it fails, inform user to enter current password
        try {
          await updateEmail(user, email);
          toast.success("Auth email updated");
        } catch (err) {
          // common error: requires-recent-login
          if (err.code === "auth/requires-recent-login") {
            toast.info(
              "Please enter your current password to confirm email change."
            );
            // attempt interactive reauth if currentPassword provided
            if (!currentPassword) {
              throw new Error(
                "Please enter current password and click Save again to change email."
              );
            }
            await reauthenticate(currentPassword);
            await updateEmail(user, email);
            toast.success("Auth email updated after re-authentication");
          } else {
            throw err;
          }
        }
      }
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        "profile.fullName": name,
        "profile.email": email,
        updated_at: serverTimestamp(),
      });
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

      toast.success("Profile updated");
    } catch (err) {
      console.error("Save profile error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!uid) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    if (!currentPassword) {
      toast.error("Please enter your current password to confirm");
      return;
    }

    setChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Auth user not found");

      // reauthenticate first
      await reauthenticate(currentPassword);

      // then update password
      await updatePassword(user, newPassword);

      toast.success("Password updated. Please use the new password next time.");
      // clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error("Change password error:", err);
      const msg =
        err.code === "auth/wrong-password"
          ? "Current password is incorrect"
          : err.message || "Failed to update password";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-6">Settings</h3>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold text-gray-800 mb-4">
            Profile Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmailField(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
              />
            </div>

            {/* Note: if email change requires reauth, user must fill Current Password below, or you can show a modal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password (required for email change)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password if changing email or password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpdatePassword}
                disabled={changingPassword}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-60"
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
