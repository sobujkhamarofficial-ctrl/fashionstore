(function(){
"use strict";
const API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
const AUTH="https://zfgcovvfczjiqagrnfjr.supabase.co/auth/v1";
const KEY="sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
const ACCESS="forme-admin-access",REFRESH="forme-admin-refresh";
const $=id=>document.getElementById(id);
let orders=[],selected=null,activeFilter="all";
const money=n=>"৳"+Number(n||0).toLocaleString("en-BD");
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const token=()=>sessionStorage.getItem(ACCESS)||"";
function message(id,text,ok){const el=$(id);el.textContent=text;el.classList.toggle("ok",!!ok);}
async function authRequest(path,body){const res=await fetch(AUTH+path,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify(body)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.msg||data.message||data.error_description||"Sign-in failed. Check your details.");return data;}
async function saveSession(data){if(!data.access_token||!data.refresh_token)throw new Error("Authentication did not return a valid session.");sessionStorage.setItem(ACCESS,data.access_token);sessionStorage.setItem(REFRESH,data.refresh_token);}
function clearSession(){sessionStorage.removeItem(ACCESS);sessionStorage.removeItem(REFRESH);}
async function adminRequest(payload,allowRefresh=true){
 const headers={"Content-Type":"application/json","apikey":KEY};if(token())headers.Authorization="Bearer "+token();
 const res=await fetch(API,{method:"POST",headers,body:JSON.stringify({action:"admin",...payload})});
 const data=await res.json().catch(()=>({}));
 if(res.status===401&&allowRefresh&&sessionStorage.getItem(REFRESH)){
   try{const refreshed=await authRequest("/token?grant_type=refresh_token",{refresh_token:sessionStorage.getItem(REFRESH)});await saveSession(refreshed);return adminRequest(payload,false);}catch(_){clearSession();}
 }
 if(!res.ok||!data.ok)throw new Error(data.error||"The admin request could not be completed.");
 return data;
}
function showAuth(){ $("fa-auth").hidden=false;$("fa-dashboard").hidden=true; }
function showDashboard(){ $("fa-auth").hidden=true;$("fa-dashboard").hidden=false; }
function date(value){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?"—":d.toLocaleString("en-BD",{dateStyle:"medium",timeStyle:"short"});}
function statusLabel(value){return String(value||"pending_review").replaceAll("_"," ");}
function alertBox(text){const el=$("fa-alert");el.textContent=text;el.hidden=!text;}
function renderStats(stats){$("fa-stat-total").textContent=Number(stats.total||0).toLocaleString("en-BD");$("fa-stat-awaiting").textContent=Number(stats.awaiting||0).toLocaleString("en-BD");$("fa-stat-active").textContent=Number(stats.active||0).toLocaleString("en-BD");$("fa-stat-delivered").textContent=Number(stats.delivered||0).toLocaleString("en-BD");$("fa-stat-paid").textContent=money(stats.paidBdt);}
function visibleOrders(){const q=$("fa-search").value.trim().toLowerCase(),f=$("fa-filter").value;return orders.filter(o=>(f==="all"||o.status===f)&&(!q||[o.order_number,o.customer_name,o.customer_phone,o.customer_email].some(v=>String(v||"").toLowerCase().includes(q))));}
function renderOrders(){
 const rows=visibleOrders();$("fa-order-count").textContent=rows.length+" records";$("fa-order-rows").innerHTML=rows.map(o=>{
 const items=Array.isArray(o.store_order_items)?o.store_order_items:[];
 return '<tr><td><strong>'+esc(o.order_number)+'</strong><small>'+esc(date(o.created_at))+'</small></td><td><strong>'+esc(o.customer_name)+'</strong><small>'+esc(o.customer_phone)+'</small></td><td>'+esc(date(o.created_at))+'</td><td>'+items.reduce((n,x)=>n+Number(x.quantity||0),0)+' units</td><td><strong>'+money(o.subtotal_bdt)+'</strong></td><td><span class="fa-status '+esc(o.status)+'">'+esc(statusLabel(o.status))+'</span></td><td><button class="fa-view" type="button" data-view="'+esc(o.id)+'">View & manage ↗</button></td></tr>';
 }).join("");
 $("fa-empty").hidden=rows.length!==0;$("fa-order-rows").parentElement.hidden=rows.length===0;
}
async function loadOrders(){
 $("fa-refresh").disabled=true;alertBox("");
 try{const data=await adminRequest({operation:"list"});orders=Array.isArray(data.orders)?data.orders:[];renderStats(data.stats||{});$("fa-welcome").textContent=(data.user&&data.user.email?data.user.email:"Admin")+" · Private order workspace";renderOrders();}
 catch(e){alertBox(e.message||"Could not load orders.");if(!token())showAuth();}
 finally{$("fa-refresh").disabled=false;}
}
function option(value,current,label){return '<option value="'+esc(value)+'" '+(value===current?"selected":"")+'>'+esc(label)+'</option>';}
function openOrder(id){
 selected=orders.find(o=>o.id===id);if(!selected)return;
 const o=selected,items=Array.isArray(o.store_order_items)?o.store_order_items:[];
 $("fa-detail-title").textContent=o.order_number||"Order";
 const card=(label,value)=>'<div class="fa-detail-card"><span>'+esc(label)+'</span><strong>'+esc(value||"—")+'</strong></div>';
 const itemHtml=items.map(i=>'<div class="fa-line-item"><div><strong>'+esc(i.product_name)+'</strong><small>'+esc(i.requested_variant||"Standard variant")+' · Qty '+Number(i.quantity||0)+'</small></div><strong>'+money(i.line_total_bdt)+'</strong></div>').join("");
 $("fa-detail-content").innerHTML=
 '<div class="fa-detail-grid">'+card("Customer",o.customer_name)+card("Phone",o.customer_phone)+card("Email",o.customer_email)+card("Placed",date(o.created_at))+card("District / area",[o.district,o.area].filter(Boolean).join(", "))+card("Delivery address",o.delivery_address)+card("Customer note",o.customer_note)+card("Item subtotal",money(o.subtotal_bdt))+'</div>'+
 '<section class="fa-detail-section"><h3>Items in this request</h3>'+itemHtml+'</section>'+
 '<section class="fa-detail-section"><h3>Operations & fulfilment</h3><form id="fa-edit-form" class="fa-edit-grid">'+
 '<label>Order status<select name="status">'+["pending_review","contacted","confirmed","processing","shipped","delivered","cancelled","rejected"].map(v=>option(v,o.status,statusLabel(v))).join("")+'</select></label>'+
 '<label>Price verification<select name="price_verification">'+option("needs_manual_confirmation",o.price_verification,"Needs manual confirmation")+option("verified",o.price_verification,"Verified")+'</select></label>'+
 '<label>Delivery charge (BDT)<input name="delivery_charge_bdt" type="number" min="0" step="1" value="'+esc(o.delivery_charge_bdt??"")+'" placeholder="Enter delivery charge"></label>'+
 '<label>Final total (BDT)<input name="final_total_bdt" type="number" min="0" step="1" value="'+esc(o.final_total_bdt??"")+'" placeholder="Subtotal + delivery"></label>'+
 '<label>Payment method<select name="payment_method">'+[["to_be_confirmed","To be confirmed"],["cash_on_delivery","Cash on delivery"],["manual_transfer","Manual transfer"],["online_gateway","Online gateway"]].map(([v,l])=>option(v,o.payment_method,l)).join("")+'</select></label>'+
 '<label>Payment status<select name="payment_status">'+[["not_collected","Not collected"],["pending","Pending"],["paid","Paid"],["refunded","Refunded"],["failed","Failed"]].map(([v,l])=>option(v,o.payment_status,l)).join("")+'</select></label>'+
 '<label>Courier name<input name="courier_name" maxlength="100" value="'+esc(o.courier_name||"")+'"></label>'+
 '<label>Tracking number<input name="courier_tracking_number" maxlength="120" value="'+esc(o.courier_tracking_number||"")+'"></label>'+
 '<label class="wide">Estimated delivery date<input name="estimated_delivery_at" type="datetime-local" value="'+esc(o.estimated_delivery_at?new Date(o.estimated_delivery_at).toISOString().slice(0,16):"")+'"></label>'+
 '<label class="wide">Internal admin note<textarea name="internal_note" maxlength="1000">'+esc(o.internal_note||"")+'</textarea></label>'+
 '<div class="fa-save-row wide"><button class="fa-primary" type="submit">Save order updates <span>↗</span></button></div><p id="fa-edit-message" class="fa-message wide" role="status"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
}
function closeOrder(){$("fa-modal").hidden=true;document.body.style.overflow="";}
$("fa-login-form").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,data=new FormData(form),button=form.querySelector("button[type=submit]");button.disabled=true;message("fa-login-message","Signing in…",false);try{const session=await authRequest("/token?grant_type=password",{email:String(data.get("email")).trim(),password:String(data.get("password"))});await saveSession(session);await loadOrders();if(!$("fa-dashboard").hidden)message("fa-login-message","",true);}catch(err){clearSession();message("fa-login-message",err.message,false);}finally{button.disabled=false;}});
$("fa-setup-form").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,data=new FormData(form),button=form.querySelector("button[type=submit]");button.disabled=true;message("fa-setup-message","Creating the first administrator…",false);try{await adminRequest({operation:"bootstrap",bootstrap_token:String(data.get("bootstrap_token")).trim(),full_name:String(data.get("full_name")).trim(),email:String(data.get("email")).trim(),password:String(data.get("password"))},false);document.querySelector('.fa-auth-tabs [data-auth-tab="login"]').click();$("fa-login-form").elements.email.value=String(data.get("email")).trim();$("fa-login-form").elements.password.value=String(data.get("password"));message("fa-login-message","Admin account created. Sign in with the same email and password.",true);message("fa-setup-message","One-time setup is complete.",true);}catch(err){message("fa-setup-message",err.message,false);}finally{button.disabled=false;}});
document.querySelectorAll("[data-auth-tab]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b===btn));$("fa-login-form").hidden=btn.dataset.authTab!=="login";$("fa-setup-form").hidden=btn.dataset.authTab!=="setup";}));
$("fa-refresh").addEventListener("click",loadOrders);$("fa-search").addEventListener("input",renderOrders);$("fa-filter").addEventListener("change",renderOrders);
$("fa-order-rows").addEventListener("click",e=>{const btn=e.target.closest("[data-view]");if(btn)openOrder(btn.dataset.view);});
$("fa-modal").addEventListener("click",e=>{if(e.target.closest("[data-close-modal]"))closeOrder();});
$("fa-detail-content").addEventListener("submit",async e=>{if(e.target.id!=="fa-edit-form")return;e.preventDefault();if(!selected)return;const form=e.target,data=new FormData(form),fields={};for(const key of ["status","price_verification","payment_method","payment_status","courier_name","courier_tracking_number","internal_note"])fields[key]=String(data.get(key)||"").trim()||null;for(const key of ["delivery_charge_bdt","final_total_bdt"])fields[key]=data.get(key)===""?null:Number(data.get(key));const delivery=data.get("estimated_delivery_at");fields.estimated_delivery_at=delivery?new Date(delivery).toISOString():null;const button=form.querySelector("button[type=submit]");button.disabled=true;message("fa-edit-message","Saving order changes…",false);try{const result=await adminRequest({operation:"update",order_id:selected.id,fields});orders=orders.map(o=>o.id===selected.id?{...o,...result.order}:o);renderOrders();renderStats(await adminRequest({operation:"list"}).then(d=>d.stats||{}));selected=orders.find(o=>o.id===selected.id);openOrder(selected.id);message("fa-edit-message","Order updated successfully.",true);}catch(err){message("fa-edit-message",err.message,false);}finally{button.disabled=false;}});
$("fa-logout").addEventListener("click",async()=>{const t=token();try{if(t)await fetch(AUTH+"/logout",{method:"POST",headers:{"apikey":KEY,"Authorization":"Bearer "+t}});}catch(_){}clearSession();orders=[];closeOrder();showAuth();$("fa-login-form").reset();});
(async()=>{if(!token()&&sessionStorage.getItem(REFRESH)){try{const d=await authRequest("/token?grant_type=refresh_token",{refresh_token:sessionStorage.getItem(REFRESH)});await saveSession(d);}catch(_){clearSession();}}if(token()){showDashboard();await loadOrders();}else showAuth();})();
})();