"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Menu, X, ChevronDown, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getUser, setUser as cacheUser, signOut, type User } from "@/lib/store";
import { authClient } from "@/lib/auth-client";

type ThemeMode = "system" | "light" | "dark";

function ThemeSelector() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const apply = (selected: ThemeMode) => {
      const theme = selected === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : selected;
      document.documentElement.dataset.theme = theme;
    };
    const saved = localStorage.getItem("booknook-theme");
    const initial: ThemeMode = saved === "light" || saved === "dark" ? saved : "system";
    setMode(initial);
    apply(initial);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => {
      if ((localStorage.getItem("booknook-theme") || "system") === "system") apply("system");
    };
    media.addEventListener("change", onSystemThemeChange);
    return () => media.removeEventListener("change", onSystemThemeChange);
  }, []);

  function changeMode(value: string) {
    const next = value as ThemeMode;
    localStorage.setItem("booknook-theme", next);
    setMode(next);
    const isDark = next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }

  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  return <label className="theme-control" title="Choose appearance"><Icon size={16}/><select aria-label="Color theme" value={mode} onChange={event => changeMode(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}

function MemberAvatar({ user }: { user: User }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [user.photo]);
  return <span className="member-avatar">
    {user.photo && !failed
      ? <img src={user.photo} alt={`${user.name} profile photo`} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      : <span className="member-avatar-fallback" aria-label={`${user.name} profile`}>{user.name.trim().charAt(0).toUpperCase()}</span>}
  </span>;
}

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
    const onAuthChange = () => setUser(getUser());
    window.addEventListener("booknook-auth", onAuthChange);
    authClient.getSession().then(({ data }) => {
      if (data?.user) {
        const profile = { name: data.user.name, email: data.user.email, photo: data.user.image || undefined };
        setUser(profile);
        cacheUser(profile);
      } else {
        signOut();
        setUser(null);
      }
    }).catch(() => {
      signOut();
      setUser(null);
    });
    return () => window.removeEventListener("booknook-auth", onAuthChange);
  }, [path]);

  async function logout() {
    try { await authClient.signOut(); }
    finally { signOut(); setUser(null); setDrop(false); router.push("/"); }
  }

  return <header className="header"><div className="nav-wrap">
    <Link className="brand" href="/"><span className="brand-icon"><BookOpen size={20}/></span><span>book<span className="brand-accent">nook</span><small>YOUR NEXT CHAPTER</small></span></Link>
    <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
    <nav className={open ? "nav open" : "nav"}>
      <Link href="/" className={path === "/" ? "active" : ""}>Home</Link>
      <Link href="/books" className={path.startsWith("/books") ? "active" : ""}>All Books</Link>
      {user && <><Link href="/add-book">Add a Book</Link><Link href="/my-books">My Books</Link><Link href="/my-borrows">My Borrows</Link></>}
    </nav>
    <div className="nav-actions"><ThemeSelector/>{user ? <div className="profile">
      <button className="avatar-button" onClick={() => setDrop(!drop)}><MemberAvatar user={user}/><span>{user.name.split(" ")[0]}</span><ChevronDown size={15}/></button>
      {drop && <div className="dropdown"><div className="drop-name">{user.name}<small>{user.email}</small></div><Link href="/my-profile" onClick={() => setDrop(false)}>My Profile</Link><button onClick={logout}><LogOut size={15}/> Log out</button></div>}
    </div> : <><Link className="nav-login nav-login-highlight" href="/login">Log in</Link><Link className="button button-small" href="/register">Join the nook</Link></>}</div>
  </div></header>;
}

export function SiteFooter() {
  return <footer className="footer"><div className="footer-inner">
    <div><Link className="brand footer-brand" href="/"><span className="brand-icon"><BookOpen size={20}/></span><span>book<span className="brand-accent">nook</span><small>YOUR NEXT CHAPTER</small></span></Link><p>A little corner of the internet for people who always have one more book in them.</p></div>
    <div className="footer-links"><span className="eyebrow">EXPLORE</span><Link href="/books">The collection</Link><Link href="/register">Become a member</Link></div>
    <div className="footer-links"><span className="eyebrow">SAY HELLO</span><a href="mailto:hello@booknook.com">hello@booknook.com</a><div className="socials"><a href="https://instagram.com">ig</a><a href="https://x.com">X</a><a href="https://facebook.com">f</a></div></div>
  </div><div className="copyright"><span>Â© 2025 BookNook Library</span><span>Made for the love of getting lost in a story.</span></div></footer>;
}

