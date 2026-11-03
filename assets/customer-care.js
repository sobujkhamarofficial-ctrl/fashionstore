(function () {
"use strict";
const API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/fashion-customer-care";
const COMMERCE_API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
const BASE="/fashionstore/";
const history=[];
let ready=false,busy=false,panel,launch,input,sendButton,chat,statusLine,promptButtons=[];


const SESSION_ID=(()=>{try{return crypto.randomUUID();}catch(_){return Date.now().toString(16)+"-"+Math.random().toString(16).slice(2);}})();
const MEMORY_ENABLED_KEY="forme-ai-style-memory-enabled";
const MEMORY_IDS_KEY="forme-ai-style-memory-ids";
let photoInput,voiceButton,memoryToggle;
function rememberedIds(){
 try{return localStorage.getItem(MEMORY_ENABLED_KEY)==="1"?JSON.parse(localStorage.getItem(MEMORY_IDS_KEY)||"[]").filter(x=>typeof x==="string").slice(0,5):[];}catch(_){return [];}
}
function setMemory(enabled){
 try{if(enabled)localStorage.setItem(MEMORY_ENABLED_KEY,"1");else{localStorage.removeItem(MEMORY_ENABLED_KEY);localStorage.removeItem(MEMORY_IDS_KEY);}}catch(_){}
 if(memoryToggle)memoryToggle.checked=!!enabled;
}
function rememberProduct(id){
 if(!id)return;
 if(localStorage.getItem(MEMORY_ENABLED_KEY)!=="1"){message("স্টাইল মেমরি ব্যবহার করতে আগে নিচের অপশনটি চালু করুন।","system");return;}
 const ids=rememberedIds().filter(x=>x!==id);ids.unshift(id);
 try{localStorage.setItem(MEMORY_IDS_KEY,JSON.stringify(ids.slice(0,5)));}catch(_){}
 message("এই পণ্যটি আপনার ডিভাইসের স্টাইল পছন্দে রাখা হয়েছে।","system");
}
async function prepareImage(file){
 if(!file||!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("JPG, PNG অথবা WebP ছবি নির্বাচন করুন।");
 if(file.size>6*1024*1024)throw new Error("ছবিটি ৬ MB-এর ছোট হতে হবে।");
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=url;await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error("ছবিটি খোলা যায়নি।"));});
  const scale=Math.min(1,1100/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("ছবি প্রস্তুত করা যাচ্ছে না।");ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.78));
  if(!blob||blob.size>1500000)throw new Error("ছবিটি ১.৫ MB-এর কম করা যায়নি। অন্য ছবি ব্যবহার করুন।");
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]||"");reader.onerror=()=>reject(new Error("ছবিটি পড়া যায়নি।"));reader.readAsDataURL(blob);});
  return {mimeType:"image/jpeg",data};
 }finally{URL.revokeObjectURL(url);}
}
function speakReply(text){
 if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){message("এই ব্রাউজারে voice playback সমর্থিত নয়।","system");return;}
 window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(String(text||""));
 utterance.lang=/[\u0980-\u09ff]/.test(utterance.text)?"bn-BD":"en-US";utterance.rate=0.96;window.speechSynthesis.speak(utterance);
}
async function saveFeedback(rating,reason,intent,sentiment,model,latency,node){
 try{
  const response=await fetch(COMMERCE_API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({
   action:"ai-feedback",rating,reason,intent:intent||"general",sentiment:sentiment||"neutral",model:model||null,session_id:SESSION_ID,
   page_path:window.location.pathname,latency_ms:Math.max(0,Math.min(180000,Math.round(latency||0)))
  })});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.ok)throw new Error(data.error||"ফিডব্যাক জমা হয়নি।");
  node.replaceChildren(el("span","fa-feedback-thanks","ধন্যবাদ, আপনার মতামত সংরক্ষিত হয়েছে।"));
 }catch(error){node.appendChild(el("span","fa-feedback-error",error.message||"ফিডব্যাক জমা হয়নি।"));}
}
function addReplyControls(replyNode,data,latency){
 const actions=el("div","fa-reply-actions"),good=el("button","fa-feedback-button","👍 সহায়ক"),bad=el("button","fa-feedback-button","👎 সমস্যা");
 const speak=el("button","fa-speak-button","🔊 শুনুন");speak.type="button";speak.addEventListener("click",()=>speakReply(data.reply));
 const feedback=el("div","fa-feedback-area");good.type="button";bad.type="button";
 good.addEventListener("click",()=>{good.disabled=true;bad.disabled=true;void saveFeedback(1,"helpful",data.intent,data.sentiment,data.model,latency,feedback);});
 bad.addEventListener("click",()=>{
  if(feedback.querySelector(".fa-feedback-reasons"))return;
  const choices=el("div","fa-feedback-reasons");
  [["wrong_information","তথ্য ভুল"],["irrelevant","প্রাসঙ্গিক নয়"],["tone","উত্তরের ধরন"],["other","অন্য সমস্যা"]].forEach(([reason,label])=>{
   const b=el("button","fa-feedback-button",label);b.type="button";b.addEventListener("click",()=>{good.disabled=true;bad.disabled=true;choices.querySelectorAll("button").forEach(x=>x.disabled=true);void saveFeedback(-1,reason,data.intent,data.sentiment,data.model,latency,feedback);});choices.appendChild(b);
  });feedback.appendChild(choices);
 });
 actions.append(good,bad,speak);feedback.appendChild(actions);replyNode.appendChild(feedback);
}
function renderSupportForm(draft){
 const form=el("form","fa-support-form");
 form.append(el("div","fa-order-form-title","FORME কাস্টমার কেয়ার টিকিট"),el("p","fa-order-form-copy","আপনার সমস্যাটি টিমের কাছে পাঠানোর আগে যোগাযোগের তথ্য ও সারাংশ যাচাই করুন।"));
 const typeNames={order:"অর্ডার",delivery:"ডেলিভারি",product:"পণ্য",payment:"পেমেন্ট",other:"অন্যান্য"};
 form.appendChild(el("div","fa-support-meta","বিষয়: "+(typeNames[draft.issue_type]||"অন্যান্য")+" · অগ্রাধিকার: "+(draft.priority==="high"?"জরুরি":"সাধারণ")));
 form.appendChild(field("আপনার নাম *","name",{required:true,maxLength:120,autocomplete:"name"}));
 form.appendChild(field("মোবাইল নম্বর *","phone",{required:true,maxLength:20,autocomplete:"tel",placeholder:"01XXXXXXXXX",pattern:"(?:\\+?88)?01[3-9][0-9]{8}",title:"বাংলাদেশের বৈধ মোবাইল নম্বর লিখুন।"}));
 form.appendChild(field("ইমেইল (ঐচ্ছিক)","email",{type:"email",maxLength:254,autocomplete:"email"}));
 const summary=field("সমস্যার সারাংশ *","summary",{required:true,maxLength:900,multiline:true,rows:4});
 summary.querySelector("textarea").value=String(draft.summary||"").slice(0,900);form.appendChild(summary);
 const consent=el("label","fa-consent"),check=el("input");check.type="checkbox";check.required=true;
 const note=el("span");note.appendChild(document.createTextNode("আমি "));
 const link=el("a","","Privacy Policy");link.href=BASE+"pages/privacy.html";link.target="_blank";link.rel="noopener noreferrer";
 note.append(link,document.createTextNode(" পড়ে এই অনুরোধের জন্য আমার দেওয়া তথ্য ব্যবহারে সম্মতি দিচ্ছি।"));consent.append(check,note);form.appendChild(consent);
 form.appendChild(el("p","fa-order-disclaimer","চ্যাটের সম্পূর্ণ ইতিহাস বা ছবি টিকিটে পাঠানো হবে না। শুধু উপরের সারাংশ ও আপনার দেওয়া যোগাযোগের তথ্য যাবে।"));
 const submit=el("button","fa-order-submit","সহায়তা টিকিট জমা দিন");submit.type="submit";form.appendChild(submit);
 const status=el("div","fa-order-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");form.appendChild(status);
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(form.dataset.submitting==="true"||!form.reportValidity())return;
  const data=new FormData(form),payload={action:"ai-support-ticket",name:String(data.get("name")||"").trim(),phone:String(data.get("phone")||"").trim(),email:String(data.get("email")||"").trim(),issue_type:String(draft.issue_type||"other"),priority:String(draft.priority||"normal"),summary:String(data.get("summary")||"").trim(),privacy_consent:check.checked};
  form.dataset.submitting="true";submit.disabled=true;status.textContent="সাপোর্ট টিকিট জমা হচ্ছে…";
  try{
   const response=await fetch(COMMERCE_API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.ok)throw new Error(result.error||"টিকিট জমা হয়নি। আবার চেষ্টা করুন।");
   const success=el("section","fa-support-success");
   success.append(el("strong","","✓ টিকিট জমা হয়েছে"),el("p","","আপনার সহায়তা অনুরোধটি FORME টিমের ইনবক্সে পাঠানো হয়েছে। আপনার দেওয়া যোগাযোগের মাধ্যমে টিম উত্তর দেবে।"));
   if(result.reference)success.append(el("div","fa-support-reference","Reference: "+String(result.reference)));
   form.replaceWith(success);
  }catch(error){status.textContent=error.message||"টিকিট জমা হয়নি।";form.dataset.submitting="false";submit.disabled=false;}
 });
 chat.appendChild(form);scroll();form.querySelector('[name="name"]').focus();
}

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
  const save=el("button","fa-save-style-button","☆ স্টাইল মনে রাখুন");save.type="button";save.addEventListener("click",()=>rememberProduct(String(p.product_id)));info.appendChild(save);
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
async function sendMessage(value,options){
 const opts=options||{},textValue=String(value||"").trim();
 if((!textValue&&!opts.image)||busy)return;
 input.value="";message(opts.displayText||textValue||"📷 ছবি সংযুক্ত","user");
 const wait=typing();busy=true;setReady(ready,"পণ্য ও তথ্য খোঁজা হচ্ছে…");
 const started=performance.now();
 const prior=history.slice(-8).map(x=>({role:x.role,text:x.text}));
 const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),55000);
 try{
  const payload={message:textValue||"Find similar catalogue items for this garment photo.",history:prior,rememberedProductIds:rememberedIds()};
  if(opts.image)payload.image=opts.image;
  const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload),signal:controller.signal});
  const data=await response.json().catch(()=>({}));wait.remove();
  if(!response.ok||!data.ok||!data.reply){
   if(response.status===429||data.status==="rate_limited"){setReady(true,"Message limit reached");message("মেসেজ সীমা পূর্ণ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।","system");}
   else{setReady(false,data.status==="upstream_timeout"?"Connection timed out":"AI service issue");message(data.error||"দুঃখিত, এখন উত্তর পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।","system");}
   return;
  }
  setReady(true,"Online · catalogue connected");
  history.push({role:"user",text:textValue||"Customer shared a garment image for this request."},{role:"model",text:String(data.reply)+(data.context?"\n\n[Internal catalogue context: "+String(data.context).slice(0,1800)+"]":"")});
  while(history.length>8)history.shift();
  const replyNode=message(data.reply,"");
  addReplyControls(replyNode,data,performance.now()-started);
  showProducts(data.products);
  if(data.orderDraft&&Array.isArray(data.orderDraft.items)&&data.orderDraft.items.length)renderOrderForm(data.orderDraft);
  if(data.supportDraft&&typeof data.supportDraft==="object")renderSupportForm(data.supportDraft);
 }catch(error){
  wait.remove();const timed=error&&(error.name==="AbortError"||error.name==="TimeoutError");
  setReady(false,timed?"Connection timed out":"Connection unavailable");
  message(timed?"উত্তর পেতে বেশি সময় লাগছে। আবার চেষ্টা করুন।":"নেটওয়ার্ক সমস্যার কারণে উত্তর পাওয়া যায়নি।","system");
 }finally{
  window.clearTimeout(timer);busy=false;setReady(ready,ready?"Online · product and order assistant":"Connection issue · retry available");input.focus();
 }
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
 '<div class="fa-warning">চ্যাটে ফোন নম্বর বা ঠিকানা লিখবেন না। ছবি শুধু এই অনুরোধে বিশ্লেষণ হবে, সংরক্ষণ করা হবে না। <a href="'+BASE+'pages/order-tracking.html">Track an order</a>.</div>'+
 '<div class="fa-memory-toggle"><label><input type="checkbox" data-fa-memory> আমার স্টাইল পছন্দ এই ডিভাইসে মনে রাখুন</label><button type="button" data-fa-memory-reset>মুছুন</button></div>'+
 '<form class="fa-form">'+
 '<button class="fa-composer-tool fa-attach" type="button" data-fa-photo aria-label="ছবি দিয়ে পণ্য খুঁজুন" title="ছবি দিয়ে খুঁজুন"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>'+
 '<input type="file" data-fa-file accept="image/jpeg,image/png,image/webp" hidden>'+
 '<textarea class="fa-input" rows="1" maxlength="1200" placeholder="কী পণ্য খুঁজছেন? লিখুন…" aria-label="Your message"></textarea>'+
 '<button class="fa-composer-tool fa-mic" type="button" data-fa-voice aria-label="কথা বলে লিখুন" title="কথা বলে লিখুন"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg></button>'+
 '<button class="fa-send" type="submit" aria-label="Send message" title="পাঠান"><svg viewBox="0 0 24 24"><path d="m21 3-7.5 18-3.7-7.8L2 9.5 21 3Z"/><path d="M9.8 13.2 14 9"/></svg></button></form>'+
 '<div class="fa-foot">Pilot catalogue · stock and final price confirmed by FORME</div></section>'+
 '<button type="button" class="fa-launch" aria-expanded="false" aria-label="Open FORME chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 10h8M8 13.5h5"/></svg><span>SHOP WITH AI</span><i class="fa-launch-dot" aria-hidden="true"></i></button>';
 document.body.appendChild(root);
 panel=root.querySelector(".fa-panel");launch=root.querySelector(".fa-launch");input=root.querySelector(".fa-input");
 sendButton=root.querySelector(".fa-send");chat=root.querySelector(".fa-chat");statusLine=root.querySelector(".fa-status");
 promptButtons=Array.from(root.querySelectorAll("[data-fa-prompt]"));photoInput=root.querySelector("[data-fa-file]");
 memoryToggle=root.querySelector("[data-fa-memory]");voiceButton=root.querySelector("[data-fa-voice]");
 try{memoryToggle.checked=localStorage.getItem(MEMORY_ENABLED_KEY)==="1";}catch(_){memoryToggle.checked=false;}
 launch.addEventListener("click",()=>toggle());root.querySelector("[data-fa-close]").addEventListener("click",()=>toggle(false));
 root.querySelector(".fa-form").addEventListener("submit",e=>{e.preventDefault();sendMessage(input.value);});
 input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input.value);}});
 promptButtons.forEach(b=>b.addEventListener("click",()=>sendMessage(b.dataset.faPrompt)));
 root.querySelector("[data-fa-photo]").addEventListener("click",()=>photoInput.click());
 photoInput.addEventListener("change",async()=>{
  const file=photoInput.files&&photoInput.files[0];photoInput.value="";if(!file)return;
  try{
   const image=await prepareImage(file);
   await sendMessage("এই ছবির মতো পোশাক খুঁজে দাও। ছবির পোশাকের ধরন, রং ও স্টাইল দেখে মিল আছে এমন পণ্য দেখাও।",{image,displayText:"📷 পোশাকের ছবি পাঠানো হয়েছে"});
  }catch(error){message(error.message||"ছবি পাঠানো যায়নি।","system");}
 });
 memoryToggle.addEventListener("change",()=>{
  setMemory(memoryToggle.checked);
  message(memoryToggle.checked?"স্টাইল মেমরি চালু হয়েছে। নির্বাচিত পণ্যের ID শুধু এই ডিভাইসে থাকবে।":"স্টাইল মেমরি বন্ধ করা হয়েছে এবং সংরক্ষিত পণ্যের ID মুছে ফেলা হয়েছে।","system");
 });
 root.querySelector("[data-fa-memory-reset]").addEventListener("click",()=>{
  try{localStorage.removeItem(MEMORY_IDS_KEY);}catch(_){}
  message("সংরক্ষিত স্টাইল পছন্দ মুছে ফেলা হয়েছে।","system");
 });
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition)voiceButton.hidden=true;
 else voiceButton.addEventListener("click",()=>{
  const recognition=new Recognition();recognition.lang="bn-BD";recognition.interimResults=false;recognition.maxAlternatives=1;voiceButton.disabled=true;
  recognition.onresult=event=>{const transcript=event.results&&event.results[0]&&event.results[0][0]?event.results[0][0].transcript:"";if(transcript)input.value=transcript;};
  recognition.onerror=()=>message("ভয়েস ইনপুট পাওয়া যায়নি। আবার চেষ্টা করুন।","system");
  recognition.onend=()=>{voiceButton.disabled=false;input.focus();};
  try{recognition.start();}catch(_){voiceButton.disabled=false;}
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.classList.contains("is-open"))toggle(false);});
 refreshStatus();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
