const form=document.getElementById("registration-form");
const message=document.getElementById("form-message");
const namePattern=/^[\p{L}\s.'-]+$/u;
function fail(text,field){message.textContent=text;if(field){field.focus();field.closest(".reference-field")?.classList.add("field-error");}return false;}
form.addEventListener("input",e=>e.target.closest(".reference-field")?.classList.remove("field-error"));
form.addEventListener("submit",e=>{
 e.preventDefault();message.textContent="";
 const required=[...form.querySelectorAll("[required]")];
 for(const field of required){
  if(field.type==="checkbox"&&!field.checked)return fail("يرجى الموافقة على التعهد والإقرار.",field);
  if(field.type!=="checkbox"&&!field.value.trim())return fail("يرجى استكمال جميع الحقول الإجبارية.",field);
 }
 const nationalId=form.elements.nationalId;
 if(!/^\d{14}$/.test(nationalId.value.trim()))return fail("الرقم القومي يجب أن يتكون من 14 رقمًا.",nationalId);
 const email=form.elements.email;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))return fail("يرجى إدخال بريد إلكتروني صحيح.",email);
 const phone=form.elements.phone;
 if(!/^[+\d\s()-]{8,20}$/.test(phone.value.trim()))return fail("يرجى مراجعة رقم الهاتف.",phone);
 for(const field of [form.elements.fullName,form.elements.diocese,form.elements.church,form.elements.confessor,form.elements.city]){
  if(field.value.trim()&&!namePattern.test(field.value.trim()))return fail("يرجى إدخال الاسم أو البيانات النصية دون أرقام.",field);
 }
 const id="BMS-"+new Date().getFullYear()+"-"+Math.random().toString(10).slice(2,8);
 // Demonstration-only: do not retain national ID, date of birth, contact details, or files in browser storage.
 const safeRecord={id,name:form.elements.fullName.value.trim(),church:form.elements.church.value.trim(),diocese:form.elements.diocese.value.trim(),status:"قيد المراجعة",createdAt:new Date().toISOString()};
 try{const rows=JSON.parse(localStorage.getItem("beminzit_demo_applicants")||"[]");rows.unshift(safeRecord);localStorage.setItem("beminzit_demo_applicants",JSON.stringify(rows));}
 catch(error){return fail("تعذر حفظ طلب العرض على هذا المتصفح. حاول مرة أخرى.");}
 form.querySelector(".reference-submit-btn").hidden=true;
 document.getElementById("success-panel").hidden=false;
 document.getElementById("request-number").textContent=id;
 message.textContent="هذه نسخة عرض تجريبية؛ لم يُرسل الطلب إلى خادم المدرسة.";
});
