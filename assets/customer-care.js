(function () {
"use strict";
const API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/fashion-customer-care";
const COMMERCE_API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
const BASE="/fashionstore/";
const history=[];
let ready=false,busy=false,panel,launch,input,sendButton,chat,statusLine,promptButtons=[];

function el(tag,cls,text){
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(text!==undefined&&text!==null)n.textContent=String(text);
 return n;
}
function scroll(){chat.scrollTop=chat.scrollHeight;}
function message(text,cls){
 const n=el("div","fa-message"+(cls?" "+cls:""),text||"");
 chat.appendChild(n);scroll();return n;
}
function money(value){return "৳"+Number(value||0).toLocaleString("en-BD");}
function imageSource(value){
 try{
  const u=new URL(String(value||""),window.location.origin);
  if(u.protocol==="https:"&&(u.hostname==="images.unsplash.com"||u.hostname==="sobujkhamarofficial-ctrl.github.io"))return u.href;
 }catch(_){}
 return "";
}
function setReady(value,label){
 ready=!!value;
 statusLine.classList.toggle("ready",ready);
 statusLine.querySelector(".fa-status-label").textContent=label||(ready?"Online · product and order assistant":"Assistant temporarily unavailable");
 input.disabled=busy;sendButton.disabled=busy;
 promptButtons.forEach(b=>b.disabled=!ready||busy);
}
function toggle(open){
 const next=typeof open==="boolean"?open:!panel.classList.contains("is-open");
 panel.classList.toggle("is-open",next);
 panel.setAttribute("aria-hidden",String(!next));
 launch.setAttribute("aria-expanded",String(next));
 panel.style.opacity=next?"1":"0";
 panel.style.visibility=next?"visible":"hidden";
 panel.style.pointerEvents=next?"auto":"none";
 panel.style.transform=next?"translateY(0)":"translateY(10px)";
 if(next)window.setTimeout(()=>input.focus(),100);
}
function typing(){
 const n=el("div","fa-message fa-typing-message");
 const dots=el("span","fa-typing");
 for(let i=0;i<3;i++)dots.appendChild(el("i"));
 n.appendChild(dots);chat.appendChild(n);scroll();return n;
}
function showProducts(products){
 if(!Array.isArray(products)||!products.length)return;
 const wrap=el("section","fa-products");
 wrap.appendChild(el("div","fa-products-heading","আপনার জন্য পাওয়া পণ্য"));
 products.slice(0,6).forEach(p=>{
  if(!p||!p.product_id||!p.name)return;
  const card=el("article","fa-product-card");
  const img=el("img","fa-product-image");img.alt=p.name;img.loading="lazy";img.src=imageSource(p.image_url);img.onerror=()=>img.hidden=true;
  const info=el("div","fa-product-info");
  info.append(
   el("div","fa-product-category",p.category||"FORME"),
   el("h4","fa-product-name",p.name),
   el("p","fa-product-description",p.description||"বিস্তারিত জানতে জিজ্ঞেস করুন।"),
   el("div","fa-product-price","তালিকাভুক্ত মূল্য "+money(p.price_bdt)),
   el("div","fa-product-status",p.availability_status==="in_stock"?"স্টক: ক্যাটালগে উপলব্ধ":p.availability_status==="preorder"?"প্রি-অর্ডার; টিম নিশ্চিত করবে":"স্টক ও চূড়ান্ত দাম যাচাই সাপেক্ষে")
  );
  const order=el("button","fa-order-button","এই পণ্যটি অর্ডার করতে চাই");
  order.type="button";
  order.addEventListener("click",()=>openOrder([{
   product_id:String(p.product_id),product_name:String(p.name),category:String(p.category||""),
   image_url:imageSource(p.image_url),unit_price_bdt:Number(p.price_bdt||0),quantity:1,
   requested_variant:"",availability_status:String(p.availability_status||"needs_confirmation"),
   details_verified:p.details_verified===true
  }]));
  info.appendChild(order);card.append(img,info);wrap.appendChild(card);
 });
 if(wrap.children.length>1){chat.appendChild(wrap);scroll();}
}
function field(label,name,opts){
 const o=opts||{},box=el("label","fa-order-field");
 box.appendChild(el("span","",label));
 const c=el(o.multiline?"textarea":"input","fa-order-control");
 if(o.multiline)c.rows=o.rows||2;else c.type=o.type||"text";
 c.name=name;c.maxLength=o.maxLength||200;c.autocomplete=o.autocomplete||"off";
 if(o.required)c.required=true;
 if(o.placeholder)c.placeholder=o.placeholder;
 if(o.pattern)c.pattern=o.pattern;
 if(o.title)c.title=o.title;
 box.appendChild(c);return box;
}
function openOrder(items){
 if(!Array.isArray(items)||!items.length)return;
 const draft={items:items.map(i=>({
  product_id:String(i.product_id||""),product_name:String(i.product_name||i.name||""),
  category:String(i.category||""),image_url:imageSource(i.image_url),
  unit_price_bdt:Number(i.unit_price_bdt||i.price_bdt||0),
  quantity:Math.min(10,Math.max(1,Number(i.quantity)||1)),
  requested_variant:String(i.requested_variant||""),
  availability_status:String(i.availability_status||"needs_confirmation"),
  details_verified:i.details_verified===true
 }))};
 history.push({role:"model",text:"Selected FORME catalogue items for an order request: "+draft.items.map(i=>i.product_id+" | "+i.product_name).join("; ")});
 message("চমৎকার পছন্দ! অর্ডার রিকোয়েস্ট পাঠানোর আগে নিচের ফর্মে আপনার তথ্য, সাইজ/ভ্যারিয়েন্ট ও পরিমাণ যাচাই করুন।","");
 renderOrderForm(draft);
}
function renderOrderForm(draft){
 const form=el("form","fa-order-form");
 form.append(el("div","fa-order-form-title","অর্ডার রিকোয়েস্ট"),el("p","fa-order-form-copy","পণ্য ও তথ্য যাচাই করে সাবমিট করুন। এখনই কোনো পেমেন্ট নেওয়া হবে না।"));
 const items=el("div","fa-order-items"),rows=[];
 (draft.items||[]).forEach((item,i)=>{
  const row=el("div","fa-order-item"),img=el("img","fa-order-thumb");
  img.alt=item.product_name;img.src=imageSource(item.image_url);img.onerror=()=>img.hidden=true;
  const details=el("div","fa-order-item-detail");
  details.append(el("strong","",item.product_name),el("small","",item.category+" · তালিকাভুক্ত মূল্য "+money(item.unit_price_bdt)),el("small","fa-order-unverified","চূড়ান্ত দাম ও স্টক টিম নিশ্চিত করবে"));
  const variant=el("input","fa-order-control");variant.name="variant_"+i;variant.maxLength=80;variant.placeholder="সাইজ / রং (যেমন M, L, 32, Black)";variant.value=item.requested_variant||"";
  const qty=el("input","fa-order-control fa-order-quantity");qty.type="number";qty.name="quantity_"+i;qty.min="1";qty.max="10";qty.step="1";qty.value=String(item.quantity||1);qty.required=true;
  details.append(variant,qty);row.append(img,details);items.appendChild(row);
  rows.push({product_id:item.product_id,variant,qty});
 });
 form.appendChild(items);
 const grid=el("div","fa-order-grid");
 grid.append(
  field("আপনার নাম *","customer_name",{required:true,maxLength:120,autocomplete:"name"}),
  field("মোবাইল নম্বর *","customer_phone",{required:true,maxLength:20,autocomplete:"tel",placeholder:"01XXXXXXXXX",pattern:"(?:\\+?88)?01[3-9][0-9]{8}",title:"বাংলাদেশের বৈধ মোবাইল নম্বর লিখুন।"}),
  field("ইমেইল (ঐচ্ছিক)","customer_email",{type:"email",maxLength:254,autocomplete:"email"}),
  field("জেলা *","district",{required:true,maxLength:80,autocomplete:"address-level1",placeholder:"যেমন: Dhaka"}),
  field("এলাকা / থানা","area",{maxLength:100,autocomplete:"address-level2"}),
  field("পোস্ট কোড","postal_code",{maxLength:20,autocomplete:"postal-code"})
 );
 form.appendChild(grid);
 form.appendChild(field("সম্পূর্ণ ডেলিভারি ঠিকানা *","delivery_address",{required:true,maxLength:500,multiline:true,rows:3,autocomplete:"street-address",placeholder:"বাড়ি/রোড, এলাকা, থানা, জেলা"}));
 form.appendChild(field("অতিরিক্ত নির্দেশনা (ঐচ্ছিক)","customer_note",{maxLength:400,multiline:true,rows:2,placeholder:"ডেলিভারি সংক্রান্ত নির্দেশনা"}));

 const privacy=el("label","fa-consent"),privacyBox=el("input");
 privacyBox.type="checkbox";privacyBox.name="privacy_consent";privacyBox.required=true;
 const privacyText=el("span");privacyText.appendChild(document.createTextNode("আমি "));
 const privacyLink=el("a","","Privacy Policy");privacyLink.href=BASE+"pages/privacy.html";privacyLink.target="_blank";privacyLink.rel="noopener noreferrer";
 privacyText.append(privacyLink,document.createTextNode(" পড়ে অর্ডারের তথ্য ব্যবহারে সম্মতি দিচ্ছি।"));
 privacy.append(privacyBox,privacyText);form.appendChild(privacy);

 const terms=el("label","fa-consent"),termsBox=el("input");
 termsBox.type="checkbox";termsBox.name="terms_accepted";termsBox.required=true;
 const termsText=el("span");termsText.appendChild(document.createTextNode("আমি "));
 const termsLink=el("a","","Terms & Conditions");termsLink.href=BASE+"pages/terms.html";termsLink.target="_blank";termsLink.rel="noopener noreferrer";
 termsText.append(termsLink,document.createTextNode(" মেনে নিচ্ছি।"));
 terms.append(termsBox,termsText);form.appendChild(terms);

 form.appendChild(el("p","fa-order-disclaimer","এটি Cash on Delivery অর্ডার রিকোয়েস্ট। FORME টিম পণ্যের স্টক, সাইজ/ভ্যারিয়েন্ট, চূড়ান্ত মূল্য ও ডেলিভারি চার্জ যাচাই করে আপনার সঙ্গে যোগাযোগ করবে।"));
 const submit=el("button","fa-order-submit","অর্ডার রিকোয়েস্ট জমা দিন");submit.type="submit";form.appendChild(submit);
 const status=el("div","fa-order-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");form.appendChild(status);

 form.addEventListener("submit",async event=>{
  event.preventDefault();if(form.dataset.submitting==="true"||!form.reportValidity())return;
  const selected=[];
  for(const row of rows){
   const q=Number(row.qty.value);
   if(!Number.isInteger(q)||q<1||q>10){status.textContent="প্রতিটি পণ্যের পরিমাণ ১ থেকে ১০-এর মধ্যে দিন।";return;}
   selected.push({product_id:row.product_id,quantity:q,requested_variant:row.variant.value.trim().slice(0,80)});
  }
  if(selected.reduce((s,i)=>s+i.quantity,0)>20){status.textContent="একটি অর্ডারে সর্বোচ্চ ২০টি পণ্য নেওয়া যাবে।";return;}
  const order={
   customer_name:form.elements.customer_name.value.trim(),
   customer_phone:form.elements.customer_phone.value.trim(),
   customer_email:form.elements.customer_email.value.trim(),
   district:form.elements.district.value.trim(),
   area:form.elements.area.value.trim(),
   postal_code:form.elements.postal_code.value.trim(),
   delivery_address:form.elements.delivery_address.value.trim(),
   customer_note:form.elements.customer_note.value.trim(),
   privacy_consent:privacyBox.checked,terms_accepted:termsBox.checked,items:selected
  };
  form.dataset.submitting="true";submit.disabled=true;status.textContent="সার্ভারে অর্ডার রিকোয়েস্ট পাঠানো হচ্ছে…";
  try{
   const response=await fetch(COMMERCE_API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({action:"order",order})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.ok||!data.order||!data.order.order_number)throw new Error(data.error||"অর্ডার রিকোয়েস্ট সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");
   const saved=data.order;form.replaceWith(orderSuccess(saved));
   history.push({role:"model",text:"Order request successfully saved by the commerce API. Reference: "+String(saved.order_number)+". Status: pending_review; not a confirmed sale."});
  }catch(error){
   status.textContent=error&&error.message?error.message:"সংযোগ সমস্যার কারণে অর্ডার জমা হয়নি।";
   form.dataset.submitting="false";submit.disabled=false;
  }
 });
 chat.appendChild(form);scroll();
 const first=form.querySelector('[name="customer_name"]');if(first)first.focus();
}
function orderSuccess(order){
 const card=el("section","fa-order-success");
 card.append(el("div","fa-order-success-mark","✓"),el("h4","","অর্ডার রিকোয়েস্ট জমা হয়েছে"),
  el("p","","আপনার রিকোয়েস্ট সার্ভারে সংরক্ষিত হয়েছে। FORME টিম পণ্য, স্টক, ভ্যারিয়েন্ট, চূড়ান্ত মূল্য ও ডেলিভারি যাচাই করে যোগাযোগ করবে."),
  el("div","fa-order-reference",String(order.order_number||"")),
  el("div","fa-order-success-note","স্ট্যাটাস: যাচাইয়ের অপেক্ষায় (Pending review)"));
 if(Number(order.subtotal_bdt)>0)card.appendChild(el("div","fa-order-success-note","সার্ভার-হিসাব করা তালিকাভুক্ত পণ্যমূল্য: "+money(order.subtotal_bdt)+" · ডেলিভারি ও চূড়ান্ত মোট পরে নিশ্চিত হবে।"));
 const link=el("a","fa-order-track","অর্ডারের অবস্থা দেখুন");link.href=BASE+"pages/order-tracking.html";card.appendChild(link);return card;
}
async function refreshStatus(){
 try{
  const response=await fetch(API,{method:"GET",cache:"no-store",headers:{"Accept":"application/json"}});
  const data=await response.json().catch(()=>({}));
  if(response.ok&&data.status==="configured"){
   setReady(true,"Online · live product catalogue & order requests");
   message("হ্যালো! আমি FORME-এর AI Shopping Assistant। পণ্য খুঁজে দিতে, ছবি দেখাতে, তুলনা করতে এবং আপনার অনুরোধে অর্ডার রিকোয়েস্ট জমা দিতে পারি। কী খুঁজছেন?","");
  }else{
   setReady(false,"Temporarily paused");
   message("FORME AI সহকারীটি আপাতত চালু নেই। অর্ডার করতে Cart/Checkout ব্যবহার করুন অথবা Contact পেজে বার্তা দিন.","system");
  }
 }catch(_){setReady(false,"Connection unavailable");message("সহকারীর সঙ্গে সংযোগ করা যাচ্ছে না। পরে আবার চেষ্টা করুন।","system");}
}
async function sendMessage(value){
 const text=String(value||"").trim();if(!text||busy)return;
 input.value="";message(text,"user");const wait=typing();busy=true;setReady(ready,"পণ্য ও তথ্য খোঁজা হচ্ছে…");
 const prior=history.slice(-8).map(x=>({role:x.role,text:x.text}));
 const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),55000);
 try{
  const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({message:text,history:prior}),signal:controller.signal});
  const data=await response.json().catch(()=>({}));wait.remove();
  if(!response.ok||!data.ok||!data.reply){
   if(response.status===429||data.status==="rate_limited"){setReady(true,"Message limit reached");message("মেসেজ সীমা পূর্ণ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।","system");}
   else{setReady(false,data.status==="upstream_timeout"?"Connection timed out":"AI service issue");message(data.error||"দুঃখিত, এখন উত্তর পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।","system");}
   return;
  }
  setReady(true,"Online · catalogue connected");
  history.push({role:"user",text},{role:"model",text:String(data.reply)+(data.context?"\n\n[Internal catalogue context: "+String(data.context).slice(0,1800)+"]":"")});
  while(history.length>8)history.shift();
  message(data.reply,"");showProducts(data.products);
  if(data.orderDraft&&Array.isArray(data.orderDraft.items)&&data.orderDraft.items.length)renderOrderForm(data.orderDraft);
 }catch(error){
  wait.remove();const timed=error&&(error.name==="AbortError"||error.name==="TimeoutError");
  setReady(false,timed?"Connection timed out":"Connection unavailable");
  message(timed?"উত্তর পেতে বেশি সময় লাগছে। আবার চেষ্টা করুন।":"নেটওয়ার্ক সমস্যার কারণে উত্তর পাওয়া যায়নি।","system");
 }finally{window.clearTimeout(timer);busy=false;setReady(ready,ready?"Online · product and order assistant":"Connection issue · retry available");input.focus();}
}
function mount(){
 if(document.getElementById("forme-ai-widget"))return;
 const root=document.createElement("div");root.id="forme-ai-widget";
 root.innerHTML=
 '<section class="fa-panel" role="dialog" aria-modal="false" aria-hidden="true" aria-label="FORME AI shopping assistant">'+
 '<header class="fa-head"><div class="fa-brand"><span class="fa-mark" aria-hidden="true">F.</span><div><div class="fa-title">FORME Shopping Assistant</div><div class="fa-subtitle">DISCOVER · COMPARE · ORDER</div></div></div><button type="button" class="fa-close" data-fa-close aria-label="Close assistant">×</button></header>'+
 '<div class="fa-status" role="status" aria-live="polite"><span class="fa-status-dot"></span><span class="fa-status-label">Checking secure connection…</span></div>'+
 '<div class="fa-chat" aria-live="polite" aria-label="Conversation"></div>'+
 '<div class="fa-prompts"><button class="fa-prompt" type="button" data-fa-prompt="Show me some shirts.">শার্ট দেখাও</button><button class="fa-prompt" type="button" data-fa-prompt="Show me polo T-shirts within ৳1500.">পোলো টি-শার্ট</button><button class="fa-prompt" type="button" data-fa-prompt="Help me choose the right clothing size and fit.">সাইজ ও ফিট</button></div>'+
 '<div class="fa-warning">চ্যাটে ফোন নম্বর বা ঠিকানা লিখবেন না। অর্ডারের জন্য নিরাপদ ফর্ম ব্যবহার করুন। <a href="'+BASE+'pages/order-tracking.html">Track an order</a>.</div>'+
 '<form class="fa-form"><textarea class="fa-input" rows="1" maxlength="1200" placeholder="কী পণ্য খুঁজছেন? লিখুন…" aria-label="Your message"></textarea><button class="fa-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24"><path d="m21 3-7.5 18-3.7-7.8L2 9.5 21 3Z"/><path d="M9.8 13.2 14 9"/></svg></button></form>'+
 '<div class="fa-foot">Pilot catalogue · stock and final price confirmed by FORME</div></section>'+
 '<button type="button" class="fa-launch" aria-expanded="false" aria-label="Open FORME chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 10h8M8 13.5h5"/></svg><span>SHOP WITH AI</span><i class="fa-launch-dot" aria-hidden="true"></i></button>';
 document.body.appendChild(root);
 panel=root.querySelector(".fa-panel");launch=root.querySelector(".fa-launch");input=root.querySelector(".fa-input");sendButton=root.querySelector(".fa-send");chat=root.querySelector(".fa-chat");statusLine=root.querySelector(".fa-status");promptButtons=Array.from(root.querySelectorAll("[data-fa-prompt]"));
 launch.addEventListener("click",()=>toggle());root.querySelector("[data-fa-close]").addEventListener("click",()=>toggle(false));
 root.querySelector(".fa-form").addEventListener("submit",e=>{e.preventDefault();sendMessage(input.value);});
 input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input.value);}});
 promptButtons.forEach(b=>b.addEventListener("click",()=>sendMessage(b.dataset.faPrompt)));
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.classList.contains("is-open"))toggle(false);});
 refreshStatus();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
