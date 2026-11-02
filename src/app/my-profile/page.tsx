"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { borrows, books, getUser, saveBooks, saveBorrows, signOut, type User } from "@/lib/store";
import { authClient } from "@/lib/auth-client";

export default function Profile() {
  const [user, setProfile] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const current = getUser();
    if (!current) {
      sessionStorage.setItem("bn-next", location.pathname);
      router.replace("/login");
    } else setProfile(current);
  }, [router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const image = String(form.get("image")).trim();
    try {
      const result = await authClient.updateUser({ name, image: image || null });
      if (result.error) throw new Error(result.error.message);
      const next = { ...user, name, photo: image || undefined };
      setProfile(next);
      toast.success("Your profile has been updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your profile.");
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
      toast.success("Your account and personal BookNook data have been deleted.");
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
        <div className="field full"><label>Photo URL</label><input name="image" type="url" defaultValue={user?.photo||""} placeholder="https://..."/></div>
      </div>
      <div className="form-footer"><span>Books are better when shared.</span><button className="button">Save profile <ArrowUpRight size={16}/></button></div>
    </form>

    <section className="danger-zone" aria-labelledby="delete-account-heading">
      <div><span className="eyebrow">ACCOUNT</span><h2 id="delete-account-heading">Delete account</h2><p>Permanently erase your profile, sign-in credentials, books you shared, and borrowing history. You will be signed out and cannot restore this account.</p></div>
      <button className="button danger-button" onClick={() => setConfirmDelete(true)}><Trash2 size={16}/> Delete my account</button>
    </section>

    {confirmDelete&&<div className="modal-backdrop"><div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <button className="modal-close" aria-label="Close" onClick={()=>{setConfirmDelete(false);setConfirmText("")}}><X/></button>
      <span className="eyebrow">THIS CANNOT BE UNDONE</span><h2 id="confirm-delete-title">Delete your account?</h2>
      <p>This permanently deletes your profile and login, the books you shared, and your borrowing history. For everyone’s lending records to stay accurate, you must return books you borrowed and wait for other readers to return books you shared first.</p>
      <div className="field"><label htmlFor="delete-confirmation">Type DELETE to confirm</label><input id="delete-confirmation" value={confirmText} onChange={event=>setConfirmText(event.target.value)} autoComplete="off"/></div>
      <div className="confirm-actions"><button className="button button-outline" onClick={()=>{setConfirmDelete(false);setConfirmText("")}}>Cancel</button><button className="button danger-button" onClick={deleteAccount} disabled={confirmText!=="DELETE"||deleting}>{deleting?"Deleting…":"Permanently delete"}</button></div>
    </div></div>}
  </section>;
}
