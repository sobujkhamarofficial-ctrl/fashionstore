(function(){
"use strict";
const API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
const KEY="sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
const ADMIN_EMAIL="sobujkhamar.official@gmail.com";
const ACCESS="forme-admin-access";
const $=id=>document.getElementById(id);
let orders=[],selected=null,products=[],selectedProduct=null,messages=[],selectedMessage=null,activeTab="orders",productsLoaded=false,messagesLoaded=false;
const money=n=>"৳"+Number(n||0).toLocaleString("en-BD");
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const token=()=>sessionStorage.getItem(ACCESS)||"";
function message(id,text,ok){const el=$(id);el.textContent=text;el.classList.toggle("ok",!!ok);}
function saveSession(data){
 if(!data||typeof data.access_token!=="string"||!/^[0-9a-f]{64}$/i.test(data.access_token))throw new Error("The server did not return a valid admin session.");
 sessionStorage.setItem(ACCESS,data.access_token);
}
function clearSession(){sessionStorage.removeItem(ACCESS);}
async function adminRequest(payload){
 const headers={"Content-Type":"application/json","apikey":KEY};
 if(token() && payload.operation !== "login")headers.Authorization="Bearer "+token();
 const res=await fetch(API,{method:"POST",headers,body:JSON.stringify({action:"admin",...payload})});
 const data=await res.json().catch(()=>({}));
 if(res.status===401){clearSession();showAuth();}
 if(!res.ok||!data.ok)throw new Error(data.error||"The admin request could not be completed.");
 return data;
}
function showAuth(){ const auth=$("fa-auth"),dashboard=$("fa-dashboard");auth.hidden=false;auth.style.display="grid";dashboard.hidden=true;dashboard.style.display="none"; }
function showDashboard(){ const auth=$("fa-auth"),dashboard=$("fa-dashboard");auth.hidden=true;auth.style.display="none";dashboard.hidden=false;dashboard.style.display="block"; }
function date(value){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?"—":d.toLocaleString("en-BD",{dateStyle:"medium",timeStyle:"short"});}
function statusLabel(value){return String(value||"pending_review").replaceAll("_"," ");}
function alertBox(text){const el=$("fa-alert");el.textContent=text;el.hidden=!text;}
function renderStats(stats){$("fa-stat-total").textContent=Number(stats.total||0).toLocaleString("en-BD");$("fa-stat-awaiting").textContent=Number(stats.awaiting||0).toLocaleString("en-BD");$("fa-stat-active").textContent=Number(stats.active||0).toLocaleString("en-BD");$("fa-stat-delivered").textContent=Number(stats.delivered||0).toLocaleString("en-BD");$("fa-stat-paid").textContent=money(stats.paidBdt);}
function visibleOrders(){const q=$("fa-search").value.trim().toLowerCase(),f=$("fa-filter").value;return orders.filter(o=>(f==="all"||o.status===f)&&(!q||[o.order_number,o.customer_name,o.customer_phone,o.customer_email].some(v=>String(v||"").toLowerCase().includes(q))));}
function renderOrders(){
 const rows=visibleOrders();$("fa-order-count").textContent=rows.length+" records";$("fa-order-rows").innerHTML=rows.map(o=>{
 const items=Array.isArray(o.store_order_items)?o.store_order_items:[];
 const method=o.payment_method==="cash_on_delivery"?"Cash on delivery":String(o.payment_method||"Not set").replaceAll("_"," ");
 const paid=String(o.payment_status||"not collected").replaceAll("_"," ");
  const catalogue=o.order_kind==="catalogue_request";
  const shownSubtotal=catalogue&&Number(o.subtotal_bdt)===0?"Price to be confirmed":money(o.subtotal_bdt);
 return '<tr><td><strong>'+esc(o.order_number)+'</strong><small>'+esc(date(o.created_at))+'</small></td><td><strong>'+esc(o.customer_name)+'</strong><small>'+esc(o.customer_phone)+'</small></td><td>'+esc(date(o.created_at))+'</td><td>'+items.reduce((n,x)=>n+Number(x.quantity||0),0)+' units</td><td><strong>'+money(o.subtotal_bdt)+'</strong></td><td><span class="fa-payment">'+esc(method)+'</span><small>'+esc(paid)+'</small></td><td><span class="fa-status '+esc(o.status)+'">'+esc(statusLabel(o.status))+'</span></td><td><button class="fa-view" type="button" data-view="'+esc(o.id)+'">View & manage ↗</button></td></tr>';
 }).join("");
 $("fa-empty").hidden=rows.length!==0;$("fa-order-rows").parentElement.hidden=rows.length===0;
}
function visibleProducts(){
 const q=$("fa-product-search").value.trim().toLowerCase(),filter=$("fa-product-filter").value;
 return products.filter(p=>(filter==="all"||p.availability_status===filter)&&(!q||[p.id,p.name,p.category].some(v=>String(v||"").toLowerCase().includes(q))));
}
function renderProducts(){
 const rows=visibleProducts();
 $("fa-product-count").textContent=rows.length+" of "+products.length+" products";
 $("fa-product-rows").innerHTML=rows.map(p=>{
  const status=String(p.availability_status||"needs_confirmation").replaceAll("_"," ");
  const verification=p.details_verified?"Verified":"Needs verification";
  return '<tr><td><strong>'+esc(p.name)+'</strong><small>'+esc(p.id)+'</small></td><td>'+esc(p.category)+'</td><td><strong>'+money(p.price_bdt)+'</strong></td><td><span class="fa-status '+esc(p.availability_status)+'">'+esc(status)+'</span></td><td><span class="fa-payment">'+esc(verification)+'</span></td><td><button class="fa-view" type="button" data-product-edit="'+esc(p.id)+'">Edit product ↗</button></td></tr>';
 }).join("");
 $("fa-product-empty").hidden=rows.length!==0;
 $("fa-product-rows").parentElement.hidden=rows.length===0;
}
async function loadProducts(){
 alertBox("");
 try{
  const result=await adminRequest({operation:"products"});
  products=Array.isArray(result.products)?result.products:[];
  productsLoaded=true;
  renderProducts();
 }catch(error){alertBox(error.message);}
}
function visibleMessages(){
 const q=$("fa-message-search").value.trim().toLowerCase(),filter=$("fa-message-filter").value;
 return messages.filter(m=>(filter==="all"||m.status===filter)&&(!q||[m.name,m.email,m.phone,m.subject,m.message].some(v=>String(v||"").toLowerCase().includes(q))));
}
function renderMessages(){
 const rows=visibleMessages();$("fa-message-count").textContent=rows.length+" of "+messages.length+" messages";
 $("fa-message-rows").innerHTML=rows.map(m=>'<tr><td><strong>'+esc(m.name)+'</strong><small>'+esc(m.phone||m.email||"No contact supplied")+'</small></td><td>'+esc(m.subject)+'</td><td class="fa-message-preview">'+esc(m.message)+'</td><td>'+esc(date(m.created_at))+'</td><td><span class="fa-status '+esc(m.status)+'">'+esc(statusLabel(m.status||"new"))+'</span></td><td><button class="fa-view" type="button" data-message-view="'+esc(m.id)+'">Open ↗</button></td></tr>').join("");
 $("fa-message-empty").hidden=rows.length!==0;$("fa-message-rows").parentElement.hidden=rows.length===0;
}
async function loadMessages(){
 alertBox("");
 try{const result=await adminRequest({operation:"messages"});messages=Array.isArray(result.messages)?result.messages:[];messagesLoaded=true;renderMessages();}
 catch(error){alertBox(error.message);}
}
function showTab(tab){
 activeTab=tab;
 const tabs={orders:$("fa-orders-tab"),products:$("fa-products-tab"),messages:$("fa-messages-tab")};
 const panels={orders:$("fa-orders-panel"),products:$("fa-products-panel"),messages:$("fa-messages-panel")};
 Object.keys(tabs).forEach(key=>{const active=key===tab;tabs[key].classList.toggle("active",active);tabs[key].setAttribute("aria-selected",String(active));panels[key].hidden=!active;});
 if(tab==="products"&&!productsLoaded)void loadProducts();
 if(tab==="messages"&&!messagesLoaded)void loadMessages();
}
function openMessage(id){
 selectedMessage=messages.find(m=>m.id===id);if(!selectedMessage)return;
 const m=selectedMessage;
 $("fa-detail-title").textContent="Customer message";
 $("fa-detail-content").innerHTML=
  '<div class="fa-detail-grid"><article class="fa-detail-card"><span>Customer</span><strong>'+esc(m.name)+'</strong><p>'+esc(m.phone||"")+'</p><p>'+esc(m.email||"")+'</p></article>'+
  '<article class="fa-detail-card"><span>Received</span><strong>'+esc(date(m.created_at))+'</strong><p>'+esc(m.subject)+'</p></article></div>'+
  '<section class="fa-detail-section"><h3>Message</h3><p class="fa-message-body">'+esc(m.message)+'</p></section>'+
  '<section class="fa-detail-section"><h3>Follow-up status</h3><form id="fa-message-edit-form" class="fa-edit-grid"><label>Status<select name="status">'+[["new","New"],["in_progress","In progress"],["resolved","Resolved"],["spam","Spam"]].map(([v,l])=>option(v,m.status||"new",l)).join("")+'</select></label><div class="fa-save-row"><button class="fa-primary" type="submit">Save status <span>↗</span></button></div><p id="fa-message-edit-message" class="fa-message wide" role="status" aria-live="polite"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
}
function openProduct(id){
 selectedProduct=products.find(p=>p.id===id);
 if(!selectedProduct)return;
 const p=selectedProduct;
 $("fa-detail-title").textContent="Edit catalogue product";
 $("fa-detail-content").innerHTML=
  '<section class="fa-detail-section"><p class="fa-product-editor-note">Check the physical item and source information before setting it to verified. This updates the live storefront catalogue.</p>'+
  '<form id="fa-product-edit-form" class="fa-edit-grid">'+
  '<label class="wide">Product name<input name="name" maxlength="180" required value="'+esc(p.name)+'"></label>'+
  '<label>Category<input name="category" maxlength="120" required value="'+esc(p.category)+'"></label>'+
  '<label>Current selling price (BDT)<input name="price_bdt" type="number" min="1" step="1" required value="'+esc(p.price_bdt)+'"></label>'+
  '<label>Compare-at price (BDT)<input name="compare_at_price_bdt" type="number" min="0" step="1" value="'+esc(p.compare_at_price_bdt??"")+'"></label>'+
  '<label class="wide">Product image URL<input name="image_url" maxlength="1000" required value="'+esc(p.image_url||"")+'"><small>Use an Unsplash photo URL or a FORME-hosted product photo.</small></label>'+
  '<label class="wide">Description<textarea name="description" maxlength="2000" required>'+esc(p.description||"")+'</textarea></label>'+
  '<label>Availability<select name="availability_status">'+["needs_confirmation","in_stock","out_of_stock","preorder","archived"].map(v=>option(v,p.availability_status,v.replaceAll("_"," "))).join("")+'</select></label>'+
  '<label class="fa-checkline"><input type="checkbox" name="is_active" '+(p.is_active?"checked":"")+'> Visible in the catalogue</label>'+
  '<label class="fa-checkline"><input type="checkbox" name="details_verified" '+(p.details_verified?"checked":"")+'> Product details verified</label>'+
  '<div class="fa-save-row wide"><button class="fa-primary" type="submit">Save product <span>↗</span></button></div>'+
  '<p id="fa-product-edit-message" class="fa-message wide" role="status" aria-live="polite"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
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
  const catalogue=o.order_kind==="catalogue_request";
 $("fa-detail-title").textContent=o.order_number||"Order";
 const card=(label,value)=>'<div class="fa-detail-card"><span>'+esc(label)+'</span><strong>'+esc(value||"—")+'</strong></div>';
 const itemHtml=items.map(i=>'<div class="fa-line-item"><div><strong>'+esc(i.product_name)+'</strong><small>'+esc(i.requested_variant||"Variant to be confirmed")+' · Qty '+Number(i.quantity||0)+'</small></div><strong>'+(catalogue?"Price to be confirmed":money(i.line_total_bdt))+'</strong></div>').join("");
  const quoteNotice=catalogue?'<p class="fa-note wide">Catalogue request: contact the customer to confirm the exact product, price, size and stock. Enter the agreed amount and delivery charge before confirming.</p>':"";
 $("fa-detail-content").innerHTML=
 '<div class="fa-detail-grid">'+card("Request type",catalogue?"Catalogue style request":"Product order")+card("Customer",o.customer_name)+card("Phone",o.customer_phone)+card("Email",o.customer_email)+card("Placed",date(o.created_at))+card("District / area",[o.district,o.area].filter(Boolean).join(", "))+card("Delivery address",o.delivery_address)+card("Customer note",o.customer_note)+card("Item subtotal",catalogue&&Number(o.subtotal_bdt)===0?"Price to be confirmed":money(o.subtotal_bdt))+card("Payment method",o.payment_method==="cash_on_delivery"?"Cash on delivery":String(o.payment_method||"—").replaceAll("_"," "))+card("Payment status",String(o.payment_status||"not collected").replaceAll("_"," "))+card("Delivery charge",o.delivery_charge_bdt===null?"To be confirmed":money(o.delivery_charge_bdt))+card("Final total",o.final_total_bdt===null?"To be confirmed":money(o.final_total_bdt))+'</div>'+
 '<section class="fa-detail-section"><h3>Items in this request</h3>'+itemHtml+quoteNotice+'</section>'+
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
$("fa-login-form").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,data=new FormData(form),button=form.querySelector("button[type=submit]");button.disabled=true;message("fa-login-message","Checking your access…",false);try{const email=String(data.get("email")||"").trim().toLowerCase();if(email!==ADMIN_EMAIL)throw new Error("Only the authorised owner email can sign in.");const session=await adminRequest({operation:"login",email,password:String(data.get("password")||"")});saveSession(session);form.reset();message("fa-login-message","",true);showDashboard();void loadOrders();}catch(err){clearSession();showAuth();message("fa-login-message",err.message,false);}finally{button.disabled=false;}});

$("fa-refresh").addEventListener("click",()=>activeTab==="orders"?loadOrders():activeTab==="products"?loadProducts():loadMessages());$("fa-search").addEventListener("input",renderOrders);$("fa-filter").addEventListener("change",renderOrders);
$("fa-orders-tab").addEventListener("click",()=>showTab("orders"));$("fa-products-tab").addEventListener("click",()=>showTab("products"));$("fa-messages-tab").addEventListener("click",()=>showTab("messages"));
$("fa-product-search").addEventListener("input",renderProducts);$("fa-product-filter").addEventListener("change",renderProducts);
$("fa-message-search").addEventListener("input",renderMessages);$("fa-message-filter").addEventListener("change",renderMessages);
$("fa-message-rows").addEventListener("click",e=>{const btn=e.target.closest("[data-message-view]");if(btn)openMessage(btn.dataset.messageView);});
$("fa-product-rows").addEventListener("click",e=>{const btn=e.target.closest("[data-product-edit]");if(btn)openProduct(btn.dataset.productEdit);});
$("fa-order-rows").addEventListener("click",e=>{const btn=e.target.closest("[data-view]");if(btn)openOrder(btn.dataset.view);});
$("fa-modal").addEventListener("click",e=>{if(e.target.closest("[data-close-modal]"))closeOrder();});
$("fa-detail-content").addEventListener("submit",async e=>{
 if(e.target.id!=="fa-message-edit-form")return;
 e.preventDefault();if(!selectedMessage)return;
 const form=e.target,status=String(new FormData(form).get("status")||"new"),button=form.querySelector('button[type="submit"]');
 button.disabled=true;message("fa-message-edit-message","Saving message status…",false);
 try{
  const result=await adminRequest({operation:"message-update",message_id:selectedMessage.id,status});
  messages=messages.map(m=>m.id===selectedMessage.id?{...m,...result.message}:m);selectedMessage=result.message;renderMessages();message("fa-message-edit-message","Message status updated.",true);
 }catch(err){message("fa-message-edit-message",err.message,false);}
 finally{button.disabled=false;}
});
$("fa-detail-content").addEventListener("submit",async e=>{
 if(e.target.id!=="fa-product-edit-form")return;
 e.preventDefault();if(!selectedProduct)return;
 const form=e.target,data=new FormData(form);
 const fields={
  name:String(data.get("name")||"").trim(),category:String(data.get("category")||"").trim(),
  description:String(data.get("description")||"").trim(),price_bdt:Number(data.get("price_bdt")),
  compare_at_price_bdt:data.get("compare_at_price_bdt")===""?null:Number(data.get("compare_at_price_bdt")),
  image_url:String(data.get("image_url")||"").trim(),availability_status:String(data.get("availability_status")||"needs_confirmation"),
  is_active:form.elements.is_active.checked,details_verified:form.elements.details_verified.checked
 };
 const button=form.querySelector('button[type="submit"]');button.disabled=true;message("fa-product-edit-message","Saving product changes…",false);
 try{
  const result=await adminRequest({operation:"product-update",product_id:selectedProduct.id,fields});
  products=products.map(p=>p.id===selectedProduct.id?{...p,...result.product}:p);selectedProduct=result.product;renderProducts();
  message("fa-product-edit-message","Product updated successfully.",true);
 }catch(err){message("fa-product-edit-message",err.message,false);}
 finally{button.disabled=false;}
});
$("fa-detail-content").addEventListener("submit",async e=>{if(e.target.id!=="fa-edit-form")return;e.preventDefault();if(!selected)return;const form=e.target,data=new FormData(form),fields={};for(const key of ["status","price_verification","payment_method","payment_status","courier_name","courier_tracking_number","internal_note"])fields[key]=String(data.get(key)||"").trim()||null;for(const key of ["delivery_charge_bdt","final_total_bdt"])fields[key]=data.get(key)===""?null:Number(data.get(key));const delivery=data.get("estimated_delivery_at");fields.estimated_delivery_at=delivery?new Date(delivery).toISOString():null;const button=form.querySelector("button[type=submit]");button.disabled=true;message("fa-edit-message","Saving order changes…",false);try{const result=await adminRequest({operation:"update",order_id:selected.id,fields});orders=orders.map(o=>o.id===selected.id?{...o,...result.order}:o);renderOrders();renderStats(await adminRequest({operation:"list"}).then(d=>d.stats||{}));selected=orders.find(o=>o.id===selected.id);openOrder(selected.id);message("fa-edit-message","Order updated successfully.",true);}catch(err){message("fa-edit-message",err.message,false);}finally{button.disabled=false;}});
$("fa-logout").addEventListener("click",async()=>{try{if(token())await adminRequest({operation:"logout"});}catch(_){}clearSession();orders=[];products=[];productsLoaded=false;closeOrder();showTab("orders");showAuth();$("fa-login-form").reset();});
(()=>{if(token()){showDashboard();void loadOrders();}else showAuth();})();
})();