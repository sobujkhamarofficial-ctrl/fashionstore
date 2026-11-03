(function(){
"use strict";
const cards=Array.from(document.querySelectorAll("[data-blog-card]"));
const search=document.querySelector("#fb-search");
const filters=Array.from(document.querySelectorAll("[data-blog-filter]"));
const count=document.querySelector("#fb-results");
const empty=document.querySelector("#fb-empty");
let active="all";
function render(){
 const query=(search?.value||"").trim().toLocaleLowerCase();
 let shown=0;
 cards.forEach(card=>{
  const topic=card.dataset.topic||"";
  const haystack=(card.dataset.search||"").toLocaleLowerCase();
  const visible=(active==="all"||topic===active)&&(!query||haystack.includes(query));
  card.hidden=!visible;if(visible)shown++;
 });
 if(count)count.textContent=shown+" of "+cards.length+" articles";
 if(empty)empty.hidden=shown!==0;
}
filters.forEach(button=>button.addEventListener("click",()=>{
 active=button.dataset.blogFilter||"all";
 filters.forEach(item=>item.classList.toggle("active",item===button));
 render();
}));
if(search)search.addEventListener("input",render);
document.querySelectorAll("[data-blog-share]").forEach(button=>button.addEventListener("click",async()=>{
 const text=location.href;
 try{if(navigator.share)await navigator.share({title:document.title,url:text});else{await navigator.clipboard.writeText(text);button.textContent="Link copied";}}
 catch(_){}
}));
render();
})();