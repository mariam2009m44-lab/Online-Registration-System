const form=document.getElementById("registration-form");
const steps=[...document.querySelectorAll(".form-step")];
const stepButtons=[...document.querySelectorAll(".step")];
const prev=document.getElementById("prev-btn"),next=document.getElementById("next-btn"),submit=document.getElementById("submit-btn");
const message=document.getElementById("validation-message");
let current=0;
const titles=["البيانات الشخصية","البيانات الكنسية والروحية","البيانات التعليمية والدراسية","المواهب والمهارات","رفع الملفات والتعهد والإقرار"];
function renderStep(){
 steps.forEach((s,i)=>s.classList.toggle("active",i===current));
 stepButtons.forEach((b,i)=>{b.classList.toggle("active",i===current);b.classList.toggle("done",i<current)});
 document.getElementById("progress-fill").style.width=((current+1)/steps.length*100)+"%";
 document.getElementById("step-caption").textContent="المرحلة "+["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][current]+" من خمس مراحل";
 document.getElementById("step-percent").textContent=Math.round((current+1)/steps.length*100)+"%";
 prev.disabled=current===0;next.hidden=current===steps.length-1;submit.hidden=current!==steps.length-1;message.textContent="";
}
function validateCurrent(){
 let ok=true,first=null;
 steps[current].querySelectorAll("[required]").forEach(el=>{
  const field=el.closest(".field");let error="";
  if(el.type==="checkbox"&&!el.checked)error="يرجى الموافقة على الإقرار للمتابعة.";
  else if(!el.value.trim())error="هذا الحقل مطلوب.";
  else if(el.name==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()))error="يرجى إدخال بريد إلكتروني صحيح.";
  else if(el.name==="nationalId"&&!/^\d{14}$/.test(el.value.trim()))error="يجب إدخال 14 رقمًا بالضبط.";
  else if(el.name==="phone"&&!/^[+\d\s()-]{8,20}$/.test(el.value.trim()))error="يرجى مراجعة رقم الهاتف.";
  if(error){ok=false;first??=el;if(field)field.classList.add("invalid");}
  else if(field)field.classList.remove("invalid");
 });
 if(!ok){message.textContent="يرجى مراجعة الحقول المطلوبة والتنبيه بجوارها.";first?.focus();}
 return ok;
}
next.addEventListener("click",()=>{if(validateCurrent()){current=Math.min(current+1,steps.length-1);renderStep();window.scrollTo({top:0,behavior:"smooth"});}});
prev.addEventListener("click",()=>{current=Math.max(0,current-1);renderStep();window.scrollTo({top:0,behavior:"smooth"});});
stepButtons.forEach(b=>b.addEventListener("click",()=>{const target=Number(b.dataset.go);if(target<=current){current=target;renderStep();}else if(validateCurrent()){current=target;renderStep();}}));
form.addEventListener("input",e=>{const f=e.target.closest(".field");if(f)f.classList.remove("invalid");});
form.addEventListener("change",e=>{const f=e.target.closest(".field");if(f)f.classList.remove("invalid");});
form.addEventListener("submit",e=>{
 e.preventDefault();if(!validateCurrent())return;
 const fd=new FormData(form),get=k=>String(fd.get(k)||"").trim();
 const requestId="BMS-"+new Date().getFullYear()+"-"+Math.random().toString(10).slice(2,8);
 // Demo storage intentionally excludes national ID, contact details, and uploaded file contents.
 const record={id:requestId,name:get("fullName"),church:get("church"),diocese:get("diocese"),education:get("educationLevel"),status:"قيد المراجعة",createdAt:new Date().toISOString(),files:[...form.querySelectorAll('input[type="file"]')].flatMap(x=>[...x.files].map(f=>f.name))};
 try{const records=JSON.parse(localStorage.getItem("beminzit_demo_applicants")||"[]");records.unshift(record);localStorage.setItem("beminzit_demo_applicants",JSON.stringify(records));}
 catch(err){message.textContent="تعذر حفظ سجل العرض على هذا المتصفح.";return;}
 form.hidden=true;document.querySelector(".stepper").hidden=true;document.querySelector(".progress-line").hidden=true;document.querySelector(".step-caption").hidden=true;
 const panel=document.getElementById("success-panel");panel.hidden=false;document.getElementById("request-number").textContent=requestId;
});
document.getElementById("new-registration").addEventListener("click",()=>{form.reset();form.hidden=false;document.querySelector(".stepper").hidden=false;document.querySelector(".progress-line").hidden=false;document.querySelector(".step-caption").hidden=false;document.getElementById("success-panel").hidden=true;current=0;renderStep();});
renderStep();