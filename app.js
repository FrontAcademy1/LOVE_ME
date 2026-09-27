/* =========================================================
   عالم الدراسة — PUBLIC APP
   Supabase + Questions + Leo AI
========================================================= */

const { createClient } = window.supabase;

const db = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = (selector) => document.querySelector(selector);

const state = {
  questions: [],
  chapters: [],
  categories: [],
  settings: {}
};

/* =========================================================
   PASSWORD
========================================================= */

(() => {
  const gate = $("#passwordGate");
  const form = $("#passwordForm");
  const input = $("#sitePassword");
  const error = $("#passwordError");

  if (!gate || !form) return;

  const unlocked =
    sessionStorage.getItem("study_world_unlocked") === "1";

  if (unlocked) {
    gate.classList.add("hidden");
    document.body.classList.remove("password-locked");
  } else {
    document.body.classList.add("password-locked");

    setTimeout(() => {
      input?.focus();
    }, 150);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (input?.value === "2010") {
      sessionStorage.setItem(
        "study_world_unlocked",
        "1"
      );

      gate.classList.add("hidden");
      document.body.classList.remove("password-locked");

      if (error) {
        error.textContent = "";
      }

      input.value = "";
    } else {
      if (error) {
        error.textContent =
          "كلمة المرور غير صحيحة.";
      }

      input.value = "";
      input.focus();
    }
  });
})();

/* =========================================================
   HELPERS
========================================================= */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}

function attr(value) {
  return esc(value);
}

function text(key, fallback = "") {
  try {
    if (
      window.QA_I18N &&
      typeof QA_I18N.t === "function"
    ) {
      return QA_I18N.t(key);
    }
  } catch {}

  return fallback || key;
}

function toast(message) {
  const region = $("#toastRegion");

  if (!region) {
    alert(message);
    return;
  }

  const item = document.createElement("div");

  item.className = "toast";
  item.textContent = message;

  region.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, 2800);
}

/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    createBubbles();

    bindNavigation();

    bindFilters();

    bindLeo();

    await loadPublicData();

  }
);

/* =========================================================
   BACKGROUND BUBBLES
========================================================= */

function createBubbles() {

  const container = $("#bubbles");

  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < 18; i++) {

    const bubble =
      document.createElement("span");

    const size =
      20 + Math.random() * 90;

    bubble.className = "bubble";

    bubble.style.width =
      `${size}px`;

    bubble.style.height =
      `${size}px`;

    bubble.style.left =
      `${Math.random() * 100}%`;

    bubble.style.animationDuration =
      `${18 + Math.random() * 25}s`;

    bubble.style.animationDelay =
      `${-Math.random() * 30}s`;

    container.appendChild(bubble);
  }
}

/* =========================================================
   NAVIGATION
========================================================= */

function bindNavigation() {

  const toggle = $("#menuToggle");
  const nav = $("#mainNav");

  toggle?.addEventListener(
    "click",
    () => {

      const open =
        nav?.classList.toggle("open");

      toggle.setAttribute(
        "aria-expanded",
        String(!!open)
      );
    }
  );

  nav?.querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        () => {
          nav.classList.remove("open");
        }
      );

    });
}

/* =========================================================
   FILTERS
========================================================= */

function bindFilters() {

  $("#searchInput")?.addEventListener(
    "input",
    renderQuestions
  );

  $("#chapterFilter")?.addEventListener(
    "change",
    renderQuestions
  );

  $("#categoryFilter")?.addEventListener(
    "change",
    () => {
      renderCategoryBubble();
      renderQuestions();
    }
  );

  $("#categoryBubbleBtn")?.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      $("#categoryBubble")
        ?.classList.toggle("open");
    }
  );

  document.addEventListener(
    "click",
    (event) => {

      if (
        !event.target.closest(
          ".category-filter-wrap"
        )
      ) {
        $("#categoryBubble")
          ?.classList.remove("open");
      }
    }
  );

  $("#clearFilters")?.addEventListener(
    "click",
    () => {

      const search = $("#searchInput");
      const chapter = $("#chapterFilter");
      const category = $("#categoryFilter");

      if (search) search.value = "";
      if (chapter) chapter.value = "";
      if (category) category.value = "";

      renderCategoryBubble();
      renderQuestions();
    }
  );
}

/* =========================================================
   LOAD PUBLIC DATA
========================================================= */

async function loadPublicData() {

  setQuestionsState(
    text("LOADING", "جاري تحميل الأسئلة...")
  );

  const results =
    await Promise.allSettled([

      db
        .from("questions")
        .select("*"),

      db
        .from("chapters")
        .select("*")
        .order(
          "display_order",
          { ascending: true }
        ),

      db
        .from("categories")
        .select("*")
        .order(
          "name",
          { ascending: true }
        ),

      db
        .from("site_settings")
        .select("*")

    ]);

  const questionsResult = results[0];
  const chaptersResult = results[1];
  const categoriesResult = results[2];
  const settingsResult = results[3];

  /* QUESTIONS */

  if (
    questionsResult.status === "fulfilled" &&
    !questionsResult.value.error
  ) {

    state.questions =
      questionsResult.value.data || [];

  } else {

    console.error(
      "Questions error:",
      questionsResult
    );

    state.questions = [];
  }

  /* فقط المنشور */

  state.questions =
    state.questions
      .filter(
        (question) =>
          question.published !== false
      )
      .sort(
        (a, b) => {

          const orderA =
            Number(a.display_order);

          const orderB =
            Number(b.display_order);

          const safeA =
            Number.isFinite(orderA)
              ? orderA
              : 999999;

          const safeB =
            Number.isFinite(orderB)
              ? orderB
              : 999999;

          if (safeA !== safeB) {
            return safeA - safeB;
          }

          return (
            new Date(
              a.created_at || 0
            ) -
            new Date(
              b.created_at || 0
            )
          );
        }
      );

  /* CHAPTERS */

  if (
    chaptersResult.status === "fulfilled" &&
    !chaptersResult.value.error
  ) {

    state.chapters =
      chaptersResult.value.data || [];

  } else {

    console.error(
      "Chapters error:",
      chaptersResult
    );

    state.chapters = [];
  }

  /* CATEGORIES */

  if (
    categoriesResult.status === "fulfilled" &&
    !categoriesResult.value.error
  ) {

    state.categories =
      categoriesResult.value.data || [];

  } else {

    console.error(
      "Categories error:",
      categoriesResult
    );

    state.categories = [];
  }

  /* SETTINGS */

  if (
    settingsResult.status === "fulfilled" &&
    !settingsResult.value.error
  ) {

    state.settings =
      Object.fromEntries(
        (
          settingsResult.value.data || []
        ).map(
          (item) => [
            item.key,
            item.value
          ]
        )
      );

  } else {

    console.error(
      "Settings error:",
      settingsResult
    );

    state.settings = {};
  }

  /* أهم نقطة */

  renderAll();

  applySiteBranding();

  console.log(
    "عالم الدراسة:",
    state.questions.length,
    "أسئلة منشورة"
  );
}

/* =========================================================
   RENDER ALL
   الإصلاح الأساسي
========================================================= */

function renderAll() {

  try {

    renderStats();

    renderFilters();

    renderQuestions();

    renderChapters();

    renderContact();

  } catch (error) {

    console.error(
      "renderAll error:",
      error
    );

    /*
      لو حصل خطأ في جزء معين،
      لا نخفي الأسئلة.
    */

    try {
      renderQuestions();
    } catch (questionError) {
      console.error(
        "Question rendering error:",
        questionError
      );
    }

  }
}

/* =========================================================
   BRANDING
========================================================= */

function applySiteBranding() {

  const name =
    state.settings.site_name ||
    "عالم الدراسة";

  document.title = name;

  document
    .querySelectorAll(
      ".brand strong, .footer-grid strong"
    )
    .forEach(
      (element) => {
        element.textContent = name;
      }
    );

  const footer =
    $("#footerText");

  if (footer) {

    footer.textContent =
      state.settings.footer_text ||
      `© 2026 ${name}`;
  }

  /* LOGIN VIDEO */

  const video =
    $("#lockBackgroundVideo");

  if (
    video &&
    state.settings.lock_video_url
  ) {

    video.src =
      state.settings.lock_video_url;

    video.parentElement
      ?.classList.add(
        "has-lock-video"
      );

    video.load();

    video.play().catch(() => {});
  }

  /* LEO IMAGE */

  const leo =
    document.querySelector(
      ".leo-avatar"
    );

  if (
    leo &&
    state.settings.leo_image_url
  ) {

    leo.style.backgroundImage =
      `url("${String(
        state.settings.leo_image_url
      ).replace(/"/g, "")}")`;

    leo.classList.add("has-image");

    leo.textContent = "";
  }
}

/* =========================================================
   STATS
========================================================= */

function renderStats() {

  const questions =
    $("#totalQuestions");

  const chapters =
    $("#totalChapters");

  const categories =
    $("#totalCategories");

  if (questions) {
    questions.textContent =
      state.questions.length;
  }

  if (chapters) {
    chapters.textContent =
      state.chapters.length;
  }

  if (categories) {
    categories.textContent =
      state.categories.length;
  }
}

/* =========================================================
   FILTERS UI
========================================================= */

function renderFilters() {

  const chapter =
    $("#chapterFilter");

  const category =
    $("#categoryFilter");

  if (chapter) {

    chapter.innerHTML =
      `<option value="">
        ${esc(
          text(
            "ALL_CHAPTERS",
            "كل الدروس"
          )
        )}
      </option>` +

      state.chapters
        .map(
          (item) =>
            `<option value="${attr(
              item.id
            )}">
              ${esc(item.title)}
            </option>`
        )
        .join("");
  }

  if (category) {

    category.innerHTML =
      `<option value="">
        ${esc(
          text(
            "ALL_CATEGORIES",
            "كل التصنيفات"
          )
        )}
      </option>` +

      state.categories
        .map(
          (item) =>
            `<option value="${attr(
              item.id
            )}">
              ${esc(item.name)}
            </option>`
        )
        .join("");
  }

  renderCategoryBubble();
}

/* =========================================================
   CATEGORY BUBBLE
========================================================= */

function renderCategoryBubble() {

  const box =
    $("#categoryBubble");

  if (!box) return;

  const current =
    $("#categoryFilter")?.value || "";

  box.innerHTML =

    `<button
      type="button"
      class="category-chip ${
        !current ? "active" : ""
      }"
      data-cat="">
      كل التصنيفات
    </button>` +

    state.categories
      .map(
        (category) =>
          `<button
            type="button"
            class="category-chip ${
              current === String(
                category.id
              )
                ? "active"
                : ""
            }"
            data-cat="${attr(
              category.id
            )}">
            ${esc(category.name)}
          </button>`
      )
      .join("");

  box
    .querySelectorAll(
      "[data-cat]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const filter =
              $("#categoryFilter");

            if (filter) {
              filter.value =
                button.dataset.cat;
            }

            box.classList.remove(
              "open"
            );

            $("#categoryBubbleBtn")
              ?.classList.toggle(
                "active",
                !!button.dataset.cat
              );

            renderCategoryBubble();

            renderQuestions();
          }
        );

      }
    );
}

/* =========================================================
   QUESTIONS
========================================================= */

function renderQuestions() {

  const grid =
    $("#questionsGrid");

  if (!grid) return;

  const search =
    (
      $("#searchInput")?.value ||
      ""
    )
      .trim()
      .toLowerCase();

  const chapterId =
    $("#chapterFilter")?.value ||
    "";

  const categoryId =
    $("#categoryFilter")?.value ||
    "";

  const list =
    state.questions.filter(
      (question) => {

        const chapter =
          state.chapters.find(
            (item) =>
              String(item.id) ===
              String(
                question.chapter_id
              )
          );

        const category =
          state.categories.find(
            (item) =>
              String(item.id) ===
              String(
                question.category_id
              )
          );

        const searchable = [
          question.title,
          question.question_text,
          chapter?.title,
          category?.name
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (

          (
            !search ||
            searchable.includes(search)
          )

          &&

          (
            !chapterId ||
            String(
              question.chapter_id
            ) === String(chapterId)
          )

          &&

          (
            !categoryId ||
            String(
              question.category_id
            ) === String(categoryId)
          )

        );
      }
    );

  const result =
    $("#resultCount");

  if (result) {
    result.textContent =
      list.length;
  }

  if (!list.length) {

    grid.innerHTML = "";

    setQuestionsState(
      search ||
      chapterId ||
      categoryId
        ? text(
            "NO_RESULTS",
            "لا توجد نتائج."
          )
        : text(
            "NO_QUESTIONS",
            "لا توجد أسئلة حتى الآن."
          )
    );

    return;
  }

  setQuestionsState("");

  grid.innerHTML =
    list
      .map(
        (question, index) =>
          questionCard(
            question,
            index
          )
      )
      .join("");
}

/* =========================================================
   QUESTION CARD
========================================================= */

function questionCard(
  question,
  index
) {

  const chapter =
    state.chapters.find(
      (item) =>
        String(item.id) ===
        String(
          question.chapter_id
        )
    );

  const category =
    state.categories.find(
      (item) =>
        String(item.id) ===
        String(
          question.category_id
        )
    );

  const image =
    question.image_url
      ? `
        <div class="media-frame">
          <img
            src="${attr(
              question.image_url
            )}"
            alt="${attr(
              question.title
            )}"
            loading="lazy">
        </div>
      `
      : "";

  const video =
    buildVideo(
      question.video_url
    );

  return `

    <article
      class="question-card"
      id="question-${attr(
        question.id
      )}">

      <div class="question-number">
        <span>
          ${String(
            index + 1
          ).padStart(2, "0")}
        </span>
        <i></i>
      </div>

      <div class="card-meta">

        <span>
          ${esc(
            chapter?.title ||
            "الدرس"
          )}
        </span>

        <span>
          ${esc(
            category?.name ||
            "سؤال"
          )}
        </span>

      </div>

      <h3>
        ${esc(
          question.title
        )}
      </h3>

      <div class="question-text">
        ${esc(
          question.question_text ||
          ""
        )}
      </div>

      ${image}

      ${video}

      <div class="card-actions">

        <button
          class="mini-btn"
          type="button"
          onclick="toggleBox(
            this,
            'answer-${attr(
              question.id
            )}',
            'SHOW_ANSWER',
            'HIDE_ANSWER'
          )">
          ${esc(
            text(
              "SHOW_ANSWER",
              "عرض الإجابة"
            )
          )}
        </button>

        <button
          class="mini-btn"
          type="button"
          onclick="toggleBox(
            this,
            'explanation-${attr(
              question.id
            )}',
            'SHOW_EXPLANATION',
            'HIDE_EXPLANATION'
          )">
          ${esc(
            text(
              "SHOW_EXPLANATION",
              "عرض الشرح"
            )
          )}
        </button>

        ${
          question.code
            ? `
              <button
                class="mini-btn"
                type="button"
                onclick="toggleBox(
                  this,
                  'code-${attr(
                    question.id
                  )}',
                  'SHOW_CODE',
                  'HIDE_CODE'
                )">
                ${esc(
                  text(
                    "SHOW_CODE",
                    "عرض الكود"
                  )
                )}
              </button>
            `
            : ""
        }

        <button
          class="mini-btn"
          type="button"
          onclick="copyQuestion(
            '${attr(
              question.id
            )}'
          )">
          ${esc(
            text(
              "COPY",
              "نسخ الإجابة"
            )
          )}
        </button>

        <button
          class="mini-btn leo-question-btn"
          type="button"
          onclick="askLeo(
            '${attr(
              question.id
            )}'
          )">
          اسأل ليو
        </button>

        <button
          class="mini-btn danger"
          type="button"
          onclick="reportQuestion(
            '${attr(
              question.id
            )}'
          )">
          ${esc(
            text(
              "REPORT",
              "إبلاغ"
            )
          )}
        </button>

      </div>

      <div
        class="answer-box reveal-box"
        id="answer-${attr(
          question.id
        )}">

        ${esc(
          question.answer ||
          text(
            "ANSWER_EMPTY",
            "لا توجد إجابة."
          )
        )}

      </div>

      <div
        class="answer-box reveal-box"
        id="explanation-${attr(
          question.id
        )}">

        ${esc(
          question.explanation ||
          text(
            "EXPLANATION_EMPTY",
            "لا يوجد شرح."
          )
        )}

      </div>

      ${
        question.code
          ? `
            <pre
              class="answer-box reveal-box code-box"
              id="code-${attr(
                question.id
              )}">
              <code>${esc(
                question.code
              )}</code>
            </pre>
          `
          : ""
      }

    </article>
  `;
}

/* =========================================================
   VIDEO
========================================================= */

function buildVideo(url) {

  if (!url) return "";

  const youtubeId =
    getYouTubeId(url);

  if (youtubeId) {

    return `
      <div class="media-frame video-wrap">

        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(
            youtubeId
          )}"
          title="فيديو"
          loading="lazy"
          allowfullscreen>
        </iframe>

      </div>
    `;
  }

  return `
    <div class="media-frame video-wrap">

      <video
        controls
        preload="metadata">

        <source
          src="${attr(url)}">

      </video>

    </div>
  `;
}

function getYouTubeId(url) {

  try {

    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes(
        "youtu.be"
      )
    ) {
      return parsed.pathname
        .replace("/", "");
    }

    if (
      parsed.hostname.includes(
        "youtube.com"
      )
    ) {

      return (
        parsed.searchParams.get(
          "v"
        ) ||
        parsed.pathname
          .split("/")
          .pop()
      );
    }

  } catch {}

  return null;
}

/* =========================================================
   CHAPTERS
========================================================= */

function renderChapters() {

  const grid =
    $("#chaptersGrid");

  if (!grid) return;

  if (!state.chapters.length) {

    grid.innerHTML = `
      <div class="state-message">
        لا توجد دروس حتى الآن.
      </div>
    `;

    return;
  }

  grid.innerHTML =
    state.chapters
      .map(
        (chapter, index) => {

          const count =
            state.questions.filter(
              (question) =>
                String(
                  question.chapter_id
                ) ===
                String(
                  chapter.id
                )
            ).length;

          return `

            <article
              class="chapter-card"
              onclick="selectChapter(
                '${attr(
                  chapter.id
                )}'
              )">

              <span class="chapter-index">
                ${String(
                  index + 1
                ).padStart(2, "0")}
              </span>

              <div>

                <p>
                  LESSON
                  ${String(
                    index + 1
                  ).padStart(2, "0")}
                </p>

                <h3>
                  ${esc(
                    chapter.title
                  )}
                </h3>

                <small>
                  ${count}
                  سؤال
                </small>

              </div>

              <b>↙</b>

            </article>
          `;
        }
      )
      .join("");
}

window.selectChapter =
  function (id) {

    const filter =
      $("#chapterFilter");

    if (filter) {
      filter.value = id;
    }

    const section =
      $("#questions");

    section?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    renderQuestions();
  };

/* =========================================================
   CONTACT
========================================================= */

function renderContact() {

  const container =
    $("#contactActions");

  if (!container) return;

  const number =
    String(
      state.settings.whatsapp_number ||
      ""
    ).replace(/\D/g, "");

  const message =
    state.settings.whatsapp_message ||
    "أهلًا، أحتاج إلى مساعدة.";

  const email =
    state.settings.contact_email ||
    "";

  let html = "";

  if (number) {

    html += `
      <a
        class="btn btn-gold"
        target="_blank"
        rel="noopener noreferrer"
        href="https://wa.me/${number}?text=${encodeURIComponent(
          message
        )}">
        واتساب
      </a>
    `;
  }

  if (email) {

    html += `
      <a
        class="btn"
        href="mailto:${attr(
          email
        )}">
        بريد إلكتروني
      </a>
    `;
  }

  container.innerHTML =
    html ||
    `
      <span class="state-message">
        بيانات التواصل غير متاحة حاليًا.
      </span>
    `;
}

/* =========================================================
   ANSWER / COPY
========================================================= */

window.toggleBox =
  function (
    button,
    id,
    showKey,
    hideKey
  ) {

    const element =
      document.getElementById(id);

    if (!element) return;

    const open =
      element.classList.toggle(
        "open"
      );

    button.textContent =
      text(
        open
          ? hideKey
          : showKey
      );
  };

/*
   النسخ = الإجابة فقط
*/

window.copyQuestion =
  async function (id) {

    const question =
      state.questions.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!question) return;

    const answer =
      String(
        question.answer || ""
      ).trim();

    if (!answer) {

      toast(
        text(
          "ANSWER_EMPTY",
          "لا توجد إجابة لنسخها."
        )
      );

      return;
    }

    try {

      await navigator.clipboard
        .writeText(answer);

      toast(
        text(
          "COPIED",
          "تم نسخ الإجابة."
        )
      );

    } catch (error) {

      console.error(
        "Copy error:",
        error
      );

      toast(
        "تعذر النسخ. اسمح للمتصفح بالوصول إلى الحافظة."
      );
    }
  };

/* =========================================================
   REPORT
========================================================= */

window.reportQuestion =
  function (id) {

    const question =
      state.questions.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!question) return;

    const number =
      String(
        state.settings.whatsapp_number ||
        ""
      ).replace(/\D/g, "");

    if (!number) {

      toast(
        "بيانات التواصل غير متاحة."
      );

      return;
    }

    const message =
      `بلاغ عن السؤال\n\n${question.title}`;

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

/* =========================================================
   QUESTION STATE
========================================================= */

function setQuestionsState(message) {

  const element =
    $("#questionsState");

  if (element) {
    element.textContent =
      message || "";
  }
}

/* =========================================================
   LANGUAGE CHANGE
========================================================= */

window.addEventListener(
  "qa-language-change",
  () => {

    const search =
      $("#searchInput");

    if (search) {

      search.placeholder =
        text(
          "SEARCH_PLACEHOLDER",
          "ابحث عن سؤال..."
        );
    }

    renderAll();
  }
);

/* =========================================================
   LEO AI
========================================================= */

function bindLeo() {

  const overlay =
    $("#leoOverlay");

  const fab =
    $("#leoFab");

  const context =
    $("#leoQuestionContext");

  if (!overlay || !fab) return;

  window.leoCurrentQuestion =
    null;

  function openLeo(question = null) {

    if (question) {

      window.leoCurrentQuestion =
        question;

      const title =
        context?.querySelector(
          "strong"
        );

      if (title) {

        title.textContent =
          question.title ||
          "السؤال الحالي";
      }
    }

    overlay.classList.add(
      "open"
    );

    overlay.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "leo-open"
    );

    $("#homeAiInput")?.focus();
  }

  function closeLeo() {

    overlay.classList.remove(
      "open"
    );

    overlay.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "leo-open"
    );
  }

  window.openLeo =
    openLeo;

  window.closeLeo =
    closeLeo;

  window.askLeo =
    function (id) {

      const question =
        state.questions.find(
          (item) =>
            String(item.id) ===
            String(id)
        );

      if (!question) return;

      openLeo(question);

      const messages =
        $("#homeAiMessages");

      if (messages) {

        messages.innerHTML = `

          <div class="ai-message ai-message-bot">

            <div class="ai-message-label">
              ليو
            </div>

            <div class="ai-message-text">

              أنا معاك في السؤال ده.
              اسألني عن أي جزء مش واضح.

            </div>

          </div>

        `;
      }

      window.dispatchEvent(
        new CustomEvent(
          "leo-question-selected",
          {
            detail: question
          }
        )
      );
    };

  fab.addEventListener(
    "click",
    () => {

      openLeo(
        window.leoCurrentQuestion
      );

    }
  );

  overlay
    .querySelectorAll(
      "[data-leo-close]"
    )
    .forEach(
      (element) => {

        element.addEventListener(
          "click",
          closeLeo
        );

      }
    );

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {
        closeLeo();
      }

    }
  );
}

/* =========================================================
   LEO AI — N8N
========================================================= */

(() => {

  const N8N_AI_URL =
    "https://jane-loy.app.n8n.cloud/webhook/5e5a2910-d731-49b4-9217-c70938ca749c";

  const messages =
    $("#homeAiMessages");

  const input =
    $("#homeAiInput");

  const send =
    $("#homeAiSend");

  const stop =
    $("#homeAiStop");

  const newChat =
    $("#aiNewChat");

  const typing =
    $("#homeAiTyping");

  if (
    !messages ||
    !input ||
    !send
  ) {
    return;
  }

  let history = [];

  let controller = null;

  let loading = false;

  function escapeHTML(value) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  function addMessage(
    messageText,
    type
  ) {

    const element =
      document.createElement(
        "div"
      );

    element.className =
      `ai-message ai-message-${type}`;

    let formatted =
      escapeHTML(
        messageText
      );

    formatted =
      formatted.replace(
        /```([\s\S]*?)```/g,
        `
          <div class="ai-code">
            <div class="ai-code-header">
              CODE
            </div>
            <pre>$1</pre>
          </div>
        `
      );

    formatted =
      formatted.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
      );

    formatted =
      formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );

    formatted =
      formatted.replace(
        /\n/g,
        "<br>"
      );

    element.innerHTML = `

      <div class="ai-message-label">
        ${
          type === "user"
            ? "أنت"
            : "ليو"
        }
      </div>

      <div class="ai-message-text">
        ${formatted}
      </div>

    `;

    messages.appendChild(
      element
    );

    messages.scrollTop =
      messages.scrollHeight;
  }

  function setLoading(value) {

    loading = value;

    typing?.classList.toggle(
      "hidden",
      !value
    );

    send?.classList.toggle(
      "hidden",
      value
    );

    stop?.classList.toggle(
      "hidden",
      !value
    );

    input.disabled = value;
  }

  function extractReply(data) {

    if (!data) return "";

    if (
      typeof data ===
      "string"
    ) {
      return data;
    }

    const keys = [
      "reply",
      "output",
      "text",
      "response",
      "answer",
      "message"
    ];

    for (
      const key of keys
    ) {

      if (
        typeof data[key] ===
        "string"
      ) {
        return data[key];
      }
    }

    if (data.data) {

      return extractReply(
        data.data
      );
    }

    if (
      Array.isArray(data) &&
      data.length
    ) {

      return extractReply(
        data[0]
      );
    }

    return "";
  }

  async function sendMessage() {

    if (loading) return;

    const value =
      input.value.trim();

    if (!value) return;

    addMessage(
      value,
      "user"
    );

    input.value = "";

    input.style.height =
      "auto";

    history.push({
      role: "user",
      content: value
    });

    setLoading(true);

    controller =
      new AbortController();

    try {

      const current =
        window.leoCurrentQuestion;

      const response =
        await fetch(
          N8N_AI_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Accept":
                "application/json"
            },

            body:
              JSON.stringify({

                message: value,

                history:
                  history.slice(-20),

                language: "ar",

                mode:
                  "developer",

                source:
                  "study-world-leo",

                currentQuestion:
                  current
                    ? {
                        id:
                          current.id,

                        title:
                          current.title,

                        question:
                          current.question_text,

                        answer:
                          current.answer,

                        explanation:
                          current.explanation,

                        code:
                          current.code
                      }
                    : null
              }),

            signal:
              controller.signal
          }
        );

      if (!response.ok) {

        throw new Error(
          `N8N ${response.status}`
        );
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {

        data =
          await response.json();

      } else {

        data =
          await response.text();
      }

      const reply =
        extractReply(data);

      if (!reply) {

        throw new Error(
          "Empty AI response"
        );
      }

      addMessage(
        reply,
        "bot"
      );

      history.push({
        role: "assistant",
        content: reply
      });

    } catch (error) {

      console.error(
        "Leo AI error:",
        error
      );

      if (
        error.name ===
        "AbortError"
      ) {

        addMessage(
          "تم إيقاف الرد.",
          "bot"
        );

      } else {

        addMessage(
          "حصلت مشكلة في الاتصال بليو. حاول مرة ثانية.",
          "bot"
        );
      }

    } finally {

      controller = null;

      setLoading(false);

      input.focus();
    }
  }

  send.addEventListener(
    "click",
    sendMessage
  );

  stop?.addEventListener(
    "click",
    () => {

      if (controller) {
        controller.abort();
      }

    }
  );

  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }

    }
  );

  input.addEventListener(
    "input",
    () => {

      input.style.height =
        "auto";

      input.style.height =
        `${Math.min(
          input.scrollHeight,
          150
        )}px`;
    }
  );

  newChat?.addEventListener(
    "click",
    () => {

      history = [];

      window.leoCurrentQuestion =
        null;

      messages.innerHTML = `

        <div class="ai-message ai-message-bot">

          <div class="ai-message-label">
            ليو
          </div>

          <div class="ai-message-text">

            أهلاً بيك.
            <br><br>
            المحادثة بدأت من جديد.
            اسألني عن البرمجة أو الدراسة.

          </div>

        </div>

      `;

      input.value = "";

      input.focus();
    }
  );

})();

/* =========================================================
   GLOBAL ERROR HANDLER
   عشان أي خطأ لا يجعل الصفحة تعلق بدون سبب
========================================================= */

window.addEventListener(
  "error",
  (event) => {

    console.error(
      "Site error:",
      event.error ||
      event.message
    );
  }
);

window.addEventListener(
  "unhandledrejection",
  (event) => {

    console.error(
      "Unhandled promise:",
      event.reason
    );
  }
);
