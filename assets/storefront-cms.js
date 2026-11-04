(function(){
"use strict";
const API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api",KEY="sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
const $=(s,r=document)=>r.querySelector(s);
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const safeHref=v=>{const s=String(v||"");return s.startsWith("/fashionstore/")||s.startsWith("#")||/^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(s)?s:"#";};
const safeImage=v=>{const s=String(v||"");return /^https:\/\//i.test(s)||s.startsWith("/fashionstore/assets/")?s:"";};
const link=(label,href)=>{const a=make("a","",label);a.href=safeHref(href);return a;};
function addCollections(items){
 if(!items?.length||$("#forme-cms-collections"))return;
 const section=make("section","f-section");section.id="forme-cms-collections";
 const wrap=make("div","f-container"),head=make("div","f-section-head"),copy=make("div");
 copy.append(make("span","f-kicker","THE FORME EDIT"),make("h2","","Explore collections"));head.append(copy);wrap.append(head);
 const grid=make("div","p2-public-grid");
 items.forEach(c=>{const a=link("", "/fashionstore/collections/?slug="+encodeURIComponent(c.slug));a.className="p2-public-card";const src=safeImage(c.image_url);if(src){const img=make("img");img.src=src;img.alt=c.name;img.loading="lazy";a.append(img);}a.append(make("span","",String(c.audience||c.season||"FORME").toUpperCase()),make("strong","",c.name),make("p","",c.description||"Explore this curated edit."),make("b","","Discover ↗"));grid.append(a);});
 wrap.append(grid);section.append(wrap);const cat=$("#f-categories");if(cat?.parentNode)cat.parentNode.insertBefore(section,cat.nextSibling);
}
function addJournal(posts){
 if(!posts?.length||$("#forme-cms-journal"))return;
 const section=make("section","f-section");section.id="forme-cms-journal";
 const wrap=make("div","f-container"),head=make("div","f-section-head"),copy=make("div");
 copy.append(make("span","f-kicker","STYLE NOTES & STORIES"),make("h2","","The FORME Journal"));head.append(copy,link("Read all stories ↗","/fashionstore/journal/"));wrap.append(head);
 const grid=make("div","p2-public-grid");
 posts.slice(0,3).forEach(p=>{const a=link("", "/fashionstore/journal/article.html?slug="+encodeURIComponent(p.slug));a.className="p2-public-card";const src=safeImage(p.cover_image_url);if(src){const img=make("img");img.src=src;img.alt=p.title;img.loading="lazy";a.append(img);}a.append(make("span","",p.category||"FORME Journal"),make("strong","",p.title),make("p","",p.excerpt||""),make("b","","Read story ↗"));grid.append(a);});
 wrap.append(grid);section.append(wrap);const footer=$("#f-footer");if(footer?.parentNode)footer.parentNode.insertBefore(section,footer);
}
function addSections(sections){
 (sections||[]).filter(s=>s.page_slug==="home").forEach(s=>{
  const c=s.content||{},section=make("section","f-section p2-editorial-section"),wrap=make("div","f-container"),copy=make("div","p2-editorial-copy");
  copy.append(make("span","f-kicker","FROM FORME"),make("h2","",s.title));
  if(c.body)copy.append(make("p","",c.body));if(c.cta_label)copy.append(link(c.cta_label,c.cta_href));
  if(c.image_url&&safeImage(c.image_url)){const im=make("img","p2-editorial-image");im.src=safeImage(c.image_url);im.alt=s.title;wrap.append(im);}
  wrap.append(copy);section.append(wrap);const footer=$("#f-footer");if(footer?.parentNode)footer.parentNode.insertBefore(section,footer);
 });
}
async function init(){
 try{
  const res=await fetch(API+"?action=public-content",{cache:"no-store",headers:{apikey:KEY,Accept:"application/json"}});
  const d=await res.json();if(!res.ok||!d.ok)return;
  const s=d.site||{},announcement=$(".f-announcement");
  if(announcement){announcement.hidden=s.announcement_enabled===false;if(s.announcement_text)announcement.textContent=s.announcement_text;}
  const eyebrow=$(".f-hero .f-eyebrow"),title=$(".f-hero h1"),body=$(".f-hero .f-hero-content p"),buttons=$(".f-hero-buttons"),hero=$(".f-hero");
  if(eyebrow&&s.hero_eyebrow)eyebrow.textContent=s.hero_eyebrow;if(title&&s.hero_title)title.textContent=s.hero_title;if(body&&s.hero_body)body.textContent=s.hero_body;
  if(buttons){const a=buttons.querySelector("a:first-child"),b=buttons.querySelector("a:nth-child(2)");if(a){a.textContent=s.hero_primary_label||a.textContent;a.href=safeHref(s.hero_primary_href);}if(b){b.textContent=s.hero_secondary_label||b.textContent;b.href=safeHref(s.hero_secondary_href);}}
  if(hero&&safeImage(s.hero_image_url))hero.style.backgroundImage="linear-gradient(90deg,rgba(20,28,23,.56),rgba(20,28,23,.08)),url('"+safeImage(s.hero_image_url).replace(/'/g,"%27")+"')";
  if(s.meta_title)document.title=s.meta_title;const meta=$('meta[name="description"]');if(meta&&s.meta_description)meta.content=s.meta_description;
  const foot=$(".f-footer-about p");if(foot&&s.footer_about)foot.textContent=s.footer_about;
  const nav=$(".f-nav");(d.navigation||[]).forEach(n=>{if(!nav)return;const exists=[...nav.querySelectorAll("a")].some(a=>a.textContent.trim().toLowerCase()===String(n.label).toLowerCase()||a.getAttribute("href")===n.href);if(!exists){const a=link(n.label,n.href);a.className="p2-cms-nav-link";nav.append(a);}});
  addSections(d.sections||[]);addCollections(d.collections||[]);addJournal(d.blogPosts||[]);
 }catch(e){console.warn("FORME CMS enhancement unavailable",e);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();