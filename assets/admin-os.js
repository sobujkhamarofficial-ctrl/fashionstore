(function(){
"use strict";
const API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
const KEY="sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
const ADMIN_EMAIL="sobujkhamar.official@gmail.com";
const ACCESS="forme-admin-access";
const $=id=>document.getElementById(id);
let orders=[],selected=null,products=[],selectedProduct=null,messages=[],selectedMessage=null,feedback=[],activeTab="overview",productsLoaded=false,messagesLoaded=false,feedbackLoaded=false;
let overviewData=null,inventoryProducts=[],inventoryVariants=[],inventoryMovements=[],customers=[],categories=[],collections=[],reviews=[],auditRows=[],orderEvents=[],overviewLoaded=false,inventoryLoaded=false,customersLoaded=false,categoriesLoaded=false,reviewsLoaded=false,activityLoaded=false;
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
function showDashboard(){ const auth=$("fa-auth"),dashboard=$("fa-dashboard");auth.hidden=true;auth.style.display="none";dashboard.hidden=false;dashboard.style.display="grid"; }
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
  const verification=p.details_verified?"Details verified":"Details pending";
  const audience=p.audience_verified?(p.audience||"—"):"Audience pending";
  const seasons=p.season_verified?(Array.isArray(p.season_tags)?p.season_tags.join(", "):""):"Season pending";
  return '<tr><td><strong>'+esc(p.name)+'</strong><small>'+esc(p.id)+'</small></td><td>'+esc(p.category)+'</td><td><strong>'+money(p.price_bdt)+'</strong></td><td><span class="fa-status '+esc(p.availability_status)+'">'+esc(status)+'</span></td><td><span class="fa-payment">'+esc(verification)+'</span><small>'+esc(audience)+' · '+esc(seasons)+'</small></td><td><button class="fa-view" type="button" data-product-edit="'+esc(p.id)+'">Edit product ↗</button></td></tr>';
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
const PRODUCT_CSV_COLUMNS=["id","name","category","description","price_bdt","compare_at_price_bdt","image_url","availability_status","is_active","details_verified","price_verified","audience","audience_verified","season_tags","season_verified","size_options","color_options","sku","stock_quantity","material","fit","pattern","search_keywords","attributes_verified"];
function csvCell(value){
 const normalized=Array.isArray(value)?value.join(";"):(value===null||value===undefined?"":String(value));
 return '"'+normalized.replace(/"/g,'""')+'"';
}
function csvList(value){
 return String(value||"").split(";").map(item=>item.trim()).filter(Boolean);
}
function exportProductsCsv(){
 if(!products.length){message("fa-product-import-status","Load the product catalogue before exporting.",false);return;}
 const rows=[PRODUCT_CSV_COLUMNS.join(","),...products.map(p=>PRODUCT_CSV_COLUMNS.map(key=>csvCell(p[key])).join(","))];
 const blob=new Blob(["\uFEFF"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="forme-product-catalogue.csv";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
 message("fa-product-import-status","CSV exported: "+products.length+" products. Keep IDs unchanged and only mark real, physically checked products as verified.",true);
}
function parseCsv(source){
 const rows=[];let row=[],field="",quoted=false;
 for(let i=0;i<source.length;i++){
  const ch=source[i];
  if(quoted){
   if(ch==='"'){if(source[i+1]==='"'){field+='"';i++;}else quoted=false;}
   else field+=ch;
  }else if(ch==='"'&&field.length===0){quoted=true;}
  else if(ch===","){row.push(field);field="";}
  else if(ch==="\n"||ch==="\r"){
   if(ch==="\r"&&source[i+1]==="\n")i++;
   row.push(field);field="";
   if(row.some(value=>value.trim()!==""))rows.push(row);
   row=[];
  }else field+=ch;
 }
 if(quoted)throw new Error("The CSV file contains an unfinished quoted field.");
 row.push(field);if(row.some(value=>value.trim()!==""))rows.push(row);
 return rows;
}
function csvBoolean(value,label){
 const normalized=String(value||"").trim().toLowerCase();
 if(["true","1","yes"].includes(normalized))return true;
 if(["false","0","no"].includes(normalized))return false;
 throw new Error("Use true or false in the "+label+" column.");
}
async function importProductsCsv(file){
 const status=$("fa-product-import-status");
 try{
  if(file.size>2_000_000)throw new Error("CSV file is too large. Keep it under 2 MB.");
  const rows=parseCsv((await file.text()).replace(/^\uFEFF/,""));
  if(rows.length<2)throw new Error("The CSV file has no product rows.");
  if(rows.length-1>250)throw new Error("Import up to 250 product rows at a time.");
  const headers=rows[0].map(value=>value.trim());
  const missing=PRODUCT_CSV_COLUMNS.filter(key=>!headers.includes(key));
  if(missing.length)throw new Error("Missing CSV columns: "+missing.join(", "));
  const index=Object.fromEntries(headers.map((key,i)=>[key,i]));
  const known=new Set(products.map(p=>String(p.id))),seen=new Set();
  const imagePattern=/^https:\/\/images\.unsplash\.com\/photo-[A-Za-z0-9-]+(?:\?[A-Za-z0-9_=&%.,-]*)?$|^\/fashionstore\/assets\/fashion-photos\/[a-z0-9-]+\.jpg$/i;
  const allowed=new Set(["needs_confirmation","in_stock","out_of_stock","preorder","archived"]);
  const updates=rows.slice(1).map((cells,rowIndex)=>{
   const line=rowIndex+2,get=key=>String(cells[index[key]]??"").trim();
   const id=get("id");
   if(!id||!known.has(id))throw new Error("Row "+line+": unknown product ID.");
   if(seen.has(id))throw new Error("Row "+line+": duplicate product ID "+id+".");
   seen.add(id);
   const name=get("name"),category=get("category"),description=get("description"),imageUrl=get("image_url");
   const priceText=get("price_bdt"),compareText=get("compare_at_price_bdt"),availability=get("availability_status");
   if(!name||name.length>180||!category||category.length>120||!description||description.length>2000)throw new Error("Row "+line+": name, category and description are required.");
   if(!imagePattern.test(imageUrl))throw new Error("Row "+line+": use an Unsplash image URL or a FORME-hosted .jpg image.");
   if(!/^\d+$/.test(priceText)||Number(priceText)>5000000)throw new Error("Row "+line+": enter a whole-number BDT price.");
   const price=Number(priceText),compare=compareText===""?null:(/^\d+$/.test(compareText)?Number(compareText):NaN);
   if(compare!==null&&(!Number.isFinite(compare)||compare>5000000))throw new Error("Row "+line+": comparison price must be blank or a whole number.");
   const isActive=csvBoolean(get("is_active"),"is_active"),verified=csvBoolean(get("details_verified"),"details_verified");
   const priceVerified=csvBoolean(get("price_verified"),"price_verified");
   const audience=get("audience").toLowerCase()||null;
   const audienceVerified=csvBoolean(get("audience_verified"),"audience_verified");
   const seasonTags=csvList(get("season_tags")),seasonVerified=csvBoolean(get("season_verified"),"season_verified");
   const sizes=csvList(get("size_options")),colors=csvList(get("color_options")),keywords=csvList(get("search_keywords"));
   const sku=get("sku")||null,material=get("material")||null,fit=get("fit")||null,pattern=get("pattern")||null;
   const stockText=get("stock_quantity"),stock=stockText===""?null:(/^\d+$/.test(stockText)?Number(stockText):NaN);
   if(!allowed.has(availability))throw new Error("Row "+line+": invalid availability status.");
   if(audience!==null&&!["men","women","teens","kids","unisex"].includes(audience))throw new Error("Row "+line+": invalid audience.");
   if(audienceVerified&&!audience)throw new Error("Row "+line+": choose an audience before verifying it.");
   if(seasonTags.some(v=>!["spring","summer","autumn","winter","all_season"].includes(v))||(seasonTags.includes("all_season")&&seasonTags.length>1))throw new Error("Row "+line+": invalid season tags.");
   if(seasonVerified&&!seasonTags.length)throw new Error("Row "+line+": add a season before verifying it.");
   if(sizes.length>40||colors.length>40||keywords.length>40||[...sizes,...colors,...keywords].some(v=>v.length>80))throw new Error("Row "+line+": one or more attribute lists are too long.");
   if(stock!==null&&(!Number.isFinite(stock)||stock>2000000))throw new Error("Row "+line+": stock must be blank or a whole number up to 2,000,000.");
   if((sku&&sku.length>80)||(material&&material.length>120)||(fit&&fit.length>80)||(pattern&&pattern.length>80))throw new Error("Row "+line+": SKU or product attribute is too long.");
   if(priceVerified&&price<=0)throw new Error("Row "+line+": a verified price must be positive.");
   if(verified&&(price<=0||availability==="needs_confirmation"||availability==="archived"))throw new Error("Row "+line+": a verified product needs a positive price and a final stock status.");
   if((availability==="in_stock"||availability==="preorder")&&!verified)throw new Error("Row "+line+": verify product details before choosing in_stock or preorder.");
   if(compare!==null&&compare>0&&compare<price)throw new Error("Row "+line+": comparison price cannot be below the current selling price.");
   return {id,name,category,description,price_bdt:price,compare_at_price_bdt:compare,image_url:imageUrl,availability_status:availability,is_active:isActive,details_verified:verified,
    price_verified:priceVerified,audience,audience_verified:audienceVerified,season_tags:seasonTags,season_verified:seasonVerified,
    size_options:sizes,color_options:colors,sku,stock_quantity:stock,material,fit,pattern,search_keywords:keywords,attributes_verified:csvBoolean(get("attributes_verified"),"attributes_verified")};
  });
  if(!updates.length)throw new Error("No valid product rows were found.");
  const count=updates.length;
  if(!window.confirm("Import changes for "+count+" products? This updates live names, prices, images and availability. Only mark a product verified after checking the actual item and stock."))return;
  const button=$("fa-product-export");button.disabled=true;$("fa-product-import").disabled=true;
  status.textContent="Saving "+count+" catalogue updates…";
  try{
   const result=await adminRequest({operation:"product-bulk-update",products:updates});
   await loadProducts();
   message("fa-product-import-status","Successfully updated "+Number(result.updated_count||count)+" products. The storefront now reads the latest catalogue values.",true);
  }finally{button.disabled=false;$("fa-product-import").disabled=false;}
 }catch(error){
  message("fa-product-import-status",error.message||"The CSV could not be imported.",false);
 }
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

function renderFeedback(stats){
 const rows=feedback;
 $("fa-feedback-total").textContent=Number(stats.total||rows.length).toLocaleString("en-BD");
 $("fa-feedback-positive").textContent=Number(stats.positive||0).toLocaleString("en-BD");
 $("fa-feedback-negative").textContent=Number(stats.negative||0).toLocaleString("en-BD");
 $("fa-feedback-frustrated").textContent=Number(stats.frustrated||0).toLocaleString("en-BD");
 $("fa-feedback-count").textContent=rows.length+" responses";
 const reasons={helpful:"Helpful",wrong_information:"Wrong information",irrelevant:"Not relevant",tone:"Tone",other:"Other"};
 const intents={general:"General",order:"Order",delivery:"Delivery",returns:"Returns",product:"Product",size:"Size / fit",support:"Support"};
 const sentiments={angry:"Angry",frustrated:"Frustrated",confused:"Confused",positive:"Positive",neutral:"Neutral",urgent:"Urgent"};
 $("fa-feedback-rows").innerHTML=rows.map(row=>{
  const time=Number.isFinite(Number(row.latency_ms))?Number(row.latency_ms)+" ms":"—";
  return '<tr><td><strong>'+ (row.rating===1?'👍 Helpful':'👎 Needs review') +'</strong></td><td>'+esc(reasons[row.reason]||row.reason)+'</td><td>'+esc(intents[row.intent]||row.intent)+'</td><td>'+esc(sentiments[row.sentiment]||row.sentiment)+'</td><td>'+esc(row.model||"—")+'</td><td>'+esc(time)+'</td><td>'+esc(date(row.created_at))+'</td></tr>';
 }).join("");
 $("fa-feedback-empty").hidden=rows.length!==0;
 $("fa-feedback-rows").parentElement.hidden=rows.length===0;
}
async function loadFeedback(){
 alertBox("");
 try{
  const result=await adminRequest({operation:"ai-feedback"});
  feedback=Array.isArray(result.feedback)?result.feedback:[];
  feedbackLoaded=true;renderFeedback(result.stats||{});
 }catch(error){alertBox(error.message);}
}

function showTab(tab){
 activeTab=tab;
 const names=["overview","orders","products","inventory","customers","categories","messages","reviews","feedback","activity"];
 names.forEach(key=>{
  const nav=$("fa-"+key+"-tab"),panel=$(key==="overview"?"fa-overview-panel":"fa-"+key+"-panel"),active=key===tab;
  if(nav){nav.classList.toggle("active",active);nav.setAttribute("aria-selected",String(active));}
  if(panel)panel.hidden=!active;
 });
 const titles={overview:"Overview",orders:"Orders",products:"Products",inventory:"Inventory",customers:"Customers",categories:"Categories & collections",messages:"Messages",reviews:"Reviews",feedback:"AI insights",activity:"Activity log"};
 $("fa-page-title").textContent=titles[tab]||"Overview";
 if(tab==="overview"&&!overviewLoaded)void loadOverview();
 if(tab==="products"&&!productsLoaded)void loadProducts();
 if(tab==="inventory"&&!inventoryLoaded)void loadInventory();
 if(tab==="customers"&&!customersLoaded)void loadCustomers();
 if(tab==="categories"&&!categoriesLoaded)void loadCategories();
 if(tab==="messages"&&!messagesLoaded)void loadMessages();
 if(tab==="reviews"&&!reviewsLoaded)void loadReviews();
 if(tab==="feedback"&&!feedbackLoaded)void loadFeedback();
 if(tab==="activity"&&!activityLoaded)void loadActivity();
 const side=$("fa-sidebar");if(side)side.classList.remove("open");
}

function toast(textValue,isError=false){
 const el=$("os-toast");if(!el)return;
 el.textContent=textValue;el.classList.toggle("error",!!isError);el.classList.add("show");
 window.clearTimeout(toast.timer);toast.timer=window.setTimeout(()=>el.classList.remove("show"),3400);
}
function setText(id,value){const el=$(id);if(el)el.textContent=value;}
function setBar(id,value,total){const el=$(id);if(el)el.style.width=(total>0?Math.max(0,Math.min(100,Number(value)/total*100)):0)+"%";}
async function loadOverview(){
 try{overviewData=await adminRequest({operation:"overview"});overviewLoaded=true;renderOverview();}
 catch(error){alertBox(error.message||"Business overview could not be loaded.");}
}
function renderOverview(){
 if(!overviewData)return;
 const s=overviewData.stats||{};
 setText("fa-kpi-orders",Number(s.orderRequests||0).toLocaleString("en-BD"));
 setText("fa-kpi-pending",Number(s.pendingOrders||0).toLocaleString("en-BD"));
 setText("fa-kpi-revenue",money(s.collectedRevenueBdt||0));
 setText("fa-kpi-paid",Number(s.paidOrders||0)+" paid orders · verified collection");
 setText("fa-kpi-products",Number(s.activeProducts||0).toLocaleString("en-BD"));
 setText("fa-kpi-unverified",Number(s.needsVerification||0)+" need verification");
 setText("fa-kpi-stock",Number((s.unknownStock||0)+(s.lowStock||0)).toLocaleString("en-BD"));
 setText("fa-kpi-unknown",Number(s.unknownStock||0)+" quantities not counted · "+Number(s.lowStock||0)+" low stock");
 setText("fa-nav-pending",Number(s.pendingOrders||0).toLocaleString("en-BD"));
 setText("fa-status-pending",Number(s.pendingOrders||0));setText("fa-status-active",Number(s.activeOrders||0));setText("fa-status-delivered",Number(s.deliveredOrders||0));
 const max=Math.max(1,Number(s.pendingOrders||0),Number(s.activeOrders||0),Number(s.deliveredOrders||0));
 setBar("fa-bar-pending",s.pendingOrders,max);setBar("fa-bar-active",s.activeOrders,max);setBar("fa-bar-delivered",s.deliveredOrders,max);
 setText("fa-overview-collections",Number(s.activeCategories||0)+" categories active · "+Number(s.activeCollections||0)+" collections live");
 setText("fa-overview-messages",Number(s.newMessages||0)+" new messages · "+Number(s.pendingReviews||0)+" reviews to check");
 const dt=$("fa-current-date");if(dt)dt.textContent=new Date().toLocaleDateString("en-BD",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 const tasks=[],add=(count,title,desc,tab,icon)=>{if(Number(count)>0)tasks.push({count:Number(count),title,desc,tab,icon});};
 add(s.pendingOrders,"Order requests awaiting review","Check product, variant, price and delivery before confirming.","orders","▤");
 add(s.needsVerification,"Products need verification","Check real product details and selling price.","products","▣");
 add(s.unknownStock,"Inventory counts are missing","Record a physical count; unknown is not zero.","inventory","▦");
 add(s.lowStock,"Products are low on stock","Review items with five or fewer recorded units.","inventory","!");
 add(s.newMessages,"New customer messages","Review incoming customer enquiries.","messages","✉");
 add(s.pendingReviews,"Reviews awaiting moderation","Check purchase and publication consent.","reviews","☆");
 $("fa-attention-list").innerHTML=tasks.length?tasks.slice(0,7).map(t=>'<div class="os-attention-item"><span class="os-attention-icon">'+esc(t.icon)+'</span><div class="os-attention-copy"><b>'+esc(t.count.toLocaleString("en-BD"))+" · "+esc(t.title)+'</b><small>'+esc(t.desc)+'</small></div><button type="button" data-os-goto="'+esc(t.tab)+'">Review ↗</button></div>').join(""):'<div class="os-empty-attention">No urgent actions from the current records.</div>';
 const recent=Array.isArray(overviewData.recentOrders)?overviewData.recentOrders:[];
 $("fa-overview-orders").innerHTML=recent.length?recent.map(o=>'<tr><td><strong>'+esc(o.order_number)+'</strong><small>'+esc(date(o.created_at))+'</small></td><td><strong>'+esc(o.customer_name)+'</strong><small>'+esc(o.customer_phone)+'</small></td><td>'+esc(date(o.created_at))+'</td><td>'+esc(String(o.payment_status||"not collected").replaceAll("_"," "))+'</td><td><span class="fa-status '+esc(o.status)+'">'+esc(statusLabel(o.status))+'</span></td><td><button class="fa-view" type="button" data-overview-order="'+esc(o.id)+'">Open ↗</button></td></tr>').join(""):'<tr><td colspan="6" class="fa-empty-cell">No order requests have been received yet.</td></tr>';
}
async function loadInventory(){
 try{const d=await adminRequest({operation:"inventory"});inventoryProducts=d.products||[];inventoryVariants=d.variants||[];inventoryMovements=d.movements||[];inventoryLoaded=true;renderInventory();}
 catch(error){alertBox(error.message||"Inventory could not be loaded.");}
}
function visibleInventoryRows(){
 const q=($("fa-inventory-search")?.value||"").trim().toLowerCase(),filter=$("fa-inventory-filter")?.value||"all",byProduct=new Map(),rows=[];
 inventoryVariants.filter(v=>v.is_active!==false).forEach(v=>{if(!byProduct.has(v.product_id))byProduct.set(v.product_id,[]);byProduct.get(v.product_id).push(v);});
 const include=(p,v,qty,hay)=>{
  if(q&&!hay.includes(q))return;
  if(filter==="unknown"&&qty!==null&&qty!==undefined)return;
  if(filter==="low"&&!(qty!==null&&qty!==undefined&&Number(qty)>0&&Number(qty)<=5))return;
  if(filter==="zero"&&Number(qty)!==0)return;
  if(filter==="tracked"&&(qty===null||qty===undefined))return;
  rows.push({product:p,variant:v,quantity:qty});
 };
 inventoryProducts.forEach(p=>{
  const vars=byProduct.get(p.id)||[];
  if(vars.length)vars.forEach(v=>include(p,v,v.stock_quantity,[p.name,p.id,p.category,v.sku,v.size,v.color].join(" ").toLowerCase()));
  else include(p,null,p.stock_quantity,[p.name,p.id,p.category,p.sku].join(" ").toLowerCase());
 });
 return rows;
}
function renderInventory(){
 const hasVariants=new Set(inventoryVariants.filter(v=>v.is_active!==false).map(v=>v.product_id));
 const tracked=inventoryProducts.filter(p=>!hasVariants.has(p.id)&&p.stock_quantity!==null&&p.stock_quantity!==undefined).length;
 const unknownP=inventoryProducts.filter(p=>!hasVariants.has(p.id)&&(p.stock_quantity===null||p.stock_quantity===undefined)).length;
 const activeV=inventoryVariants.filter(v=>v.is_active!==false),unknownV=activeV.filter(v=>v.stock_quantity===null||v.stock_quantity===undefined).length;
 const low=[...inventoryProducts.filter(p=>!hasVariants.has(p.id)&&p.stock_quantity!==null&&Number(p.stock_quantity)>0&&Number(p.stock_quantity)<=5),...activeV.filter(v=>v.stock_quantity!==null&&Number(v.stock_quantity)>0&&Number(v.stock_quantity)<=5)];
 setText("fa-inv-tracked",tracked+activeV.length-unknownV);setText("fa-inv-unknown",unknownP+unknownV);setText("fa-inv-low",low.length);setText("fa-inv-variants",activeV.length);
 const rows=visibleInventoryRows();
 $("fa-inventory-rows").innerHTML=rows.length?rows.map(r=>{
  const p=r.product,v=r.variant,q=r.quantity;
  const label=q===null||q===undefined?'<span class="fa-status needs_confirmation">Not counted</span>':Number(q)===0?'<span class="fa-status out_of_stock">0 units</span>':Number(q)<=5?'<span class="fa-status needs_confirmation">'+Number(q)+' units · Low</span>':'<span class="fa-status in_stock">'+Number(q)+' units</span>';
  const action=v?'<button class="fa-view" data-inventory-adjust="'+esc(p.id)+'" data-inventory-variant="'+esc(v.id)+'" type="button">Count stock</button> <button class="fa-view" data-variant-edit="'+esc(v.id)+'" type="button">Edit</button>':'<button class="fa-view" data-inventory-adjust="'+esc(p.id)+'" type="button">Record count</button>';
  return '<tr><td><strong>'+(v?'<span class="os-variant-indent">↳ </span>':'')+esc(p.name)+'</strong><small>'+esc(p.id)+'</small></td><td>'+esc((v?v.sku:p.sku)||"—")+'</td><td>'+esc(v?[(v.size||""),(v.color||"")].filter(Boolean).join(" / "):(p.category||"—"))+'</td><td>'+label+'</td><td>'+esc((v?v.stock_checked_at:p.stock_checked_at)?date(v?v.stock_checked_at:p.stock_checked_at):"Not recorded")+'</td><td>'+action+' <button class="fa-view" data-variant-create="'+esc(p.id)+'" type="button">＋ Variant</button></td></tr>';
 }).join(""):'<tr><td colspan="6" class="fa-empty-cell">No inventory rows match this filter.</td></tr>';
 const names=new Map(inventoryProducts.map(p=>[p.id,p.name]));
 $("fa-inventory-movements").innerHTML=inventoryMovements.length?inventoryMovements.map(m=>'<tr><td>'+esc(date(m.created_at))+'</td><td><strong>'+esc(names.get(m.product_id)||m.product_id)+'</strong><small>'+esc(m.product_id)+'</small></td><td><span class="fa-status">'+esc(m.movement_type)+'</span></td><td>'+esc(m.stock_before===null?"Unknown":m.stock_before)+'</td><td><strong>'+esc(m.stock_after)+'</strong></td><td>'+esc(m.reason)+'</td><td>'+esc(m.actor_email)+'</td></tr>').join(""):'<tr><td colspan="7" class="fa-empty-cell">No physical stock counts have been recorded yet.</td></tr>';
}
function openInventoryAdjust(productId,variantId){
 const p=inventoryProducts.find(x=>x.id===productId);if(!p)return;const v=variantId?inventoryVariants.find(x=>x.id===variantId):null;
 $("fa-detail-title").textContent="Record physical stock count";
 $("fa-detail-content").innerHTML='<section class="fa-detail-section"><p class="fa-product-editor-note">Enter the quantity physically counted. This creates an inventory movement record and updates stock atomically.</p><div class="fa-detail-card"><span>PRODUCT</span><strong>'+esc(p.name)+'</strong><p>'+esc(v?[v.size,v.color,v.sku].filter(Boolean).join(" · "):p.id)+'</p></div><form id="fa-inventory-adjust-form" class="fa-edit-grid"><input type="hidden" name="product_id" value="'+esc(productId)+'"><input type="hidden" name="variant_id" value="'+esc(variantId||"")+'"><label class="wide">Physical quantity<input name="new_quantity" type="number" min="0" max="2000000" step="1" required value="'+esc((v?v.stock_quantity:p.stock_quantity)??"")+'" placeholder="Enter counted units"></label><label class="wide">Reason<textarea name="reason" minlength="3" maxlength="500" required placeholder="Example: Initial physical count on 4 November."></textarea></label><div class="fa-save-row wide"><button class="os-button os-button-primary" type="submit">Save stock count ↗</button></div><p id="fa-inventory-adjust-message" class="fa-message wide" role="status"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
}
function openVariantCreate(productId){
 const p=inventoryProducts.find(x=>x.id===productId);if(!p)return;
 $("fa-detail-title").textContent="Add product variant";
 $("fa-detail-content").innerHTML='<section class="fa-detail-section"><div class="fa-detail-card"><span>PRODUCT</span><strong>'+esc(p.name)+'</strong></div><p class="fa-product-editor-note">New variant quantity starts as unknown until physically counted.</p><form id="fa-variant-create-form" class="fa-edit-grid"><input type="hidden" name="product_id" value="'+esc(productId)+'"><label>Size<input name="size" maxlength="30" placeholder="M / L / XL"></label><label>Colour<input name="color" maxlength="50" placeholder="Black / Navy"></label><label>Variant SKU<input name="sku" maxlength="80"></label><label>Price override<input name="price_bdt" type="number" min="0" max="5000000" step="1"></label><div class="fa-save-row wide"><button class="os-button os-button-primary" type="submit">Create variant ↗</button></div><p id="fa-variant-message" class="fa-message wide"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
}
function openVariantEdit(variantId){
 const v=inventoryVariants.find(x=>x.id===variantId);if(!v)return;
 $("fa-detail-title").textContent="Edit product variant";
 $("fa-detail-content").innerHTML='<section class="fa-detail-section"><form id="fa-variant-edit-form" class="fa-edit-grid"><input type="hidden" name="variant_id" value="'+esc(v.id)+'"><label>Size<input name="size" maxlength="30" value="'+esc(v.size||"")+'"></label><label>Colour<input name="color" maxlength="50" value="'+esc(v.color||"")+'"></label><label>SKU<input name="sku" maxlength="80" value="'+esc(v.sku||"")+'"></label><label>Price override<input name="price_bdt" type="number" min="0" max="5000000" value="'+esc(v.price_bdt??"")+'"></label><label class="fa-checkline wide"><input type="checkbox" name="is_active" '+(v.is_active?"checked":"")+'> Variant is active</label><p class="os-data-note wide">Edit physical stock through the Count stock action so a movement is recorded.</p><div class="fa-save-row wide"><button class="os-button os-button-primary" type="submit">Save variant ↗</button></div><p id="fa-variant-edit-message" class="fa-message wide"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
}
async function loadCustomers(){
 try{const d=await adminRequest({operation:"customers"});customers=Array.isArray(d.customers)?d.customers:[];customersLoaded=true;renderCustomers();if(d.limited)setText("fa-customer-note","Showing the latest 2,000 order records.");}
 catch(error){alertBox(error.message||"Customers could not be loaded.");}
}
function renderCustomers(){
 const q=($("fa-customer-search")?.value||"").trim().toLowerCase(),rows=customers.filter(c=>[c.name,c.phone,c.email,c.district,c.area].some(v=>String(v||"").toLowerCase().includes(q)));
 setText("fa-customer-count",rows.length+" customers");
 $("fa-customer-rows").innerHTML=rows.length?rows.map(c=>'<tr><td><strong>'+esc(c.name||"Unnamed customer")+'</strong><small>'+esc(c.latest_order_number||"")+'</small></td><td>'+esc(c.phone||"—")+'</td><td>'+esc(c.email||"—")+'</td><td>'+Number(c.order_count||0)+'</td><td>'+Number(c.delivered_count||0)+'</td><td>'+money(c.collected_spend_bdt||0)+'</td><td>'+esc(date(c.latest_order_at))+'</td></tr>').join(""):'<tr><td colspan="7" class="fa-empty-cell">No customer records yet. Customers appear after an order request is submitted.</td></tr>';
}
async function loadCategories(){
 try{const d=await adminRequest({operation:"categories"});categories=d.categories||[];collections=d.collections||[];categoriesLoaded=true;renderCategories();}
 catch(error){alertBox(error.message||"Categories could not be loaded.");}
}
function renderCategories(){
 $("fa-category-rows").innerHTML=categories.length?categories.map(c=>'<tr><td><strong>'+esc(c.name)+'</strong><small>'+esc(c.slug)+'</small></td><td>'+esc(c.audience||"—")+'</td><td>'+Number(c.product_count||0)+'</td><td><span class="fa-status '+(c.is_active?"in_stock":"archived")+'">'+(c.is_active?"Active":"Inactive")+'</span></td><td><button class="fa-view" data-category-edit="'+esc(c.id)+'" type="button">Edit ↗</button></td></tr>').join(""):'<tr><td colspan="5" class="fa-empty-cell">No categories found.</td></tr>';
 $("fa-collection-rows").innerHTML=collections.length?collections.map(c=>'<tr><td><strong>'+esc(c.name)+'</strong><small>'+esc(c.slug)+'</small></td><td>'+esc(c.audience||"—")+'</td><td>'+esc(c.season||"—")+'</td><td><span class="fa-status '+esc(c.status)+'">'+esc(c.status)+'</span></td><td><button class="fa-view" data-collection-edit="'+esc(c.id)+'" type="button">Edit ↗</button></td></tr>').join(""):'<tr><td colspan="5" class="fa-empty-cell">No collections found.</td></tr>';
}
function openCategoryEditor(id){
 const c=id?categories.find(x=>x.id===id):null,parentOptions='<option value="">No parent · top level</option>'+categories.filter(x=>!c||x.id!==c.id).map(x=>'<option value="'+esc(x.id)+'" '+(c&&c.parent_id===x.id?"selected":"")+'>'+esc(x.name)+'</option>').join("");
 $("fa-detail-title").textContent=c?"Edit category":"Create category";
 $("fa-detail-content").innerHTML='<section class="fa-detail-section"><p class="fa-product-editor-note">Category registry is available now. Public navigation publishing is in Part 2.</p><form id="fa-category-edit-form" class="fa-edit-grid"><input type="hidden" name="id" value="'+esc(c?c.id:"")+'"><label class="wide">Name<input name="name" required maxlength="120" value="'+esc(c?c.name:"")+'"></label><label>Slug<input name="slug" maxlength="100" value="'+esc(c?c.slug:"")+'"></label><label>Audience<select name="audience">'+option("","", "All / not assigned")+["men","women","teens","kids","unisex"].map(v=>option(v,c?c.audience:"",v)).join("")+'</select></label><label class="wide">Parent category<select name="parent_id">'+parentOptions+'</select></label><label class="wide">Description<textarea name="description" maxlength="1000">'+esc(c?c.description||"":"")+'</textarea></label><label>Sort order<input name="sort_order" type="number" step="1" value="'+esc(c?c.sort_order:0)+'"></label><label class="fa-checkline"><input name="is_active" type="checkbox" '+(!c||c.is_active?"checked":"")+'> Active category</label><div class="fa-save-row wide"><button class="os-button os-button-primary" type="submit">Save category ↗</button></div><p id="fa-category-message" class="fa-message wide"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
}
function openCollectionEditor(id){
 const c=id?collections.find(x=>x.id===id):null;
 $("fa-detail-title").textContent=c?"Edit collection":"Create collection";
 $("fa-detail-content").innerHTML='<section class="fa-detail-section"><p class="fa-product-editor-note">Collections are managed here; publishing them to public navigation and the homepage is Part 2.</p><form id="fa-collection-edit-form" class="fa-edit-grid"><input type="hidden" name="id" value="'+esc(c?c.id:"")+'"><label class="wide">Name<input name="name" required maxlength="120" value="'+esc(c?c.name:"")+'"></label><label>Slug<input name="slug" maxlength="100" value="'+esc(c?c.slug:"")+'"></label><label>Status<select name="status">'+["draft","active","archived"].map(v=>option(v,c?c.status:"draft",v)).join("")+'</select></label><label>Audience<select name="audience">'+option("","", "All audiences")+["men","women","teens","kids","unisex"].map(v=>option(v,c?c.audience:"",v)).join("")+'</select></label><label>Season<select name="season">'+option("","", "Any season")+["spring","summer","autumn","winter","all_season"].map(v=>option(v,c?c.season:"",v)).join("")+'</select></label><label class="wide">Description<textarea name="description" maxlength="1500">'+esc(c?c.description||"":"")+'</textarea></label><label class="wide">Cover image URL<input name="image_url" maxlength="1000" value="'+esc(c?c.image_url||"":"")+'"></label><label class="wide">Product IDs (optional, semicolon-separated)<textarea name="product_ids"></textarea></label><div class="fa-save-row wide"><button class="os-button os-button-primary" type="submit">Save collection ↗</button></div><p id="fa-collection-message" class="fa-message wide"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
}
async function loadReviews(){
 try{const d=await adminRequest({operation:"reviews"});reviews=d.reviews||[];reviewsLoaded=true;renderReviews();}
 catch(error){alertBox(error.message||"Reviews could not be loaded.");}
}
function renderReviews(){
 const f=$("fa-review-filter")?.value||"all",rows=reviews.filter(r=>f==="all"||r.publication_status===f),names=new Map(products.map(p=>[p.id,p.name]));
 setText("fa-review-count",rows.length+" reviews");
 $("fa-review-rows").innerHTML=rows.length?rows.map(r=>{
  const action=r.publication_status==="published"?'<button class="fa-view" data-review-id="'+esc(r.id)+'" data-review-status="hidden_for_policy" type="button">Hide</button>':'<button class="fa-view" data-review-id="'+esc(r.id)+'" data-review-status="published" type="button" '+(r.publication_consent===true?"":"disabled")+'>Publish</button>';
  return '<tr><td><strong>'+esc(r.reviewer_name)+'</strong></td><td>'+esc(names.get(r.product_id)||r.product_id)+'</td><td>'+("★".repeat(Number(r.rating||0)))+'</td><td class="fa-message-preview">'+esc(r.review_text)+'</td><td>'+esc(date(r.created_at))+'</td><td><span class="fa-status">'+esc(statusLabel(r.publication_status))+'</span></td><td>'+action+'</td></tr>';
 }).join(""):'<tr><td colspan="7" class="fa-empty-cell">No reviews match this filter.</td></tr>';
}
async function loadActivity(){
 try{const d=await adminRequest({operation:"activity"});auditRows=d.audit||[];orderEvents=d.orderEvents||[];activityLoaded=true;renderActivity();}
 catch(error){alertBox(error.message||"Activity log could not be loaded.");}
}
function renderActivity(){
 const rows=[...auditRows.map(x=>({...x,resource:x.entity_type+(x.entity_id?" · "+x.entity_id:"")})),...orderEvents.map(x=>({created_at:x.created_at,actor_email:x.actor_email,action:"order."+x.event_type,resource:"order · "+x.order_id,summary:(x.old_status?x.old_status+" → ":"")+String(x.new_status||x.note||"Order event")}))].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 setText("fa-activity-count",rows.length+" events");
 $("fa-activity-rows").innerHTML=rows.length?rows.slice(0,250).map(x=>'<tr><td>'+esc(date(x.created_at))+'</td><td>'+esc(x.actor_email||"system")+'</td><td><span class="fa-status">'+esc(x.action||"event")+'</span></td><td>'+esc(x.resource||x.entity_type||"—")+'</td><td>'+esc(x.summary||"—")+'</td></tr>').join(""):'<tr><td colspan="5" class="fa-empty-cell">No admin changes have been recorded yet.</td></tr>';
}
async function loadOrderEvents(orderId){
 const target=$("fa-order-events");if(!target)return;target.textContent="Loading order timeline…";
 try{const d=await adminRequest({operation:"order-events",order_id:orderId}),rows=d.events||[];
  target.innerHTML=rows.length?'<div class="os-timeline">'+rows.map(x=>'<div class="os-timeline-item"><b>'+esc(String(x.event_type||"event").replaceAll("_"," "))+(x.new_status?" · "+esc(statusLabel(x.new_status)):"")+'</b><small>'+esc(date(x.created_at))+' · '+esc(x.actor_email||"system")+'</small>'+((x.note)?'<small>'+esc(x.note)+'</small>':"")+'</div>').join("")+'</div>':'<span class="os-toolbar-note">No timeline entries yet.</span>';
 }catch(error){target.textContent="Order history is temporarily unavailable.";}
}
function openProductCreate(){
 $("fa-detail-title").textContent="Create product";
 $("fa-detail-content").innerHTML='<section class="fa-detail-section"><p class="fa-product-editor-note">New products start unverified and unavailable for sale until the actual details, price and stock have been checked.</p><form id="fa-create-product-form" class="fa-edit-grid"><label class="wide">Product name<input name="name" required maxlength="180"></label><label>Product ID / slug<input name="id" maxlength="100" placeholder="generated-from-name"></label><label>Category<input name="category" required maxlength="120"></label><label>Selling price (BDT)<input name="price_bdt" type="number" min="0" max="5000000" step="1" required></label><label>Audience<select name="audience">'+option("","", "Not assigned")+["men","women","teens","kids","unisex"].map(v=>option(v,"",v)).join("")+'</select></label><label class="wide">Main image URL<input name="image_url" required maxlength="1000" placeholder="https://images.unsplash.com/photo-…"></label><label class="wide">Description<textarea name="description" required maxlength="2000"></textarea></label><div class="fa-save-row wide"><button class="os-button os-button-primary" type="submit">Create draft product ↗</button></div><p id="fa-create-product-message" class="fa-message wide"></p></form></section>';
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";
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
  '<label>Audience<select name="audience">'+option("","", "Not assigned")+["men","women","teens","kids","unisex"].map(v=>option(v,p.audience,v[0].toUpperCase()+v.slice(1))).join("")+'</select></label>'+
  '<label class="wide">Season tags (separate with semicolons)<input name="season_tags" maxlength="160" value="'+esc((p.season_tags||[]).join("; "))+'" placeholder="winter; autumn"></label>'+
  '<label>Sizes (semicolon-separated)<input name="size_options" maxlength="300" value="'+esc((p.size_options||[]).join("; "))+'" placeholder="S; M; L; XL"></label>'+
  '<label>Colours (semicolon-separated)<input name="color_options" maxlength="500" value="'+esc((p.color_options||[]).join("; "))+'" placeholder="Black; Navy; Beige"></label>'+
  '<label>SKU<input name="sku" maxlength="80" value="'+esc(p.sku||"")+'"></label>'+
  '<p class="fa-note wide">Manage physical stock counts and size/colour variants in the Inventory workspace. Every count is recorded in stock movement history.</p>'+
  '<label>Material<input name="material" maxlength="120" value="'+esc(p.material||"")+'"></label>'+
  '<label>Fit<input name="fit" maxlength="80" value="'+esc(p.fit||"")+'"></label>'+
  '<label>Pattern<input name="pattern" maxlength="80" value="'+esc(p.pattern||"")+'"></label>'+
  '<label class="wide">Search keywords (semicolon-separated)<input name="search_keywords" maxlength="800" value="'+esc((p.search_keywords||[]).join("; "))+'"></label>'+
  '<label class="fa-checkline"><input type="checkbox" name="is_active" '+(p.is_active?"checked":"")+'> Visible in the catalogue</label>'+
  '<label class="fa-checkline"><input type="checkbox" name="details_verified" '+(p.details_verified?"checked":"")+'> Product details verified</label>'+
  '<label class="fa-checkline"><input type="checkbox" name="price_verified" '+(p.price_verified?"checked":"")+'> Price physically checked</label>'+
  '<label class="fa-checkline"><input type="checkbox" name="audience_verified" '+(p.audience_verified?"checked":"")+'> Audience verified</label>'+
  '<label class="fa-checkline"><input type="checkbox" name="season_verified" '+(p.season_verified?"checked":"")+'> Season verified</label>'+
  '<label class="fa-checkline"><input type="checkbox" name="attributes_verified" '+(p.attributes_verified?"checked":"")+'> Sizes, colours and attributes verified</label>'+
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
 '<section class="fa-detail-section"><h3>Order timeline</h3><div id="fa-order-events" class="os-timeline">Loading order timeline…</div></section>'+
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
 $("fa-modal").hidden=false;document.body.style.overflow="hidden";void loadOrderEvents(o.id);
}
function closeOrder(){$("fa-modal").hidden=true;document.body.style.overflow="";}
$("fa-login-form").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,data=new FormData(form),button=form.querySelector("button[type=submit]");button.disabled=true;message("fa-login-message","Checking your access…",false);try{const email=String(data.get("email")||"").trim().toLowerCase();if(email!==ADMIN_EMAIL)throw new Error("Only the authorised owner email can sign in.");const session=await adminRequest({operation:"login",email,password:String(data.get("password")||"")});saveSession(session);form.reset();message("fa-login-message","",true);showDashboard();void loadOrders();void loadOverview();}catch(err){clearSession();showAuth();message("fa-login-message",err.message,false);}finally{button.disabled=false;}});

$("fa-refresh").addEventListener("click",()=>{overviewLoaded=inventoryLoaded=customersLoaded=categoriesLoaded=reviewsLoaded=activityLoaded=false;productsLoaded=messagesLoaded=feedbackLoaded=false;if(activeTab==="orders")void loadOrders();showTab(activeTab);});$("fa-search").addEventListener("input",renderOrders);$("fa-filter").addEventListener("change",renderOrders);
$("fa-orders-tab").addEventListener("click",()=>showTab("orders"));$("fa-products-tab").addEventListener("click",()=>showTab("products"));$("fa-messages-tab").addEventListener("click",()=>showTab("messages"));$("fa-feedback-tab").addEventListener("click",()=>showTab("feedback"));
$("fa-product-search").addEventListener("input",renderProducts);$("fa-product-filter").addEventListener("change",renderProducts);
$("fa-product-export").addEventListener("click",exportProductsCsv);$("fa-product-import").addEventListener("change",async e=>{const file=e.currentTarget.files&&e.currentTarget.files[0];if(file)await importProductsCsv(file);e.currentTarget.value="";});
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
  is_active:form.elements.is_active.checked,details_verified:form.elements.details_verified.checked,
  price_verified:form.elements.price_verified.checked,
  audience:String(data.get("audience")||"")||null,audience_verified:form.elements.audience_verified.checked,
  season_tags:csvList(data.get("season_tags")),season_verified:form.elements.season_verified.checked,
  size_options:csvList(data.get("size_options")),color_options:csvList(data.get("color_options")),
  sku:String(data.get("sku")||"").trim()||null,
  material:String(data.get("material")||"").trim()||null,fit:String(data.get("fit")||"").trim()||null,
  pattern:String(data.get("pattern")||"").trim()||null,search_keywords:csvList(data.get("search_keywords")),
  attributes_verified:form.elements.attributes_verified.checked
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

$("fa-inventory-search").addEventListener("input",renderInventory);
$("fa-inventory-filter").addEventListener("change",renderInventory);
$("fa-customer-search").addEventListener("input",renderCustomers);
$("fa-review-filter").addEventListener("change",renderReviews);
$("fa-product-create").addEventListener("click",openProductCreate);
$("fa-add-category").addEventListener("click",()=>openCategoryEditor(null));
$("fa-add-collection").addEventListener("click",()=>openCollectionEditor(null));
$("fa-mobile-menu").addEventListener("click",()=> $("fa-sidebar").classList.toggle("open"));
document.querySelectorAll("[data-os-goto]").forEach(btn=>btn.addEventListener("click",()=>showTab(btn.dataset.osGoto)));
document.querySelectorAll("[data-os-tab]").forEach(btn=>btn.addEventListener("click",()=>showTab(btn.dataset.osTab)));
$("fa-global-search").addEventListener("input",e=>{
 const map={orders:"fa-search",products:"fa-product-search",inventory:"fa-inventory-search",customers:"fa-customer-search",messages:"fa-message-search"};
 const target=$(map[activeTab]||"");
 if(target){target.value=e.target.value;if(activeTab==="orders")renderOrders();if(activeTab==="products")renderProducts();if(activeTab==="inventory")renderInventory();if(activeTab==="customers")renderCustomers();if(activeTab==="messages")renderMessages();}
});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("fa-global-search").focus();}});
$("fa-overview-orders").addEventListener("click",e=>{const b=e.target.closest("[data-overview-order]");if(b){if(!orders.length)void loadOrders().then(()=>openOrder(b.dataset.overviewOrder));else openOrder(b.dataset.overviewOrder);}});
$("fa-attention-list").addEventListener("click",e=>{const b=e.target.closest("[data-os-goto]");if(b)showTab(b.dataset.osGoto);});
$("fa-inventory-rows").addEventListener("click",e=>{
 const a=e.target.closest("[data-inventory-adjust]"),c=e.target.closest("[data-variant-create]"),v=e.target.closest("[data-variant-edit]");
 if(a)openInventoryAdjust(a.dataset.inventoryAdjust,a.dataset.inventoryVariant||null);else if(c)openVariantCreate(c.dataset.variantCreate);else if(v)openVariantEdit(v.dataset.variantEdit);
});
$("fa-category-rows").addEventListener("click",e=>{const b=e.target.closest("[data-category-edit]");if(b)openCategoryEditor(b.dataset.categoryEdit);});
$("fa-collection-rows").addEventListener("click",e=>{const b=e.target.closest("[data-collection-edit]");if(b)openCollectionEditor(b.dataset.collectionEdit);});
$("fa-review-rows").addEventListener("click",async e=>{
 const b=e.target.closest("[data-review-status]");if(!b)return;b.disabled=true;
 try{await adminRequest({operation:"review-update",review_id:b.dataset.reviewId,publication_status:b.dataset.reviewStatus});toast("Review status updated.");await loadReviews();overviewLoaded=false;void loadOverview();}
 catch(error){toast(error.message||"Review could not be updated.",true);b.disabled=false;}
});
$("fa-detail-content").addEventListener("submit",async e=>{
 const form=e.target;
 if(form.id==="fa-create-product-form"){
  e.preventDefault();const d=new FormData(form),button=form.querySelector('button[type="submit"]'),name=String(d.get("name")||"").trim(),slug=String(d.get("id")||name).trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  const fields={id:slug,name,category:String(d.get("category")||"").trim(),price_bdt:Number(d.get("price_bdt")),audience:String(d.get("audience")||"")||null,image_url:String(d.get("image_url")||"").trim(),description:String(d.get("description")||"").trim()};
  button.disabled=true;message("fa-create-product-message","Creating product…",false);
  try{const r=await adminRequest({operation:"product-create",fields});products.push(r.product);productsLoaded=true;renderProducts();toast("Product created as an unverified draft.");closeOrder();showTab("products");overviewLoaded=false;void loadOverview();}
  catch(error){message("fa-create-product-message",error.message,false);}finally{button.disabled=false;}return;
 }
 if(form.id==="fa-inventory-adjust-form"){
  e.preventDefault();const d=new FormData(form),button=form.querySelector('button[type="submit"]');button.disabled=true;message("fa-inventory-adjust-message","Saving physical count…",false);
  try{await adminRequest({operation:"inventory-adjust",product_id:String(d.get("product_id")),variant_id:String(d.get("variant_id")||"")||null,new_quantity:Number(d.get("new_quantity")),reason:String(d.get("reason")||"").trim()});toast("Physical stock count recorded.");closeOrder();inventoryLoaded=false;void loadInventory();overviewLoaded=false;void loadOverview();}
  catch(error){message("fa-inventory-adjust-message",error.message,false);button.disabled=false;}return;
 }
 if(form.id==="fa-variant-create-form"){
  e.preventDefault();const d=new FormData(form),button=form.querySelector('button[type="submit"]');button.disabled=true;message("fa-variant-message","Creating variant…",false);
  try{await adminRequest({operation:"variant-create",product_id:String(d.get("product_id")),size:String(d.get("size")||"").trim(),color:String(d.get("color")||"").trim(),sku:String(d.get("sku")||"").trim()||null,price_bdt:d.get("price_bdt")===""?null:Number(d.get("price_bdt"))});toast("Variant created. Record physical stock separately.");closeOrder();inventoryLoaded=false;void loadInventory();}
  catch(error){message("fa-variant-message",error.message,false);button.disabled=false;}return;
 }
 if(form.id==="fa-variant-edit-form"){
  e.preventDefault();const d=new FormData(form),button=form.querySelector('button[type="submit"]');button.disabled=true;message("fa-variant-edit-message","Saving variant…",false);
  try{await adminRequest({operation:"variant-update",variant_id:String(d.get("variant_id")),fields:{size:String(d.get("size")||"").trim(),color:String(d.get("color")||"").trim(),sku:String(d.get("sku")||"").trim()||null,price_bdt:d.get("price_bdt")===""?null:Number(d.get("price_bdt")),is_active:form.elements.is_active.checked}});toast("Variant updated.");closeOrder();inventoryLoaded=false;void loadInventory();}
  catch(error){message("fa-variant-edit-message",error.message,false);button.disabled=false;}return;
 }
 if(form.id==="fa-category-edit-form"){
  e.preventDefault();const d=new FormData(form),button=form.querySelector('button[type="submit"]'),category={id:String(d.get("id")||"")||undefined,name:String(d.get("name")||"").trim(),slug:String(d.get("slug")||"").trim(),audience:String(d.get("audience")||"")||null,parent_id:String(d.get("parent_id")||"")||null,description:String(d.get("description")||"").trim(),sort_order:Number(d.get("sort_order")||0),is_active:form.elements.is_active.checked};
  button.disabled=true;message("fa-category-message","Saving category…",false);
  try{await adminRequest({operation:"category-save",category});toast("Category saved.");closeOrder();categoriesLoaded=false;void loadCategories();overviewLoaded=false;void loadOverview();}
  catch(error){message("fa-category-message",error.message,false);button.disabled=false;}return;
 }
 if(form.id==="fa-collection-edit-form"){
  e.preventDefault();const d=new FormData(form),button=form.querySelector('button[type="submit"]'),collection={id:String(d.get("id")||"")||undefined,name:String(d.get("name")||"").trim(),slug:String(d.get("slug")||"").trim(),status:String(d.get("status")||"draft"),audience:String(d.get("audience")||"")||null,season:String(d.get("season")||"")||null,description:String(d.get("description")||"").trim(),image_url:String(d.get("image_url")||"").trim()||null},ids=String(d.get("product_ids")||"").split(/[;,]/).map(v=>v.trim()).filter(Boolean);
  button.disabled=true;message("fa-collection-message","Saving collection…",false);
  try{const r=await adminRequest({operation:"collection-save",collection});if(ids.length)await adminRequest({operation:"collection-products-save",collection_id:r.collection.id,product_ids:ids});toast("Collection saved.");closeOrder();categoriesLoaded=false;void loadCategories();}
  catch(error){message("fa-collection-message",error.message,false);button.disabled=false;}return;
 }
});

(()=>{if(token()){showDashboard();void loadOrders();void loadOverview();}else showAuth();})();
})();