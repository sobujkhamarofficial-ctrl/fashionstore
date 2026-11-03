(function () {
  "use strict";
  const API = "https://zfgcovvfczjiqagrnfjr.supabase.co/functions/v1/storefront-commerce-api";
  const KEY = "sb_publishable_EWY6B3OF8lOQB7uB7jBZRA_3MwimKRy";
  const form = document.getElementById("fc-track-form");
  const status = document.getElementById("fc-track-status");
  const result = document.getElementById("fc-track-result");
  const submit = document.getElementById("fc-track-submit");

  const stages = [
    ["pending_review","COD order received","Your COD order is saved. FORME is checking the item, size or variant, stock, final price and delivery details before confirming dispatch."],
    ["contacted","Customer contacted","The store has contacted you about your request."],
    ["confirmed","Order confirmed","The product and delivery details have been agreed."],
    ["processing","Preparing order","Your order is being prepared."],
    ["shipped","Handed to delivery","The parcel has been handed to the delivery service."],
    ["delivered","Delivered","The order has been marked as delivered."],
    ["cancelled","Cancelled","This order request has been cancelled."],
    ["rejected","Could not be accepted","The store could not accept this order request. Contact customer care for details."]
  ];

  function element(tag, cls, value) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function money(value) {
    return value === null || value === undefined ? "To be confirmed" : "৳" + Number(value).toLocaleString("en-BD");
  }
  function render(order) {
    result.innerHTML = "";
    const heading = element("h2","", "Order " + order.order_number);
    const date = element("p","fc-meta", "Order date: " + new Date(order.created_at).toLocaleString("en-GB"));
    const current = stages.findIndex(s => s[0] === order.status);
    const stage = stages[current] || stages[0];
    const statusCard = element("div","fc-card");
    const statusTitle = element("h3","",stage[1]);
    const statusCopy = element("p","",stage[2]);
    statusCard.append(statusTitle,statusCopy);
    const timeline = element("ol","fc-track-timeline");
    const visibleStages = stages.slice(0,6);
    visibleStages.forEach((s,i)=>{
      const li=element("li", i<=Math.max(0,current) && current<6 ? "done" : "");
      const point=element("span","fc-track-point",i<=Math.max(0,current)&&current<6 ? "✓" : String(i+1));
      const label=element("span","",s[1]);
      li.append(point,label);
      timeline.append(li);
    });
    if(current>=6){
      const terminal=element("p","fc-note",stage[2]);
      statusCard.append(terminal);
    }
    const itemHeading=element("h3","","Items in this order");
    const itemList=element("ul","fc-track-items");
    (order.items||[]).forEach(item=>{
      const parts=[item.product_name,"Qty "+item.quantity,item.requested_variant||""].filter(Boolean).join(" · ");
      itemList.append(element("li","",parts));
    });
    const totals=element("div","fc-track-totals");
    const subtotalLabel = order.order_kind === "catalogue_request" || order.price_verification !== "verified" ? "Listed subtotal · provisional" : "Item subtotal";
    [[subtotalLabel,money(order.subtotal_bdt)],["Delivery",money(order.delivery_charge_bdt)],["Final total",money(order.final_total_bdt)]].forEach(pair=>{
      const row=element("div","");
      row.append(element("span","",pair[0]),element("strong","",pair[1]));
      totals.append(row);
    });
    const courierHeading=element("h3","","Delivery details");
    const courier=element("p","fc-meta",order.courier_name ? "Delivery partner: "+order.courier_name : "Delivery partner: To be confirmed");
    const tracking=element("p","fc-meta",order.courier_tracking_number ? "Tracking reference: "+order.courier_tracking_number : "Courier tracking reference: Not added yet");
    const eta=element("p","fc-meta",order.estimated_delivery_at ? "Estimated delivery: "+new Date(order.estimated_delivery_at).toLocaleDateString("en-GB") : "Estimated delivery: To be confirmed");
    const dispatched=order.dispatched_at ? element("p","fc-meta","Dispatched: "+new Date(order.dispatched_at).toLocaleString("en-GB")) : null;
    const delivered=order.delivered_at ? element("p","fc-meta","Delivered: "+new Date(order.delivered_at).toLocaleString("en-GB")) : null;
    const paymentMethod=element("p","fc-meta","Payment method: "+(order.payment_method==="cash_on_delivery"?"Cash on delivery":String(order.payment_method||"to be confirmed").replaceAll("_"," ")));
    const payment=element("p","fc-meta","Payment status: "+String(order.payment_status||"not collected").replaceAll("_"," "));
    const note=element("div","fc-note",order.price_verification !== "verified" || order.order_kind === "catalogue_request" ? "Any listed subtotal is provisional until FORME verifies the exact product, price and delivery charge. For cash on delivery, pay only the final amount you agree with FORME when the parcel is delivered. Status is updated by the store team; this is not live courier GPS tracking." : "For cash on delivery, pay only the final amount confirmed by FORME when the parcel is delivered. Order status is updated by the store team; this page is not a live courier GPS tracker.");
    result.append(heading,date,statusCard,timeline,itemHeading,itemList,totals,courierHeading,courier,tracking,eta);
    if(dispatched) result.append(dispatched);
    if(delivered) result.append(delivered);
    result.append(paymentMethod,payment,note);
    result.hidden=false;
  }

  if(form){
    const reference = new URLSearchParams(window.location.search).get("ref");
    const orderInput = form.querySelector('[name="order_number"]');
    if (reference && orderInput && /^FRM-[0-9]{6}-[A-Z0-9]{6}$/i.test(reference)) {
      orderInput.value = reference.toUpperCase();
      document.getElementById("fc-track-phone")?.focus();
    }
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      result.hidden=true;
      status.textContent="";
      submit.disabled=true;
      submit.textContent="Checking…";
      try{
        const data=new FormData(form);
        const response=await fetch(API,{
          method:"POST",
          headers:{"Content-Type":"application/json","apikey":KEY},
          body:JSON.stringify({
            action:"track",
            order_number:String(data.get("order_number")||"").trim(),
            customer_phone:String(data.get("customer_phone")||"").trim(),
            website:String(data.get("website")||"")
          })
        });
        const payload=await response.json().catch(()=>({}));
        if(!response.ok||!payload.ok||!payload.order)throw new Error(payload.error||"We could not find that order.");
        render(payload.order);
        status.textContent="Order information verified.";
      }catch(error){
        status.textContent=error&&error.message?error.message:"Tracking is temporarily unavailable.";
      }finally{
        submit.disabled=false;
        submit.textContent="Check order status";
      }
    });
  }
})();
