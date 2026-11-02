"use client";
import {useState} from "react";
import {ImageUp,LoaderCircle} from "lucide-react";
import {toast} from "sonner";

const key=process.env.NEXT_PUBLIC_IMGBB_API_KEY;

export function BookImageUpload({defaultValue="",showUrlInput=true}:{defaultValue?:string;showUrlInput?:boolean}){
  const[url,setUrl]=useState(defaultValue),[uploading,setUploading]=useState(false),[editUrl,setEditUrl]=useState(false);
  async function upload(file?:File){
    if(!file)return;
    if(!key){toast.error("Add NEXT_PUBLIC_IMGBB_API_KEY to enable uploads, or paste a cover URL below.");return}
    if(!file.type.startsWith("image/")){toast.error("Choose an image file.");return}
    if(file.size>32*1024*1024){toast.error("Choose an image smaller than 32 MB.");return}
    setUploading(true);
    try{
      const data=new FormData();data.append("image",file);
      const response=await fetch(`https://api.imgbb.com/1/upload?key=${key}`,{method:"POST",body:data});
      const result=await response.json();
      if(!response.ok||!result.success||!result.data?.url)throw new Error(result.error?.message||"The image upload failed.");
      setUrl(result.data.url);setEditUrl(false);toast.success("Cover uploaded.");
    }catch(error){toast.error(error instanceof Error?error.message:"The image upload failed.")}
    finally{setUploading(false)}
  }
  return <div className="image-field">
    <div className="upload-control"><label className="upload-button"><input type="file" accept="image/*" disabled={uploading} onChange={e=>upload(e.target.files?.[0])}/>{uploading?<LoaderCircle className="spin-icon" size={16}/>:<ImageUp size={16}/>}<span>{uploading?"Uploading cover...":url?"Upload a different cover":"Upload a cover image"}</span></label><small>PNG, JPG or WebP  ( max 32 MB</small></div>
    {showUrlInput||editUrl?<input name="image" type="url" required value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste a direct image URL"/>:<input type="hidden" name="image" value={url}/>}
    {!showUrlInput&&<button className="button button-outline" type="button" onClick={()=>setEditUrl(value=>!value)}>{editUrl?"Hide image URL field":"Enter image URL instead"}</button>}
    {url&&<img className="upload-preview" src={url} alt="Current book cover preview"/>}
  </div>
}