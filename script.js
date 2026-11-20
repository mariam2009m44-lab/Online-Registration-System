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
 if(!/^([23])\d{13}$/.test(id)) return null;
 const century=id[0]==="2"?1900:2000;
 const year=century+Number(id.slice(1,3));
 const month=Number(id.slice(3,5));
 const day=Number(id.slice(5,7));
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day) return null;
 return String(year).padStart(4,"0")+"-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0");
}
const ageInput=form.elements.age;
function updateAge(iso){if(!ageInput)return;if(!iso){ageInput.value="";return;}const b=new Date(iso+"T00:00:00");if(Number.isNaN(b.getTime())){ageInput.value="";return;}const now=new Date();let years=now.getFullYear()-b.getFullYear();if(now.getMonth()<b.getMonth()||(now.getMonth()===b.getMonth()&&now.getDate()<b.getDate()))years--;ageInput.value=years>=0&&years<=120?String(years):"";}
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
   updateAge(inferred);
   birthDateInput.removeAttribute("aria-invalid");
  }else if(normalized.length>=7){
   birthDateInput.dataset.fromNationalId="false";
  }
 });
 birthDateInput.addEventListener("change",()=>{
  birthDateInput.dataset.fromNationalId="false";
  updateAge(birthDateInput.value);
 });
}

let verifiedNationalId="",verifiedNationalIdFile=null;
const birthCertificateInput=form.elements.birthCertificate;
const ocrStatus=document.getElementById("national-id-ocr-status");
function setOcrStatus(message,state="info"){
 if(!ocrStatus)return;
 ocrStatus.textContent=message;
 ocrStatus.dataset.state=state;
}
if(nationalIdInput) nationalIdInput.addEventListener("input",()=>{
 verifiedNationalId="";verifiedNationalIdFile=null;
 setOcrStatus("تم تغيير الرقم المكتوب. ستتم إعادة المطابقة عند المتابعة.","info");
});
if(birthCertificateInput) birthCertificateInput.addEventListener("change",()=>{
 verifiedNationalId="";verifiedNationalIdFile=null;
 const file=birthCertificateInput.files&&birthCertificateInput.files[0];
 if(!file){setOcrStatus("لم يتم اختيار شهادة الميلاد.","info");return;}
 setOcrStatus("تم اختيار الشهادة. جارٍ قراءة الرقم ومطابقته تلقائيًا...","loading");
 if(next)next.disabled=true;
 verifyNationalIdImage().finally(()=>{if(next)next.disabled=false;});
});
async function verifyNationalIdImage(){
 const entered=toWesternDigits(nationalIdInput.value).replace(/\D/g,"");
 const file=birthCertificateInput&&birthCertificateInput.files&&birthCertificateInput.files[0];
 if(!file){setOcrStatus("ارفع صورة شهادة الميلاد أولاً.","error");say("شهادة الميلاد مطلوبة لمطابقة الرقم القومي.");return false;}
 if(!file.type.startsWith("image/")&&file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")){setOcrStatus("نوع الملف غير مدعوم. استخدم صورة JPG أو PNG أو ملف PDF.","error");say("يرجى رفع شهادة ميلاد واضحة بصيغة JPG أو PNG أو PDF.");return false;}
 if(file.size>5*1024*1024){setOcrStatus("حجم شهادة الميلاد أكبر من 5MB.","error");say("يجب ألا يتجاوز حجم شهادة الميلاد 5MB.");return false;}
 if(verifiedNationalId===entered&&verifiedNationalIdFile===file)return true;
 if(!window.Tesseract){setOcrStatus("تعذر تحميل أداة قراءة الصورة. تحقق من اتصال الإنترنت ثم أعد المحاولة.","error");say("تعذر تشغيل قراءة الصورة. تحقق من الإنترنت وحاول مرة أخرى.");return false;}
 let worker;
 try{
  setOcrStatus("جارٍ قراءة الأرقام من الصورة على جهازك... قد يستغرق ذلك بعض الوقت في أول مرة.","loading");
  worker=await window.Tesseract.createWorker("eng",1);
  await worker.setParameters({tessedit_char_whitelist:"0123456789",tessedit_pageseg_mode:"6"});
  let ocrSource=file;
  if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf")){
   if(!window.pdfjsLib)throw new Error("تعذر تحميل قارئ PDF. جرّب رفع صورة JPG أو PNG.");
   window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
   const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
   const page=await pdf.getPage(1);
   const viewport=page.getViewport({scale:2.5});
   const canvas=document.createElement("canvas");
   canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
   ocrSource=canvas;
  }
  const result=await worker.recognize(ocrSource);
  const recognized=String(result.data.text||"");
  const matches=recognized.match(/(?:\d[\s\r\n-]*){14}/g)||[];
  const candidates=matches.map(value=>value.replace(/\D/g,"")).filter(value=>value.length===14);
  const confidence=Number(result.data.confidence||0);
  if(confidence<55||candidates.length===0){
   setOcrStatus("لم نتمكن من قراءة الرقم بوضوح. ارفع صورة أوضح ومستقيمة يظهر فيها الرقم بالكامل.","error");
   say("تعذرت قراءة الرقم من شهادة الميلاد. يرجى رفع صورة أوضح.");
   return false;
  }
  if(!candidates.includes(entered)){
   setOcrStatus("الرقم المستخرج من الصورة لا يطابق الرقم المكتوب. راجع الرقم أو أعد رفع الصورة الصحيحة.","error");
   say("الرقم القومي المكتوب لا يطابق الرقم الموجود في شهادة الميلاد.");
   return false;
  }
  verifiedNationalId=entered;verifiedNationalIdFile=file;
  setOcrStatus("تمت المطابقة بنجاح: الرقم الموجود في شهادة الميلاد يطابق الرقم المكتوب.","success");
  return true;
 }catch(error){
  console.error("National ID OCR failed:",error);
  setOcrStatus("حدث خطأ أثناء قراءة الصورة. جرّب صورة أوضح أو أعد المحاولة لاحقاً.","error");
  say("حدث خطأ أثناء قراءة شهادة الميلاد. حاول مرة أخرى.");
  return false;
 }finally{
  if(worker){try{await worker.terminate()}catch(_){}}
 }
}
async function validate(i){for(const e of steps[i].querySelectorAll("input[required],select[required],textarea[required]")){if(e.type==="checkbox"&&!e.checked){say("يرجى الموافقة على التعهد والإقرار للمتابعة.");e.focus();return false}if(e.type!=="checkbox"&&!e.value.trim()){say("يرجى استكمال الحقول الإجبارية قبل الانتقال.");e.focus();return false}if(!e.checkValidity()){say(e.type==="email"?"يرجى إدخال بريد إلكتروني صحيح.":"يرجى مراجعة البيانات المدخلة.");e.focus();return false}}
if(i===2){
 const id=toWesternDigits(form.elements.nationalId.value.trim());
 if(!/^\d{14}$/.test(id)){say("الرقم القومي يجب أن يتكون من 14 رقمًا.");form.elements.nationalId.focus();return false}
 const idDate=getBirthDateFromNationalId(id);
 if(!idDate){say("الرقم القومي غير صحيح أو تاريخ الميلاد الموجود بداخله غير صالح.");form.elements.nationalId.focus();return false}
 if(form.elements.birthDate.value!==idDate){say("تاريخ الميلاد لا يطابق تاريخ الميلاد المسجل داخل الرقم القومي.");form.elements.birthDate.focus();return false}
 if(!form.elements.email.checkValidity()){say("يرجى إدخال بريد إلكتروني صحيح.");form.elements.email.focus();return false}
 if(Number(form.elements.age.value)<7){say("يشترط ألا يقل عمر المتقدم عن 7 سنوات.");form.elements.birthDate.focus();return false}
 const areaValue=form.elements.area.value.trim();
 if(/عزبة العرب|القطاوى/.test(areaValue)){say("يرجى إدخال اسم المنطقة أو المدينة / المركز بشكل صحيح.");form.elements.area.focus();return false}
 if(!/^[+\d\s()-]{8,20}$/.test(form.elements.phone.value.trim())){say("يرجى مراجعة رقم هاتف الشماس.");form.elements.phone.focus();return false}
 for(const key of ["whatsappPhone","motherPhone","fatherPhone"]){if(!/^[+\d\s()-]{8,20}$/.test(form.elements[key].value.trim())){say("يرجى مراجعة رقم هاتف الأم والأب.");form.elements[key].focus();return false}}
}if(i===6&&!await verifyNationalIdImage())return false;return true}
const labels={fullName:"الاسم الكامل",englishName:"الاسم بالإنجليزية",copticName:"الاسم القبطي",gender:"النوع",age:"العمر",email:"البريد الإلكتروني",nationalId:"الرقم القومي",phone:"رقم هاتف الشماس",whatsappPhone:"رقم هاتف واتس الشماس",motherPhone:"رقم هاتف الأم",fatherPhone:"رقم هاتف الأب",birthDate:"تاريخ الميلاد",governorate:"المحافظة",streetName:"رقم واسم الشارع",houseNumber:"رقم البيت",area:"المنطقة / المدينة",address:"عنوان الشارع بالتفصيل",diocese:"الإيبارشية",church:"اسم الكنيسة",confessor:"اسم أب الاعتراف",currentService:"الخدمة الحالية",educationLevel:"المرحلة الدراسية",institution:"المدرسة / الجامعة",faculty:"الكلية / التخصص",universityYear:"السنة الجامعية",studies:"الدراسات السابقة",talents:"المواهب",skills:"المهارات",chantLevel:"مستوى الألحان",copticLevel:"مستوى القبطي",ritualLevel:"مستوى الطقس"}
function review(){const box=document.getElementById("review-summary");box.replaceChildren();Object.entries(labels).forEach(([k,l])=>{const item=document.createElement("div");item.className="review-item";const s=document.createElement("small");s.textContent=l;const b=document.createElement("strong");b.textContent=k==="nationalId"?(val(k).replace(/\d(?=\d{4})/g,"•")):val(k);item.append(s,b);box.append(item)});
for(const [id,key] of [["church-diocese","diocese"],["church-name","church"],["church-confessor","confessor"],["church-service","currentService"]]){const target=document.getElementById(id);if(target)target.textContent=val(key)}
const files=[...form.querySelectorAll('input[type="file"]')].flatMap(e=>[...e.files].map(f=>f.name));if(files.length){const item=document.createElement("div");item.className="review-item";item.innerHTML="<small>الملفات المختارة</small>";const b=document.createElement("strong");b.textContent=files.join("، ");item.append(b);box.append(item)}}
function render(){steps.forEach((s,i)=>{s.hidden=i!==current;s.classList.toggle("active",i===current)});indicators.forEach((e,i)=>{e.classList.toggle("active",i===current);e.classList.toggle("done",i<current)});const p=Math.round((current+1)/steps.length*100);progress.style.width=(current/(steps.length-1)*82)+"%";document.getElementById("step-number").textContent="الصفحة "+digits(current+1)+" من "+digits(steps.length);document.getElementById("progress-percent").textContent=digits(p)+"٪";prev.disabled=current===0;next.hidden=current===steps.length-1;submit.hidden=current!==steps.length-1;if(current===9)review();alertBox.textContent=""}
next.addEventListener("click",async()=>{next.disabled=true;try{if(await validate(current)&&current<steps.length-1){current++;render();window.scrollTo({top:0,behavior:"smooth"})}}finally{next.disabled=false}});
prev.addEventListener("click",()=>{if(current>0){current--;render();window.scrollTo({top:0,behavior:"smooth"})}});
indicators.forEach((e,i)=>e.addEventListener("click",()=>{if(i<current){current=i;render();window.scrollTo({top:0,behavior:"smooth"})}}));
form.addEventListener("input",()=>alertBox.textContent="");form.addEventListener("change",()=>alertBox.textContent="");
form.addEventListener("submit",e=>{e.preventDefault();if(current!==9||!validate(9))return;say("لم يتم إرسال الطلب: ربط Google Forms أو قاعدة بيانات آمنة لم يُفعّل بعد. لا تُدخل بيانات حقيقية في هذه النسخة التجريبية.")});render();
})();