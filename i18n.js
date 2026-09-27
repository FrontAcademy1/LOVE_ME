/* عالم الدراسة — Arabic first / English switch */
(function(){
"use strict";
const KEY="question_archive_language";
const translations={
ar:{
HOME:"الرئيسية",QUESTIONS:"الأسئلة",CHAPTERS:"الفصول",CONTACT:"تواصل معنا",CASE_FILE:"ملف رقم 001 · عالم الدراسة",
HERO_LEAD:"عالم الدراسة،<br>أسئلة وإجابات وشروحات.",HERO_DESC:"عالم الدراسة لأسئلة البرمجة، مرتب علشان تراجع وتفهم بسرعة ومن غير زحمة.",EXPLORE:"استكشف الأسئلة",
TOTAL_QUESTIONS:"إجمالي الأسئلة",TOTAL_CHAPTERS:"إجمالي الفصول",TOTAL_CATEGORIES:"إجمالي التصنيفات",MAIN_FILES:"الملفات الرئيسية",
SEARCH_PLACEHOLDER:"ابحث في السؤال أو الفصل أو التصنيف...",RESULTS:"نتيجة",CLEAR_FILTERS:"مسح الفلاتر",ALL_CHAPTERS:"كل الفصول",ALL_CATEGORIES:"كل التصنيفات",
NO_RESULTS:"مفيش نتائج مطابقة للبحث.",NO_QUESTIONS:"مفيش أسئلة منشورة حاليًا.",NO_CHAPTERS:"مفيش فصول متاحة حاليًا.",
SHOW_ANSWER:"عرض الإجابة",HIDE_ANSWER:"إخفاء الإجابة",SHOW_EXPLANATION:"عرض الشرح",HIDE_EXPLANATION:"إخفاء الشرح",SHOW_CODE:"عرض الكود",HIDE_CODE:"إخفاء الكود",
COPY:"نسخ الإجابة",REPORT:"إبلاغ / تواصل",COPIED:"تم نسخ الإجابة بنجاح.",COPY_FAIL:"النسخ غير متاح في المتصفح ده.",
ANSWER_EMPTY:"مفيش إجابة مضافة حاليًا.",EXPLANATION_EMPTY:"مفيش شرح مضاف حاليًا.",CODE_EMPTY:"مفيش كود مضاف.",
ABOUT:"عن عالم الدراسة",EVERY_QUESTION:"كل سؤال<br>له مكان.",ABOUT_TEXT:"كل سؤال بيتحفظ مع إجابته وشرحه وتصنيفه، ومعاه صورة أو فيديو لو متاح. الهدف إن المراجعة تبقى أسرع وأوضح.",
FINAL_NOTE:"ملاحظة أخيرة",FOUND_PROBLEM:"وجدت مشكلة؟",CONTACT_TEXT:"لو لقيت خطأ في سؤال أو عندك مشكلة في المحتوى، تواصل معنا مباشرة.",
WHATSAPP:"واتساب",EMAIL:"البريد الإلكتروني",CONTACT_UNAVAILABLE:"خيارات التواصل غير متاحة حاليًا.",ARCHIVE:"الأرشيف",QUESTION:"سؤال",CHAPTER:"الفصل",VIDEO:"فيديو",LOADING:"جاري تحميل الأسئلة...",DATA_ERROR:"تعذر تحميل الأرشيف. راجع إعدادات Supabase وصلاحيات القراءة.",
CHAPTER_QUESTIONS:"سؤال",OPEN_CHAPTER:"عرض أسئلة الفصل"
},
en:{
HOME:"HOME",QUESTIONS:"QUESTIONS",CHAPTERS:"CHAPTERS",CONTACT:"CONTACT",CASE_FILE:"CASE FILE 001 · EDUCATIONAL ARCHIVE",
HERO_LEAD:"A PLACE FOR QUESTIONS,<br>ANSWERS & EXPLANATIONS.",HERO_DESC:"A clean personal study archive for reviewing questions without the clutter.",EXPLORE:"EXPLORE QUESTIONS",
TOTAL_QUESTIONS:"TOTAL QUESTIONS",TOTAL_CHAPTERS:"TOTAL CHAPTERS",TOTAL_CATEGORIES:"TOTAL CATEGORIES",MAIN_FILES:"THE MAIN FILES",
SEARCH_PLACEHOLDER:"Search questions, chapters or categories...",RESULTS:"results",CLEAR_FILTERS:"Clear filters",ALL_CHAPTERS:"All chapters",ALL_CATEGORIES:"All categories",
NO_RESULTS:"No matching results found.",NO_QUESTIONS:"No published questions yet.",NO_CHAPTERS:"No chapters available yet.",
SHOW_ANSWER:"SHOW ANSWER",HIDE_ANSWER:"HIDE ANSWER",SHOW_EXPLANATION:"SHOW EXPLANATION",HIDE_EXPLANATION:"HIDE EXPLANATION",SHOW_CODE:"SHOW CODE",HIDE_CODE:"HIDE CODE",
COPY:"COPY ANSWER",REPORT:"REPORT / CONTACT",COPIED:"Answer copied successfully.",COPY_FAIL:"Clipboard is not available in this browser.",
ANSWER_EMPTY:"No answer has been added yet.",EXPLANATION_EMPTY:"No explanation has been added yet.",CODE_EMPTY:"No code has been added.",
ABOUT:"ABOUT THE ARCHIVE",EVERY_QUESTION:"Every question<br>has a file.",ABOUT_TEXT:"Each question is stored with its title, answer, explanation and category, with media when available. The goal is faster, clearer revision.",
FINAL_NOTE:"FINAL NOTE",FOUND_PROBLEM:"FOUND A PROBLEM?",CONTACT_TEXT:"Found an error or have an issue with the content? Contact us directly.",
WHATSAPP:"WHATSAPP",EMAIL:"EMAIL",CONTACT_UNAVAILABLE:"Contact options are currently unavailable.",ARCHIVE:"ARCHIVE",QUESTION:"QUESTION",CHAPTER:"CHAPTER",VIDEO:"VIDEO",LOADING:"Loading questions...",DATA_ERROR:"Unable to load the archive. Check Supabase configuration and read permissions.",
CHAPTER_QUESTIONS:"questions",OPEN_CHAPTER:"VIEW CHAPTER QUESTIONS"
}};
let lang=localStorage.getItem(KEY)||"ar"; if(!translations[lang])lang="ar";
function t(k){return translations[lang][k]??translations.en[k]??k}
function apply(){
 const ar=lang==="ar"; document.documentElement.lang=lang;document.documentElement.dir=ar?"rtl":"ltr";
 document.body.classList.toggle("lang-ar",ar);document.body.classList.toggle("lang-en",!ar);
 document.querySelectorAll("[data-i18n]").forEach(el=>el.innerHTML=t(el.dataset.i18n));
 document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
 const btn=document.getElementById("languageToggle"); if(btn){btn.textContent=ar?"EN":"عربي";btn.title=ar?"Switch to English":"التبديل إلى العربية"}
 document.dispatchEvent(new CustomEvent("qa-language-change",{detail:{language:lang}}));
}
function toggle(){lang=lang==="ar"?"en":"ar";localStorage.setItem(KEY,lang);apply()}
window.QA_I18N={t,get:()=>lang,getLanguage:()=>lang,setLanguage:x=>{if(translations[x]){lang=x;localStorage.setItem(KEY,x);apply()}},apply};
document.addEventListener("DOMContentLoaded",()=>{const b=document.getElementById("languageToggle");if(b)b.addEventListener("click",toggle);apply()});
})();
