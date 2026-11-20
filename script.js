(()=>{"use strict";
const form=document.getElementById("registration-form");if(!form)return;
const steps=[...document.querySelectorAll(".form-step")],indicators=[...document.querySelectorAll("[data-step-indicator]")];
const prev=document.getElementById("prev-step"),next=document.getElementById("next-step"),submit=document.getElementById("submit-form"),alertBox=document.getElementById("form-alert"),progress=document.getElementById("progress-fill");
let current=0;const digits=n=>String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[+d]);const say=m=>alertBox.textContent=m;
const val=n=>{const e=form.elements[n];return e&&e.value.trim()?e.value.trim():"—"};

/* Egyptian national ID -> date of birth consistency */
function toWesternDigits(value){return String(value).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));}
function getBirthDateFromNationalId(raw){
 const id=toWesternDigits(raw).replace(/\s/g,"");
 if(!/^([23])\d{12}$/.test(id)) return null;
 const century=id[0]==="2"?1900:2000;
 const year=century+Number(id.slice(1,3));
 const month=Number(id.slice(3,5));
 const day=Number(id.slice(5,7));
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day) return null;
 return String(year).padStart(4,"0")+"-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0");
}
const nationalIdInput=form.elements.nationalId;
const birthDateInput=form.elements.birthDate;
if(nationalIdInput&&birthDateInput){
 nationalIdInput.addEventListener("input",()=>{
  const normalized=toWesternDigits(nationalIdInput.value).replace(/\s/g,"");
  if(nationalIdInput.value!==normalized) nationalIdInput.value=normalized;
  const inferred=getBirthDateFromNationalId(normalized);
  nationalIdInput.removeAttribute("aria-invalid");
  if(inferred){
   birthDateInput.value=inferred;
   birthDateInput.dataset.fromNationalId="true";
   birthDateInput.removeAttribute("aria-invalid");
  }else if(normalized.length>=7){
   birthDateInput.dataset.fromNationalId="false";
  }
 });
 birthDateInput.addEventListener("change",()=>{
  birthDateInput.dataset.fromNationalId="false";
 });
}

function validate(i){for(const e of steps[i].querySelectorAll("input[required],select[required],textarea[required]")){if(e.type==="checkbox"&&!e.checked){say("يرجى الموافقة على التعهد والإقرار للمتابعة.");e.focus();return false}if(e.type!=="checkbox"&&!e.value.trim()){say("يرجى استكمال الحقول الإجبارية قبل الانتقال.");e.focus();return false}if(!e.checkValidity()){say(e.type==="email"?"يرجى إدخال بريد إلكتروني صحيح.":"يرجى مراجعة البيانات المدخلة.");e.focus();return false}}
if(i===0){
 const id=toWesternDigits(form.elements.nationalId.value.trim());
 if(!/^\d{14}$/.test(id)){say("الرقم القومي يجب أن يتكون من 14 رقمًا.");form.elements.nationalId.focus();return false}
 const idDate=getBirthDateFromNationalId(id);
 if(!idDate){say("الرقم القومي غير صحيح أو تاريخ الميلاد الموجود بداخله غير صالح.");form.elements.nationalId.focus();return false}
 if(form.elements.birthDate.value!==idDate){say("تاريخ الميلاد لا يطابق تاريخ الميلاد المسجل داخل الرقم القومي.");form.elements.birthDate.focus();return false}
 if(!form.elements.email.checkValidity()){say("يرجى إدخال بريد إلكتروني صحيح.");form.elements.email.focus();return false}
 if(!/^[+\d\s()-]{8,20}$/.test(form.elements.phone.value.trim())){say("يرجى مراجعة رقم الهاتف.");form.elements.phone.focus();return false}
}return true}
const labels={fullName:"الاسم رباعي",email:"البريد الإلكتروني",nationalId:"الرقم القومي",birthDate:"تاريخ الميلاد",gender:"النوع",governorate:"المحافظة",city:"المدينة / المركز",phone:"رقم الهاتف",diocese:"الإيبارشية",church:"الكنيسة",confessor:"أب الاعتراف",currentService:"الخدمة الحالية",educationLevel:"المرحلة الدراسية",institution:"المدرسة / الجامعة",faculty:"الكلية / التخصص",universityYear:"السنة الجامعية",studies:"الدراسات السابقة",talents:"المواهب",skills:"المهارات",chantLevel:"مستوى الألحان",copticLevel:"مستوى القبطي",ritualLevel:"مستوى الطقس"};
function review(){const box=document.getElementById("review-summary");box.replaceChildren();Object.entries(labels).forEach(([k,l])=>{const item=document.createElement("div");item.className="review-item";const s=document.createElement("small");s.textContent=l;const b=document.createElement("strong");b.textContent=val(k);item.append(s,b);box.append(item)});
document.getElementById("church-diocese").textContent=val("diocese");document.getElementById("church-name").textContent=val("church");document.getElementById("church-confessor").textContent=val("confessor");document.getElementById("church-service").textContent=val("currentService");
const files=[...form.querySelectorAll('input[type="file"]')].flatMap(e=>[...e.files].map(f=>f.name));if(files.length){const item=document.createElement("div");item.className="review-item";item.innerHTML="<small>الملفات المختارة</small>";const b=document.createElement("strong");b.textContent=files.join("، ");item.append(b);box.append(item)}}
function render(){steps.forEach((s,i)=>{s.hidden=i!==current;s.classList.toggle("active",i===current)});indicators.forEach((e,i)=>{e.classList.toggle("active",i===current);e.classList.toggle("done",i<current)});const p=Math.round((current+1)/steps.length*100);progress.style.width=(current/(steps.length-1)*82)+"%";document.getElementById("step-number").textContent="الخطوة "+digits(current+1)+" من "+digits(steps.length);document.getElementById("progress-percent").textContent=digits(p)+"٪";prev.disabled=current===0;next.hidden=current===steps.length-1;submit.hidden=current!==steps.length-1;if(current===4||current===5)review();alertBox.textContent=""}
next.addEventListener("click",()=>{if(validate(current)&&current<steps.length-1){current++;render();window.scrollTo({top:0,behavior:"smooth"})}});
prev.addEventListener("click",()=>{if(current>0){current--;render();window.scrollTo({top:0,behavior:"smooth"})}});
indicators.forEach((e,i)=>e.addEventListener("click",()=>{if(i<current){current=i;render();window.scrollTo({top:0,behavior:"smooth"})}}));
form.addEventListener("input",()=>alertBox.textContent="");form.addEventListener("change",()=>alertBox.textContent="");
form.addEventListener("submit",e=>{e.preventDefault();if(current!==5||!validate(5))return;say("لم يتم إرسال الطلب: ربط Google Forms أو قاعدة بيانات آمنة لم يُفعّل بعد. لا تُدخل بيانات حقيقية في هذه النسخة التجريبية.")});render();
})();