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


/* Local OCR: compare the entered Egyptian national ID with the birth certificate. */
const birthCertificateInput=form.elements.birthCertificate;
const matchStatus=document.getElementById("id-match-status");
const matchDetail=document.getElementById("id-match-detail");
const matchPanel=document.getElementById("id-match-panel");
let birthCertificateMatch={state:"idle",nationalId:""};
function setMatchState(state,message,detail=""){
 birthCertificateMatch.state=state;
 if(matchStatus)matchStatus.textContent=message;
 if(matchDetail)matchDetail.textContent=detail;
 if(matchPanel){matchPanel.dataset.state=state;matchPanel.classList.toggle("is-match",state==="match");matchPanel.classList.toggle("is-error",state==="mismatch"||state==="unreadable"||state==="error");}
}
function normalizeDigits(value){return toWesternDigits(value).replace(/[^0-9]/g,"");}
function findNationalIds(ocrText){
 const candidates=new Set();
 const pattern=/(?:[0-9٠-٩۰-۹][\s-]*){14}/g;
 for(const line of String(ocrText||"").split(/\r?\n/)){
  for(const hit of line.matchAll(pattern)){
   const candidate=normalizeDigits(hit[0]);
   if(candidate.length===14&&getBirthDateFromNationalId(candidate))candidates.add(candidate);
  }
 }
 return [...candidates];
}
async function getOcrSource(file){
 if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf")){
  if(!window.pdfjsLib)throw new Error("تعذر تحميل قارئ ملفات PDF. جرّب رفع صورة JPG أو PNG.");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
  const page=await pdf.getPage(1);
  const viewport=page.getViewport({scale:2.5});
  const canvas=document.createElement("canvas");
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
  return canvas;
 }
 if(!file.type.startsWith("image/"))throw new Error("نوع الملف غير مدعوم. ارفع صورة أو ملف PDF.");
 return file;
}
async function compareBirthCertificate(){
 const file=birthCertificateInput?.files?.[0];
 if(!file){setMatchState("idle","ارفع شهادة الميلاد لبدء المطابقة.");return false;}
 if(file.size>5*1024*1024){setMatchState("error","حجم شهادة الميلاد أكبر من 5MB.","اختر صورة أو PDF أصغر من 5MB.");return false;}
 const enteredId=normalizeDigits(nationalIdInput?.value||"");
 if(!/^\d{14}$/.test(enteredId)){setMatchState("error","أدخل الرقم القومي المكوّن من 14 رقمًا أولًا.","ارجع إلى صفحة البيانات الشخصية وتأكد من الرقم.");return false;}
 setMatchState("processing","جارٍ قراءة شهادة الميلاد ومطابقة الرقم القومي…","قد تستغرق العملية بعض الوقت حسب حجم الصورة وسرعة الجهاز.");
 if(next)next.disabled=true;
 try{
  if(!window.Tesseract)throw new Error("تعذر تحميل محرك قراءة الصور. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.");
  const source=await getOcrSource(file);
  const result=await window.Tesseract.recognize(source,"eng+ara",{logger:event=>{
   if(event.status==="recognizing text"&&matchDetail)matchDetail.textContent="جارٍ قراءة النص من الشهادة… "+Math.round((event.progress||0)*100)+"٪";
  }});
  const candidates=findNationalIds(result.data?.text||"");
  if(candidates.includes(enteredId)){
   birthCertificateMatch.nationalId=enteredId;
   setMatchState("match","تمت المطابقة بنجاح ✓","الرقم المقروء من الشهادة مطابق للرقم المدخل وينتهي بـ "+enteredId.slice(-4)+".");
   return true;
  }
  if(candidates.length){
   birthCertificateMatch.nationalId="";
   setMatchState("mismatch","الرقم القومي لا يطابق الرقم الموجود في شهادة الميلاد.","تم العثور على رقم ينتهي بـ "+candidates[0].slice(-4)+". راجع البيانات أو ارفع صورة أوضح.");
   return false;
  }
  birthCertificateMatch.nationalId="";
  setMatchState("unreadable","لم نتمكن من قراءة رقم قومي واضح من الشهادة.","جرّب صورة مستقيمة وعالية الوضوح، مع ظهور بيانات الشهادة كاملة.");
  return false;
 }catch(error){
  birthCertificateMatch.nationalId="";
  setMatchState("error",error.message||"حدث خطأ أثناء قراءة الشهادة.","يمكنك إعادة اختيار الملف والمحاولة مرة أخرى.");
  return false;
 }finally{
  if(next)next.disabled=false;
 }
}
if(birthCertificateInput){
 birthCertificateInput.addEventListener("change",()=>{birthCertificateMatch={state:"idle",nationalId:""};compareBirthCertificate();});
}
nationalIdInput?.addEventListener("input",()=>{
 if(birthCertificateMatch.state!=="idle"){birthCertificateMatch={state:"idle",nationalId:""};setMatchState("idle","تم تعديل الرقم القومي. أعد فحص شهادة الميلاد بعد التأكد من الرقم.");}
});

function validate(i){for(const e of steps[i].querySelectorAll("input[required],select[required],textarea[required]")){if(e.type==="checkbox"&&!e.checked){say("يرجى الموافقة على التعهد والإقرار للمتابعة.");e.focus();return false}if(e.type!=="checkbox"&&!e.value.trim()){say("يرجى استكمال الحقول الإجبارية قبل الانتقال.");e.focus();return false}if(!e.checkValidity()){say(e.type==="email"?"يرجى إدخال بريد إلكتروني صحيح.":"يرجى مراجعة البيانات المدخلة.");e.focus();return false}}
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
}if(i===6&&birthCertificateMatch.state!=="match"){say("يجب مطابقة الرقم القومي مع شهادة الميلاد قبل المتابعة. ارفع الشهادة وانتظر نتيجة الفحص.");birthCertificateInput?.focus();return false}return true}
const labels={fullName:"الاسم الكامل",englishName:"الاسم بالإنجليزية",copticName:"الاسم القبطي",gender:"النوع",age:"العمر",email:"البريد الإلكتروني",nationalId:"الرقم القومي",phone:"رقم هاتف الشماس",whatsappPhone:"رقم هاتف واتس الشماس",motherPhone:"رقم هاتف الأم",fatherPhone:"رقم هاتف الأب",birthDate:"تاريخ الميلاد",governorate:"المحافظة",streetName:"رقم واسم الشارع",houseNumber:"رقم البيت",area:"المنطقة / المدينة",address:"عنوان الشارع بالتفصيل",diocese:"الإيبارشية",church:"اسم الكنيسة",confessor:"اسم أب الاعتراف",currentService:"الخدمة الحالية",educationLevel:"المرحلة الدراسية",institution:"المدرسة / الجامعة",faculty:"الكلية / التخصص",universityYear:"السنة الجامعية",studies:"الدراسات السابقة",talents:"المواهب",skills:"المهارات",chantLevel:"مستوى الألحان",copticLevel:"مستوى القبطي",ritualLevel:"مستوى الطقس"}
function review(){const box=document.getElementById("review-summary");box.replaceChildren();Object.entries(labels).forEach(([k,l])=>{const item=document.createElement("div");item.className="review-item";const s=document.createElement("small");s.textContent=l;const b=document.createElement("strong");b.textContent=val(k);item.append(s,b);box.append(item)});
for(const [id,key] of [["church-diocese","diocese"],["church-name","church"],["church-confessor","confessor"],["church-service","currentService"]]){const target=document.getElementById(id);if(target)target.textContent=val(key)}
const files=[...form.querySelectorAll('input[type="file"]')].flatMap(e=>[...e.files].map(f=>f.name));if(files.length){const item=document.createElement("div");item.className="review-item";item.innerHTML="<small>الملفات المختارة</small>";const b=document.createElement("strong");b.textContent=files.join("، ");item.append(b);box.append(item)}}
function render(){steps.forEach((s,i)=>{s.hidden=i!==current;s.classList.toggle("active",i===current)});indicators.forEach((e,i)=>{e.classList.toggle("active",i===current);e.classList.toggle("done",i<current)});const p=Math.round((current+1)/steps.length*100);progress.style.width=(current/(steps.length-1)*82)+"%";document.getElementById("step-number").textContent="الصفحة "+digits(current+1)+" من "+digits(steps.length);document.getElementById("progress-percent").textContent=digits(p)+"٪";prev.disabled=current===0;next.hidden=current===steps.length-1;submit.hidden=current!==steps.length-1;if(current===9)review();alertBox.textContent=""}
next.addEventListener("click",()=>{if(validate(current)&&current<steps.length-1){current++;render();window.scrollTo({top:0,behavior:"smooth"})}});
prev.addEventListener("click",()=>{if(current>0){current--;render();window.scrollTo({top:0,behavior:"smooth"})}});
indicators.forEach((e,i)=>e.addEventListener("click",()=>{if(i<current){current=i;render();window.scrollTo({top:0,behavior:"smooth"})}}));
form.addEventListener("input",()=>alertBox.textContent="");form.addEventListener("change",()=>alertBox.textContent="");
form.addEventListener("submit",e=>{e.preventDefault();if(current!==9||!validate(9))return;say("لم يتم إرسال الطلب: ربط Google Forms أو قاعدة بيانات آمنة لم يُفعّل بعد. لا تُدخل بيانات حقيقية في هذه النسخة التجريبية.")});render();
})();