document.addEventListener("DOMContentLoaded", function () {
  const containers = document.querySelectorAll(".faqify-widget-container");

  containers.forEach((container) => {
    const shop = container.dataset.shop;
    const category = container.dataset.category;
    const style = container.dataset.style;
    const searchEnabled = container.dataset.search === "true";
    const votesEnabled = container.dataset.votes === "true";
    const contentArea = container.querySelector(".faqify-content-area");
    const searchInput = container.querySelector(".faqify-search-input");

    let allFaqs = [];

    // Fetch FAQs and settings from the public API
    const apiUrl = `/apps/faqify/api/public/faqs?shop=${shop}&category=${category}`;

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        allFaqs = data.faqs || [];

        // Apply saved template settings as CSS custom properties
        if (data.templateSettings) {
          applySettings(container, data.templateSettings);
        }

        renderFaqs(allFaqs);
      })
      .catch((err) => {
        console.error("FAQify Error:", err);
        // Fallback demo data
        allFaqs = [
          { id: "1", question: "How does shipping work?", answer: "We ship within 2-3 business days.", categoryName: "Shipping" },
          { id: "2", question: "What is your return policy?", answer: "Returns accepted within 30 days.", categoryName: "Returns" },
        ];
        renderFaqs(allFaqs);
      });

    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allFaqs.filter((faq) =>
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query)
        );
        renderFaqs(filtered);
      });
    }

    /**
     * Apply saved template settings as CSS custom properties on the container.
     */
    function applySettings(el, settings) {
      const s = settings;

      // Colors
      if (s.primaryColor) el.style.setProperty("--faqify-primary", s.primaryColor);
      if (s.secondaryColor) el.style.setProperty("--faqify-secondary", s.secondaryColor);
      if (s.backgroundColor) el.style.setProperty("--faqify-bg", s.backgroundColor);
      if (s.textColor) el.style.setProperty("--faqify-text", s.textColor);
      if (s.cardBackground) el.style.setProperty("--faqify-card-bg", s.cardBackground);
      if (s.borderColor) el.style.setProperty("--faqify-border", s.borderColor);

      // Typography
      if (s.fontFamily) {
        el.style.setProperty("--faqify-font", s.fontFamily + ", sans-serif");
        // Load Google Font dynamically
        if (s.fontFamily && !s.fontFamily.startsWith("-apple-system")) {
          const fontLink = document.createElement("link");
          fontLink.rel = "stylesheet";
          fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(s.fontFamily)}:wght@400;500;600;700&display=swap`;
          document.head.appendChild(fontLink);
        }
      }
      if (s.headingFontSize) el.style.setProperty("--faqify-heading-size", s.headingFontSize + "px");
      if (s.bodyFontSize) el.style.setProperty("--faqify-body-size", s.bodyFontSize + "px");
      if (s.questionFontWeight) el.style.setProperty("--faqify-question-weight", s.questionFontWeight);

      // Layout
      if (s.borderRadius) el.style.setProperty("--faqify-radius", s.borderRadius + "px");
      if (s.cardPadding) el.style.setProperty("--faqify-card-padding", s.cardPadding + "px");
      if (s.itemSpacing) el.style.setProperty("--faqify-spacing", s.itemSpacing + "px");
      if (s.containerMaxWidth) el.style.setProperty("--faqify-max-width", s.containerMaxWidth + "px");

      // Card style
      if (s.cardBorderWidth) el.style.setProperty("--faqify-border-width", s.cardBorderWidth + "px");
      if (s.cardShadow) {
        const shadowMap = {
          none: "none",
          sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
          md: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
          lg: "0 10px 25px rgba(0,0,0,0.1), 0 6px 10px rgba(0,0,0,0.08)",
        };
        el.style.setProperty("--faqify-shadow", shadowMap[s.cardShadow] || "none");
      }

      // Hover effects
      if (s.cardHoverEffect) {
        switch (s.cardHoverEffect) {
          case "lift":
            el.style.setProperty("--faqify-hover-transform", "translateY(-3px)");
            el.style.setProperty("--faqify-hover-shadow", "0 12px 24px rgba(0,0,0,0.12)");
            break;
          case "glow":
            el.style.setProperty("--faqify-hover-transform", "none");
            el.style.setProperty("--faqify-hover-shadow", "0 0 20px rgba(99,102,241,0.25)");
            break;
          case "border":
            el.style.setProperty("--faqify-hover-transform", "none");
            el.style.setProperty("--faqify-hover-border", s.primaryColor || "#6366f1");
            break;
          default:
            el.style.setProperty("--faqify-hover-transform", "none");
        }
      }

      // Icon
      if (s.iconColor) el.style.setProperty("--faqify-icon-color", s.iconColor);
      if (s.iconStyle) {
        const rotateMap = { chevron: "90deg", plus: "0deg", arrow: "180deg" };
        el.style.setProperty("--faqify-icon-rotate", rotateMap[s.iconStyle] || "90deg");
      }
    }

    function getIconChar(iconStyle, isOpen) {
      const storedStyle = container.style.getPropertyValue("--faqify-icon-style") || iconStyle || "chevron";
      switch (storedStyle) {
        case "plus": return isOpen ? "−" : "+";
        case "arrow": return "↓";
        default: return "›";
      }
    }

    function renderFaqs(faqs) {
      if (faqs.length === 0) {
        contentArea.innerHTML = '<p style="text-align:center;padding:20px;opacity:0.5;">No FAQs found.</p>';
        return;
      }

      if (style === "accordion" || style === undefined) {
        contentArea.innerHTML = faqs
          .map(
            (faq) => `
          <div class="faqify-accordion-item" data-id="${faq.id}">
            <button class="faqify-accordion-header">
              ${faq.question}
              <span class="faqify-icon">${getIconChar(null, false)}</span>
            </button>
            <div class="faqify-accordion-content">
              <div class="faqify-answer-inner">${faq.answer}</div>
              ${votesEnabled ? renderVotes(faq.id) : ""}
            </div>
          </div>
        `
          )
          .join("");

        // Add accordion listeners
        contentArea.querySelectorAll(".faqify-accordion-header").forEach((btn) => {
          btn.addEventListener("click", function () {
            const item = this.parentElement;
            const content = this.nextElementSibling;
            const isOpen = item.classList.contains("active");

            // Close all
            contentArea.querySelectorAll(".faqify-accordion-item").forEach((i) => {
              i.classList.remove("active");
              i.querySelector(".faqify-accordion-content").style.maxHeight = null;
              i.querySelector(".faqify-icon").textContent = getIconChar(null, false);
            });

            if (!isOpen) {
              item.classList.add("active");
              content.style.maxHeight = content.scrollHeight + "px";
              this.querySelector(".faqify-icon").textContent = getIconChar(null, true);
              trackEvent(item.dataset.id, "expand");
            }
          });
        });
      } else if (style === "grid") {
        contentArea.innerHTML =
          '<div class="faqify-grid">' +
          faqs
            .map(
              (faq) => `
            <div class="faqify-grid-card">
              <h3>${faq.question}</h3>
              <div>${faq.answer}</div>
              ${votesEnabled ? renderVotes(faq.id) : ""}
            </div>
          `
            )
            .join("") +
          "</div>";
      } else {
        contentArea.innerHTML = '<p style="text-align:center;padding:20px;opacity:0.5;">Display style not supported yet.</p>';
      }

      // Track view events
      faqs.forEach((f) => trackEvent(f.id, "view"));

      // Bind vote buttons
      if (votesEnabled) {
        contentArea.querySelectorAll(".faqify-vote-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const eventType = this.dataset.vote === "up" ? "helpful" : "not_helpful";
            const faqId = this.dataset.id;
            trackEvent(faqId, eventType);
            this.parentElement.innerHTML = '<span style="opacity:0.6;">Thank you for your feedback!</span>';
          });
        });
      }
    }

    function renderVotes(faqId) {
      return `
        <div class="faqify-votes">
          <p>Was this helpful?</p>
          <button class="faqify-vote-btn" data-id="${faqId}" data-vote="up">👍 Yes</button>
          <button class="faqify-vote-btn" data-id="${faqId}" data-vote="down">👎 No</button>
        </div>
      `;
    }

    function trackEvent(faqId, event) {
      // Uncomment when analytics API is ready:
      // fetch(`/apps/faqify/api/analytics`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ shop, faqId, event, page: window.location.pathname })
      // }).catch(() => {});
    }
  });
});
