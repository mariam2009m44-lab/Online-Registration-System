/*
 * Google Forms connection
 * The visual form is ready. Before enabling live submissions, map each field
 * to its Google Forms entry ID and set the public formResponse URL below.
 * Do not put private API keys or passwords in this file.
 */
const GOOGLE_FORM_CONFIG = {
  actionUrl: "https://docs.google.com/forms/d/e/REPLACE_WITH_FORM_PUBLIC_ID/formResponse",
  entries: {
    fullName: "",
    email: "",
    phone: "",
    governorate: "",
    education: "",
    school: "",
    notes: ""
  }
};

const form = document.getElementById("registration-form");
const steps = [...document.querySelectorAll(".form-step")];
const backBtn = document.getElementById("back-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const progressPercent = document.getElementById("progress-percent");
const alertBox = document.getElementById("form-alert");
let currentStep = 0;

document.getElementById("year").textContent = new Date().getFullYear();

function updateStep() {
  steps.forEach((step, index) => step.classList.toggle("active", index === currentStep));
  const percent = currentStep === 0 ? 50 : 100;
  progressBar.style.width = percent + "%";
  progressText.textContent = `الخطوة ${currentStep + 1} من ${steps.length}`;
  progressPercent.textContent = percent + "%";
  backBtn.disabled = currentStep === 0;
  nextBtn.hidden = currentStep === steps.length - 1;
  submitBtn.hidden = currentStep !== steps.length - 1;
  alertBox.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStep() {
  const fields = [...steps[currentStep].querySelectorAll("[required]")];
  let valid = true;
  fields.forEach(field => {
    const wrapper = field.closest(".field");
    const error = wrapper.querySelector(".error");
    let message = "";
    if (!field.value.trim()) message = "هذا الحقل مطلوب.";
    else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) message = "اكتب بريدًا إلكترونيًا صحيحًا.";
    else if (field.name === "phone" && !/^[+\d\s()-]{8,20}$/.test(field.value.trim())) message = "راجع رقم الهاتف.";
    wrapper.classList.toggle("invalid", Boolean(message));
    error.textContent = message;
    if (message) valid = false;
  });
  return valid;
}

nextBtn.addEventListener("click", () => {
  if (!validateStep()) {
    alertBox.textContent = "راجِع الحقول المطلوبة قبل المتابعة.";
    return;
  }
  currentStep = Math.min(currentStep + 1, steps.length - 1);
  updateStep();
});
backBtn.addEventListener("click", () => {
  currentStep = Math.max(0, currentStep - 1);
  updateStep();
});

form.addEventListener("input", event => {
  const wrapper = event.target.closest(".field");
  if (wrapper) {
    wrapper.classList.remove("invalid");
    const error = wrapper.querySelector(".error");
    if (error) error.textContent = "";
  }
});

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateStep()) {
    alertBox.textContent = "راجِع الحقول المطلوبة قبل الإرسال.";
    return;
  }
  const configured = GOOGLE_FORM_CONFIG.actionUrl.includes("/d/e/") &&
    !GOOGLE_FORM_CONFIG.actionUrl.includes("REPLACE_WITH") &&
    Object.values(GOOGLE_FORM_CONFIG.entries).every(Boolean);

  if (!configured) {
    alertBox.textContent = "التصميم جاهز، ويتبقى ربط حقول Google Forms بمعرّفات entry الخاصة بكل سؤال. لم يتم إرسال أي بيانات.";
    return;
  }

  const data = new FormData(form);
  const payload = new URLSearchParams();
  Object.entries(GOOGLE_FORM_CONFIG.entries).forEach(([fieldName, entryId]) => {
    payload.append(`entry.${entryId}`, data.get(fieldName) || "");
  });

  submitBtn.disabled = true;
  submitBtn.textContent = "جارٍ الإرسال...";
  fetch(GOOGLE_FORM_CONFIG.actionUrl, {
    method: "POST",
    mode: "no-cors",
    body: payload
  }).then(() => {
    form.reset();
    alertBox.className = "form-alert success";
    alertBox.textContent = "تم إرسال الطلب. إذا لم يظهر في جدول الردود، راجع إعدادات الربط.";
    currentStep = 0;
    updateStep();
  }).catch(() => {
    alertBox.textContent = "تعذر إرسال الطلب. حاول مرة أخرى لاحقًا.";
  }).finally(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'إرسال التسجيل <span>✓</span>';
  });
});

updateStep();