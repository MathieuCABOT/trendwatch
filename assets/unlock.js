
(function(){
'use strict';
const env=JSON.parse(document.getElementById('tw-enc').textContent);
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const toB64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf)));
async function deriveKey(pass){const enc=new TextEncoder();
  const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(env.salt),iterations:env.iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},true,['decrypt']);}
async function decrypt(key){const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(env.iv)},key,b64(env.ct));return new TextDecoder().decode(pt);}
async function storedKey(){const raw=sessionStorage.getItem('tw-key')||localStorage.getItem('tw-key');if(!raw)return null;
  try{return await crypto.subtle.importKey('raw',b64(raw),'AES-GCM',true,['decrypt']);}catch(e){return null;}}
/* Replace the shell with the clear page WITHOUT document.write: parse the HTML, swap the root
   element (the document keeps standards mode and its scroll state is reset), then re-create the
   scripts so they run -- nodes coming from DOMParser never execute on their own. */
function show(html){const doc=new DOMParser().parseFromString(html,'text/html');
  const fresh=document.importNode(doc.documentElement,true);
  document.replaceChild(fresh,document.documentElement);
  fresh.querySelectorAll('script').forEach(old=>{const s=document.createElement('script');
    for(const a of old.attributes)s.setAttribute(a.name,a.value);
    if(!old.src)s.textContent=old.textContent;s.async=false;old.replaceWith(s);});
  window.scrollTo(0,0);}
async function tryStored(){const key=await storedKey();if(!key)return false;try{show(await decrypt(key));return true;}catch(e){sessionStorage.removeItem('tw-key');localStorage.removeItem('tw-key');return false;}}
const form=document.getElementById('lock'),err=document.getElementById('err'),pass=document.getElementById('pass');
form.style.visibility='hidden';
tryStored().then(ok=>{if(!ok){form.style.visibility='visible';pass.focus();}});
const FRL=document.documentElement.lang==='fr';
form.addEventListener('submit',async e=>{e.preventDefault();err.textContent='';const btn=form.querySelector('button');btn.disabled=true;btn.textContent=FRL?'Déverrouillage…':'Unlocking…';
  try{const key=await deriveKey(pass.value);const html=await decrypt(key);const raw=toB64(await crypto.subtle.exportKey('raw',key));
    (document.getElementById('remember').checked?localStorage:sessionStorage).setItem('tw-key',raw);show(html);}
  catch(x){err.textContent=FRL?'Phrase secrète incorrecte.':'Wrong passphrase.';btn.disabled=false;btn.textContent=FRL?'Déverrouiller':'Unlock';pass.select();}});
})();
