(function () {
  "use strict";
  const API="https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const KEY="sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const BASE="/fashionstore/";
  const params=new URLSearchParams(window.location.search);
  const product={name:(params.get("name")||"").trim().slice(0,180),category:(params.get("category")||"FORME catalogue").trim().slice(0,300),image:(params.get("image")||"").trim(),source:(params.get("source")||"").trim().slice(0,500)};
  const form=document.getElementById("fc-catalogue-order-form"),status=document.getElementById("fc-catalogue-status"),submit=document.getElementById("fc-catalogue-submit");
  const image=document.getElementById("fc-catalogue-image"),title=document.getElementById("fc-catalogue-name"),category=document.getElementById("fc-catalogue-category");
  const nameField=document.getElementById("fc-catalogue-product-name"),categoryField=document.getElementById("fc-catalogue-product-category"),imageField=document.getElementById("fc-catalogue-image-url"),sourceField=document.getElementById("fc-catalogue-source-path");
  const validImage=/^https:\/\/images\.unsplash\.com\/photo-[A-Za-z0-9-]+(?:\?[A-Za-z0-9_=&%.,-]*)?$/.test(product.image)||/^\/fashionstore\/assets\/fashion-photos\/[a-z0-9-]+\.jpg$/i.test(product.image);
  if(!form||!product.name||!validImage||!product.source.startsWith(BASE)){if(status)status.textContent="এই পণ্যের অর্ডার তথ্য সঠিক নয়। পণ্যের পেজে ফিরে গিয়ে আবার চেষ্টা করুন।";if(submit)submit.disabled=true;return;}
  title.textContent=product.name;category.textContent=product.category;image.src=product.image;image.alt=product.name;
  nameField.value=product.name;categoryField.value=product.category;imageField.value=product.image;sourceField.value=product.source;
  form.addEventListener("submit",async event=>{
    event.preventDefault();if(!form.reportValidity()||submit.disabled)return;
    const data=new FormData(form);
    const order={
      customer_name:String(data.get("customer_name")||"").trim(),customer_phone:String(data.get("customer_phone")||"").trim(),
      customer_email:String(data.get("customer_email")||"").trim(),district:String(data.get("district")||"").trim(),
      area:String(data.get("area")||"").trim(),delivery_address:String(data.get("delivery_address")||"").trim(),
      customer_note:String(data.get("customer_note")||"").trim(),requested_variant:String(data.get("requested_variant")||"").trim(),
      quantity:Number(data.get("quantity")||1),product_name:product.name,category:product.category,image_url:product.image,source_path:product.source,
      privacy_consent:data.get("privacy_consent")==="on",terms_accepted:data.get("terms_accepted")==="on",
      privacy_policy_version:"2026-11-03",terms_version:"2026-11-03"
    };
    submit.disabled=true;submit.textContent="পাঠানো হচ্ছে…";status.textContent="আপনার অর্ডার রিকোয়েস্ট নিরাপদে পাঠানো হচ্ছে…";
    try{
      const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({action:"catalogue-order",order,website:String(data.get("website")||"")})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||!payload.ok||!payload.order||!payload.order.order_number)throw new Error(payload.error||"রিকোয়েস্ট পাঠানো যায়নি। তথ্য পরীক্ষা করে আবার চেষ্টা করুন।");
      window.location.assign(BASE+"pages/order-confirmation.html?ref="+encodeURIComponent(payload.order.order_number));
    }catch(error){status.textContent=error&&error.message?error.message:"নেটওয়ার্ক সমস্যার কারণে পাঠানো যায়নি। আবার চেষ্টা করুন.";submit.disabled=false;submit.textContent="অর্ডার রিকোয়েস্ট পাঠান";}
  });
})();