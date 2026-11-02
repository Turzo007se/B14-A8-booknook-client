"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { borrows, books, getUser, saveBooks, saveBorrows, setUser as cacheUser, signOut, type User } from "@/lib/store";
import { authClient } from "@/lib/auth-client";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";

export default function Profile() {
  const [user, setProfile] = useState<User | null>(null);
  const [photo, setPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [createdWithGoogle, setCreatedWithGoogle] = useState<boolean | null>(null);
  const [passwordCheckError, setPasswordCheckError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const current = getUser();
    if (!current) {
      sessionStorage.setItem("bn-next", location.pathname);
      router.replace("/login");
    } else { setProfile(current); setPhoto(current.photo || ""); }
    authClient.getSession().then(({ data }) => {
      if (!data?.user) return;
      const fresh = { name: data.user.name, email: data.user.email, photo: data.user.image || undefined };
      setProfile(fresh);
      setPhoto(fresh.photo || "");
      cacheUser(fresh);
    }).catch(() => {});
    authClient.listAccounts().then(({ data, error }) => {
      if (error) throw new Error(error.message);
      const accounts = [...(data || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setHasPassword(Boolean(accounts.some(account => account.providerId === "credential")));
      setCreatedWithGoogle(accounts[0]?.providerId === "google");
    }).catch(error => setPasswordCheckError(error instanceof Error ? error.message : "Couldn't check your sign-in methods."));
  }, [router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const image = String(form.get("image") || "").trim();
    try {
      const result = await authClient.updateUser({ name, image: image || null });
      if (result.error) throw new Error(result.error.message);
      const next = { ...user, name, photo: image || undefined };
      setProfile(next);
      setPhoto(image);
      toast.success("Your profile has been updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your profile.");
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasPassword === null) return;
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
      toast.error("Use at least 8 characters, including an uppercase and a lowercase letter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      if (hasPassword) {
        const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
        if (result.error) throw new Error(result.error.message);
      } else {
        const response = await fetch("/api/account/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message || "Couldn't set your password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(hasPassword ? "Your password has been changed." : "A password has been added to your account.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function updateEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const nextEmail = newEmail.trim().toLowerCase();
    if (nextEmail === user.email.toLowerCase()) {
      toast.error("Enter an email address different from your current one.");
      return;
    }
    if (nextEmail !== confirmEmail.trim().toLowerCase()) {
      toast.error("The email addresses do not match.");
      return;
    }
    setChangingEmail(true);
    try {
      const result = await authClient.changeEmail({ newEmail: nextEmail, callbackURL: "/my-profile" });
      if (result.error) throw new Error(result.error.message);
      setNewEmail("");
      setConfirmEmail("");
      toast.success("Check your email for the verification steps. Your sign-in email changes after verification.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't request an email change.");
    } finally {
      setChangingEmail(false);
    }
  }

  async function deleteAccount() {
    if (!user || confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const result = await authClient.deleteUser();
      if (result.error) throw new Error(result.error.message);
      saveBooks(books().filter(book => book.addedBy !== user.email));
      saveBorrows(borrows().filter(borrow => borrow.email !== user.email));
      signOut();
      toast.success("Your account and personal BookNook data have been deleted. Shared books remain anonymous for current borrowers.");
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete your account.");
    } finally {
      setDeleting(false);
    }
  }

  return <section className="form-page">
    <div className="form-heading"><span className="form-heading-icon"><UserRound/></span><div><span className="eyebrow">YOUR LITTLE CORNER</span><h1>My profile<span className="serif-dot">.</span></h1><p>Let the nook know a little about you.</p></div></div>
    <form className="book-form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field full"><label>Name</label><input name="name" required minLength={1} defaultValue={user?.name||""}/></div>
        <div className="field full"><label>Email address</label><input value={user?.email||""} readOnly/><small>Your email address is managed by your account.</small></div>
        <div className="field full"><ProfilePhotoUpload value={photo} onChange={setPhoto} onUploadingChange={setUploadingPhoto}/></div>
      </div>
      <div className="form-footer"><span>Books are better when shared.</span><button className="button" disabled={uploadingPhoto}>Save profile <ArrowUpRight size={16}/></button></div>
    </form>

    {hasPassword !== null && createdWithGoogle === false&&<section className="book-form email-settings">
      <span className="eyebrow">SIGN-IN DETAILS</span><h2>Change email address</h2>
      <p>Your current address is <strong>{user?.email}</strong>. Verify the new address before it becomes your sign-in email.</p>
      <form className="email-form" onSubmit={updateEmail}>
        <label>New email address<input type="email" autoComplete="email" required value={newEmail} onChange={event=>setNewEmail(event.target.value)} placeholder="you@example.com"/></label>
        <label>Retype new email address<input type="email" autoComplete="off" required value={confirmEmail} onChange={event=>setConfirmEmail(event.target.value)} placeholder="you@example.com"/></label>
        <small>We will email verification instructions. If your current email is verified, you must approve the change there before verifying the new address.</small>
        <button className="button" disabled={changingEmail}>{changingEmail?"Sending verification...":"Send verification email"}<ArrowUpRight size={16}/></button>
      </form>
    </section>}

    <section className="book-form password-settings">
      <span className="eyebrow">SECURITY</span><h2>Password</h2>
      <p>{hasPassword ? "Change the password you use to sign in with your email." : "Set a password so you can also sign in with your email."}</p>
      {hasPassword === null ? <small>{passwordCheckError || "Checking your sign-in methods..."}</small> : <form className="password-form" onSubmit={updatePassword}>
        {hasPassword&&<label>Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={event=>setCurrentPassword(event.target.value)}/></label>}
        <label>New password<input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={event=>setNewPassword(event.target.value)}/></label>
        <label>Retype new password<input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)}/></label>
        <small>At least 8 characters, including one uppercase and one lowercase letter.</small>
        <button className="button" disabled={savingPassword}>{savingPassword ? "Saving password..." : hasPassword ? "Change password" : "Set password"}<ArrowUpRight size={16}/></button>
      </form>}
    </section>

    <section className="danger-zone" aria-labelledby="delete-account-heading">
      <div><span className="eyebrow">ACCOUNT</span><h2 id="delete-account-heading">Delete account</h2><p>Permanently erase your profile, sign-in credentials, and borrowing history. Books you shared stay available to readers under the anonymous name Former member.</p></div>
      <button className="button danger-button" onClick={() => setConfirmDelete(true)}><Trash2 size={16}/> Delete my account</button>
    </section>

    {confirmDelete&&<div className="modal-backdrop"><div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <button className="modal-close" aria-label="Close" onClick={()=>{setConfirmDelete(false);setConfirmText("")}}><X/></button>
      <span className="eyebrow">THIS CANNOT BE UNDONE</span><h2 id="confirm-delete-title">Delete your account?</h2>
      <p>This permanently deletes your profile, login, and borrowing history. Books you shared remain in the collection under Former member so current borrowers can return them. Return any books you borrowed before deleting your account.</p>
      <div className="field"><label htmlFor="delete-confirmation">Type DELETE to confirm</label><input id="delete-confirmation" value={confirmText} onChange={event=>setConfirmText(event.target.value)} autoComplete="off"/></div>
      <div className="confirm-actions"><button className="button button-outline" onClick={()=>{setConfirmDelete(false);setConfirmText("")}}>Cancel</button><button className="button danger-button" onClick={deleteAccount} disabled={confirmText!=="DELETE"||deleting}>{deleting?"Deleting…":"Permanently delete"}</button></div>
    </div></div>}
  </section>;
}
