(function () {
  "use strict";
  const reference=(new URLSearchParams(window.location.search).get("ref")||"").trim().toUpperCase();
  const valid=/^FRM-[0-9]{6}-[A-Z0-9]{6}$/.test(reference);
  const refNode=document.getElementById("fc-order-reference"),trackLink=document.getElementById("fc-confirm-track");
  const copyButton=document.getElementById("fc-copy-reference"),note=document.getElementById("fc-confirmation-status");
  if(!valid){refNode.textContent="অর্ডার রেফারেন্স পাওয়া যায়নি।";note.textContent="অর্ডার জমা দেওয়ার সময় পাওয়া রেফারেন্স নম্বরটি ব্যবহার করুন অথবা কাস্টমার কেয়ারে যোগাযোগ করুন.";copyButton.disabled=true;trackLink.removeAttribute("href");trackLink.setAttribute("aria-disabled","true");return;}
  refNode.textContent=reference;trackLink.href="/fashionstore/pages/order-tracking.html?ref="+encodeURIComponent(reference);
  copyButton.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(reference);note.textContent="অর্ডার নম্বর কপি হয়েছে।";}catch(_){note.textContent="অর্ডার নম্বরটি নির্বাচন করে কপি করুন: "+reference;}});
})();