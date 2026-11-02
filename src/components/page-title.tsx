"use client";
import {useEffect} from "react";import {usePathname} from "next/navigation";
export function PageTitle(){const path=usePathname();useEffect(()=>{const last=path.split("/").filter(Boolean).at(-1);const name=path==="/"?"A little room for big stories":({books:"All Books","add-book":"Add a Book","my-books":"My Books","my-borrows":"My Borrows","my-profile":"My Profile",login:"Log In",register:"Join the Nook"} as Record<string,string>)[last||""]||"Book Details";document.title=`BookNook | ${name}`},[path]);return null}
