function initFaqifyWidgets() {
  const containers = document.querySelectorAll(".faqify-widget-container");

  containers.forEach((container) => {
    // Prevent double-initialization
    if (container.classList.contains("faqify-initialized")) return;
    container.classList.add("faqify-initialized");

    const shop = container.dataset.shop;
    const category = container.dataset.category;
    const styleOverride = container.dataset.style;
    const searchEnabled = container.dataset.search === "true";
    const votesEnabled = container.dataset.votes === "true";
    const contentArea = container.querySelector(".faqify-content-area");
    const searchInput = container.querySelector(".faqify-search-input");

    if (!contentArea) return;

    let allFaqs = [];
    let currentFaqs = [];
    let activePlan = "Free";
    let activeTemplate = "classic";
    let customizedSettings = {};
    let allTemplatesList = [];
    let selectedTemplateId = "classic";
    let selectedCategory = "all";

    const FALLBACK_TEMPLATES = [
      { id: "classic", name: "Classic Accordion", tier: "free" },
      { id: "grid", name: "Grid Cards", tier: "starter" },
      { id: "split", name: "Split Categories", tier: "starter" },
      { id: "card", name: "Modern Card", tier: "starter" },
      { id: "masonry", name: "Masonry Layout", tier: "pro" },
      { id: "dark", name: "Dark Mode Premium", tier: "pro" }
    ];

    const getDatasetSettings = () => {
      const d = container.dataset;
      return {
        primaryColor: d.primaryColor,
        secondaryColor: d.secondaryColor,
        backgroundColor: d.backgroundColor,
        textColor: d.textColor,
        cardBackground: d.cardBackground,
        borderColor: d.borderColor,
        fontFamily: d.fontFamily,
        headingFontSize: d.headingFontSize,
        bodyFontSize: d.bodyFontSize,
        questionFontWeight: d.questionFontWeight,
        borderRadius: d.borderRadius,
        cardPadding: d.cardPadding,
        itemSpacing: d.itemSpacing,
        containerMaxWidth: d.containerMaxWidth,
        cardShadow: d.cardShadow,
        cardBorderWidth: d.cardBorderWidth,
        cardHoverEffect: d.cardHoverEffect,
        iconStyle: d.iconStyle,
        iconColor: d.iconColor,
      };
    };

    // Fetch FAQs and settings from the public API
    const apiUrl = `/apps/faqify/api/public/faqs?shop=${shop}&category=${category}`;

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        allFaqs = data.faqs || [];
        if (allFaqs.length === 0) {
          allFaqs = [
            { id: "1", question: "How does shipping work?", answer: "We ship within 2-3 business days.", categoryName: "Shipping" },
            { id: "2", question: "What is your return policy?", answer: "Returns accepted within 30 days.", categoryName: "Returns" },
            { id: "3", question: "Do you offer international delivery?", answer: "Yes, we ship to over 100 countries worldwide.", categoryName: "Shipping" },
            { id: "4", question: "How do I edit my store name?", answer: "Go to store settings in your dashboard to modify details.", categoryName: "General" }
          ];
        }
        currentFaqs = [...allFaqs];
        activePlan = data.activePlan || "Free";
        activeTemplate = data.activeTemplate || "classic";
        selectedTemplateId = (styleOverride && styleOverride !== "app") ? styleOverride : (activeTemplate || "classic");
        customizedSettings = data.templateSettings || {};
        allTemplatesList = data.allTemplates || [];

        const match = allTemplatesList.find(t => t.id === selectedTemplateId);
        const defaultSettings = match ? match.defaultSettings : {};
        
        let targetSettings;
        if (styleOverride === "app") {
          // Strictly use App Dashboard settings and active template
          targetSettings = {
            ...defaultSettings,
            ...(customizedSettings[selectedTemplateId] || {})
          };
        } else {
          // Merge theme editor schema settings over app dashboard settings
          targetSettings = {
            ...defaultSettings,
            ...(customizedSettings[selectedTemplateId] || {}),
            ...getDatasetSettings()
          };
        }

        // Apply saved template settings initially
        applySettings(container, selectedTemplateId, targetSettings);

        // Render FAQs
        renderFaqs(currentFaqs, selectedTemplateId);
      })
      .catch((err) => {
        console.error("FAQify Error:", err);
        // Fallback demo data
        allFaqs = [
          { id: "1", question: "How does shipping work?", answer: "We ship within 2-3 business days.", categoryName: "Shipping" },
          { id: "2", question: "What is your return policy?", answer: "Returns accepted within 30 days.", categoryName: "Returns" },
          { id: "3", question: "Do you offer international delivery?", answer: "Yes, we ship to over 100 countries worldwide.", categoryName: "Shipping" },
          { id: "4", question: "How do I edit my store name?", answer: "Go to store settings in your dashboard to modify details.", categoryName: "General" }
        ];
        currentFaqs = [...allFaqs];
        activePlan = "Free"; // Assume Free on failure
        allTemplatesList = FALLBACK_TEMPLATES;
        selectedTemplateId = (styleOverride && styleOverride !== "app") ? styleOverride : "classic";
        
        const match = allTemplatesList.find(t => t.id === selectedTemplateId);
        const defaultSettings = match ? match.defaultSettings : {};

        let targetSettings;
        if (styleOverride === "app") {
          targetSettings = defaultSettings;
        } else {
          targetSettings = {
            ...defaultSettings,
            ...getDatasetSettings()
          };
        }
        
        applySettings(container, selectedTemplateId, targetSettings);
        renderFaqs(currentFaqs, selectedTemplateId);
      });

    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        const query = e.target.value.toLowerCase();
        let filtered = allFaqs.filter((faq) =>
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query)
        );
        if (selectedTemplateId === "split" && selectedCategory !== "all") {
          filtered = filtered.filter(f => f.categoryName === selectedCategory);
        }
        currentFaqs = filtered;
        renderFaqs(currentFaqs, selectedTemplateId);
      });
    }

    /**
     * Render the template switcher dropdown
     */
    function renderSwitcher() {
      // Remove any existing switcher
      const existing = container.querySelector(".faqify-storefront-switcher");
      if (existing) existing.remove();

      if (!allTemplatesList || allTemplatesList.length === 0) return;

      const switcherDiv = document.createElement("div");
      switcherDiv.className = "faqify-storefront-switcher";

      let optionsHtml = "";
      allTemplatesList.forEach((t) => {
        const isUnlocked = canUseTemplate(t.tier, activePlan);
        const lockText = isUnlocked ? "" : ` 🔒 (Upgrade to ${t.tier === "starter" ? "Starter" : "Pro"})`;
        optionsHtml += `<option value="${t.id}" ${t.id === selectedTemplateId ? "selected" : ""} ${!isUnlocked ? "disabled" : ""}>${t.name}${lockText}</option>`;
      });

      switcherDiv.innerHTML = `
        <label for="faqify-template-select" class="faqify-switcher-label">Choose Layout:</label>
        <select id="faqify-template-select" class="faqify-template-select">
          ${optionsHtml}
        </select>
      `;

      // Insert switcher right after title, or at top
      const title = container.querySelector(".faqify-title");
      if (title) {
        title.parentNode.insertBefore(switcherDiv, title.nextSibling);
      } else {
        container.insertBefore(switcherDiv, container.firstChild);
      }

      // Add change listener
      const select = switcherDiv.querySelector(".faqify-template-select");
      if (select) {
        select.addEventListener("change", (e) => {
          const newTemplateId = e.target.value;
          selectedTemplateId = newTemplateId;
          
          const match = allTemplatesList.find(t => t.id === newTemplateId);
          const defaultSettings = match ? match.defaultSettings : {};
          let targetSettings = {
            ...defaultSettings,
            ...(customizedSettings[newTemplateId] || {}),
            ...getDatasetSettings()
          };

          // Apply settings and re-render
          applySettings(container, newTemplateId, targetSettings);
          selectedCategory = "all"; // Reset category filter for split layouts
          renderFaqs(allFaqs, newTemplateId);
          if (searchInput) searchInput.value = ""; // Clear search
        });
      }
    }

    function canUseTemplate(tier, plan) {
      if (tier === "free") return true;
      if (tier === "starter" && (plan === "Starter" || plan === "Pro")) return true;
      if (tier === "pro" && plan === "Pro") return true;
      return false;
    }

    /**
     * Apply saved template settings as CSS custom properties on the container.
     */
    function applySettings(el, templateId, settings) {
      const s = settings;

      // Set template name as data-attribute for styling overrides
      el.setAttribute("data-active-template", templateId);

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
            el.style.setProperty("--faqify-hover-shadow", "none");
            el.style.setProperty("--faqify-hover-border", "transparent");
        }
      }

      // Icon
      if (s.iconColor) el.style.setProperty("--faqify-icon-color", s.iconColor);
      if (s.iconStyle) {
        const rotateMap = { chevron: "90deg", plus: "0deg", arrow: "180deg" };
        el.style.setProperty("--faqify-icon-rotate", rotateMap[s.iconStyle] || "90deg");
        el.setAttribute("data-icon-style", s.iconStyle);
      }
    }

    function getIconChar(iconStyle, isOpen) {
      const activeStyle = container.getAttribute("data-icon-style") || iconStyle || "chevron";
      switch (activeStyle) {
        case "plus": return isOpen ? "−" : "+";
        case "arrow": return "↓";
        default: return "›";
      }
    }

    function renderFaqs(faqs, templateId) {
      // Check Plan Limitations
      if (allTemplatesList.length > 0) {
        const match = allTemplatesList.find(t => t.id === templateId);
        if (match && !canUseTemplate(match.tier, activePlan)) {
          contentArea.innerHTML = `
            <div style="text-align:center; padding: 40px; background: #fff3cd; color: #856404; border-radius: 8px; border: 1px solid #ffeeba;">
              <h3 style="margin-top: 0;">Premium Template Locked 🔒</h3>
              <p>This layout requires the <strong>${match.tier === 'starter' ? 'Starter' : 'Pro'} Plan</strong>.</p>
              <p>Please upgrade your plan in the FAQify Pro app dashboard to use this template.</p>
            </div>
          `;
          return;
        }
      }

      if (faqs.length === 0) {
        contentArea.innerHTML = '<p style="text-align:center;padding:40px;opacity:0.5;">No FAQs found matching your criteria.</p>';
        return;
      }

      // ─── Grid / Masonry Layouts ───
      if (templateId === "grid" || templateId === "masonry") {
        const isMasonry = templateId === "masonry";
        contentArea.innerHTML = `
          <div class="faqify-grid ${isMasonry ? "faqify-masonry" : ""}">
            ${faqs.map(
              (faq) => `
              <div class="faqify-grid-card">
                <h3>${faq.question}</h3>
                <div class="faqify-answer">${faq.answer}</div>
                ${votesEnabled ? renderVotes(faq.id) : ""}
              </div>
            `
            ).join("")}
          </div>
        `;
      } 
      // ─── Split Categories sidebar Layout ───
      else if (templateId === "split") {
        // Collect categories
        const categories = ["all"];
        faqs.forEach(f => {
          if (f.categoryName && !categories.includes(f.categoryName)) {
            categories.push(f.categoryName);
          }
        });

        // Filter FAQs by selected category
        const filteredFaqs = selectedCategory === "all" 
          ? faqs 
          : faqs.filter(f => f.categoryName === selectedCategory);

        let sidebarHtml = `<ul class="faqify-split-sidebar">`;
        categories.forEach(cat => {
          const label = cat === "all" ? "All Categories" : cat;
          sidebarHtml += `
            <li class="faqify-sidebar-item ${cat === selectedCategory ? "active" : ""}" data-category="${cat}">
              ${label}
            </li>
          `;
        });
        sidebarHtml += `</ul>`;

        const faqContentHtml = `
          <div class="faqify-split-content">
            ${renderAccordionItems(filteredFaqs)}
          </div>
        `;

        contentArea.innerHTML = `
          <div class="faqify-split-layout">
            ${sidebarHtml}
            ${faqContentHtml}
          </div>
        `;

        // Bind sidebar item click events
        contentArea.querySelectorAll(".faqify-sidebar-item").forEach(item => {
          item.addEventListener("click", function () {
            selectedCategory = this.dataset.category;
            renderFaqs(faqs, "split");
          });
        });

        // Add accordion listeners to the split content accordions
        bindAccordionListeners();
      } 
      // ─── Accordion layouts (classic, card, dark) ───
      else {
        contentArea.innerHTML = renderAccordionItems(faqs);
        bindAccordionListeners();
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

    function renderAccordionItems(faqs) {
      return faqs
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
    }

    function bindAccordionListeners() {
      contentArea.querySelectorAll(".faqify-accordion-header").forEach((btn) => {
        btn.addEventListener("click", function () {
          const item = this.parentElement;
          const content = this.nextElementSibling;
          const isOpen = item.classList.contains("active");

          // Close all accordions inside the contentArea
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
      // API call placeholder for analytics
    }
  });
}

// Initialize immediately, on DOM load, or on Shopify customizer section load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFaqifyWidgets);
} else {
  initFaqifyWidgets();
}

// Watch for Shopify Section Loader events in the customizer
document.addEventListener("shopify:section:load", function (event) {
  if (event.target.querySelector(".faqify-widget-container")) {
    // If the loaded section is our FAQ widget, re-run initialization
    initFaqifyWidgets();
  }
});

