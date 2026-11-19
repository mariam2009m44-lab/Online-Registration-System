(() => {
"use strict";
const form=document.getElementById("registration-form");
if(!form)return;
const steps=[...document.querySelectorAll(".form-step")];
const indicators=[...document.querySelectorAll("[data-step-indicator]")];
const prev=document.getElementById("prev-step"),next=document.getElementById("next-step"),submit=document.getElementById("submit-form");
const alertBox=document.getElementById("form-alert");
const progress=document.getElementById("progress-fill");
const stepNumber=document.getElementById("step-number"),percent=document.getElementById("progress-percent");
let current=0;
const arabicDigits=n=>String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[Number(d)]);
function showAlert(message){alertBox.textContent=message;}
function clearAlert(){alertBox.textContent="";}
function validateStep(index){
 const fields=[...steps[index].querySelectorAll("input[required],select[required],textarea[required]")];
 for(const field of fields){
  if(field.type==="checkbox"&&!field.checked){showAlert("يرجى الموافقة على التعهد والإقرار للمتابعة.");field.focus();return false;}
  if(field.type!=="checkbox"&&!field.value.trim()){showAlert("يرجى استكمال الحقول الإجبارية قبل الانتقال.");field.focus();return false;}
  if(!field.checkValidity()){showAlert(field.name==="email"?"يرجى إدخال بريد إلكتروني صحيح.":"يرجى مراجعة البيانات المدخلة.");field.focus();return false;}
 }
 if(index===0){
  if(!/^\d{14}$/.test(form.elements.nationalId.value.trim())){showAlert("الرقم القومي يجب أن يتكون من 14 رقمًا.");form.elements.nationalId.focus();return false;}
  if(!/^[+\d\s()-]{8,20}$/.test(form.elements.phone.value.trim())){showAlert("يرجى مراجعة رقم الهاتف.");form.elements.phone.focus();return false;}
 }
 return true;
}
function value(name){const el=form.elements[name];return el&&el.value.trim()?el.value.trim():"—";}
const labels={fullName:"الاسم رباعي",email:"البريد الإلكتروني",nationalId:"الرقم القومي",birthDate:"تاريخ الميلاد",gender:"النوع",governorate:"المحافظة",city:"المدينة",phone:"رقم الهاتف",diocese:"الإيبارشية",church:"الكنيسة",confessor:"أب الاعتراف",currentService:"الخدمة الحالية",educationLevel:"المرحلة الدراسية",institution:"المدرسة / الجامعة",faculty:"الكلية / التخصص",universityYear:"السنة الجامعية",studies:"الدراسات والخبرات",talents:"المواهب",skills:"المهارات",chantLevel:"مستوى الألحان",copticLevel:"مستوى القبطي",ritualLevel:"مستوى الطقس"};
function buildReview(){
 const box=document.getElementById("review-summary");box.replaceChildren();
 Object.entries(labels).forEach(([key,label])=>{
  const item=document.createElement("div");item.className="review-item";
  const small=document.createElement("small");small.textContent=label;
  const strong=document.createElement("strong");strong.textContent=value(key);
  item.append(small,strong);box.append(item);
 });
 const files=[...form.querySelectorAll('input[type="file"]')].flatMap(el=>[...el.files].map(file=>file.name));
 if(files.length){const item=document.createElement("div");item.className="review-item";const small=document.createElement("small");small.textContent="الملفات المختارة";const strong=document.createElement("strong");strong.textContent=files.join("، ");item.append(small,strong);box.append(item);}
}
function render(){
 steps.forEach((step,i)=>{step.hidden=i!==current;step.classList.toggle("active",i===current);});
 indicators.forEach((item,i)=>{item.classList.toggle("active",i===current);item.classList.toggle("done",i<current);});
 const pct=Math.round(((current+1)/steps.length)*100);
 progress.style.width=(current/(steps.length-1)*82)+"%";
 stepNumber.textContent="الخطوة "+arabicDigits(current+1)+" من "+arabicDigits(steps.length);
 percent.textContent=arabicDigits(pct)+"٪";
 prev.disabled=current===0;
 next.hidden=current===steps.length-1;
 submit.hidden=current!==steps.length-1;
 if(current===steps.length-1)buildReview();
 clearAlert();
}
next.addEventListener("click",()=>{if(!validateStep(current))return;if(current<steps.length-1){current++;render();window.scrollTo({top:0,behavior:"smooth"});}});
prev.addEventListener("click",()=>{if(current>0){current--;render();window.scrollTo({top:0,behavior:"smooth"});}});
indicators.forEach((item,i)=>item.addEventListener("click",()=>{if(i<current){current=i;render();window.scrollTo({top:0,behavior:"smooth"});}}));
form.addEventListener("input",clearAlert);
form.addEventListener("change",clearAlert);
form.addEventListener("submit",event=>{
 event.preventDefault();
 if(current!==steps.length-1)return;
 if(!validateStep(5))return;
 showAlert("النموذج لم يُرسل بعد: أرسل رابط Google Forms الخاص بالمدرسة ورابط النموذج المُعبأ مسبقًا لإتمام الربط الحقيقي. لا يتم حفظ بياناتك أو إرسالها في هذه النسخة.");
});
render();
})();