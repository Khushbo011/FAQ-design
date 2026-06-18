document.addEventListener("DOMContentLoaded", function() {
  const containers = document.querySelectorAll(".faqify-widget-container");

  containers.forEach(container => {
    const shop = container.dataset.shop;
    const category = container.dataset.category;
    const style = container.dataset.style;
    const searchEnabled = container.dataset.search === "true";
    const votesEnabled = container.dataset.votes === "true";
    const contentArea = container.querySelector(".faqify-content-area");
    const searchInput = container.querySelector(".faqify-search-input");
    
    // Replace with your actual app URL in production
    const appDomain = "https://faqify-pro.fly.dev"; // Or localhost for dev
    
    // Fallback for dev environment without actual app domain setup
    // You should dynamically inject this from liquid if possible, but for now we assume relative or known domain.
    const apiUrl = `/apps/faqify/api/public/faqs?shop=${shop}&category=${category}`;

    let allFaqs = [];

    // Mock fetch for demonstration if no proxy is setup
    // In real app, this should fetch from the app proxy
    setTimeout(() => {
      // Mock data if fetch fails
      allFaqs = [
        { id: "1", question: "How does shipping work?", answer: "We ship within 2-3 business days.", categoryName: "Shipping" },
        { id: "2", question: "What is your return policy?", answer: "Returns accepted within 30 days.", categoryName: "Returns" }
      ];
      renderFaqs(allFaqs);
    }, 500);

    /*
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        allFaqs = data;
        renderFaqs(allFaqs);
      })
      .catch(err => {
        console.error("FAQify Error:", err);
        contentArea.innerHTML = "<p>Unable to load FAQs.</p>";
      });
    */

    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allFaqs.filter(faq => faq.question.toLowerCase().includes(query));
        renderFaqs(filtered);
      });
    }

    function renderFaqs(faqs) {
      if (faqs.length === 0) {
        contentArea.innerHTML = "<p>No FAQs found.</p>";
        return;
      }

      if (style === "accordion") {
        contentArea.innerHTML = faqs.map(faq => `
          <div class="faqify-accordion-item" data-id="${faq.id}">
            <button class="faqify-accordion-header">
              ${faq.question}
              <span class="faqify-icon">+</span>
            </button>
            <div class="faqify-accordion-content">
              <div class="faqify-answer-inner">${faq.answer}</div>
              ${votesEnabled ? renderVotes(faq.id) : ''}
            </div>
          </div>
        `).join('');

        // Add listeners
        contentArea.querySelectorAll(".faqify-accordion-header").forEach(btn => {
          btn.addEventListener("click", function() {
            const item = this.parentElement;
            const content = this.nextElementSibling;
            const isOpen = item.classList.contains("active");

            // Close all
            contentArea.querySelectorAll(".faqify-accordion-item").forEach(i => {
              i.classList.remove("active");
              i.querySelector(".faqify-accordion-content").style.maxHeight = null;
              i.querySelector(".faqify-icon").textContent = "+";
            });

            if (!isOpen) {
              item.classList.add("active");
              content.style.maxHeight = content.scrollHeight + "px";
              this.querySelector(".faqify-icon").textContent = "-";
              
              // Track expand event
              trackEvent(item.dataset.id, "expand");
            }
          });
        });

      } else if (style === "grid") {
         contentArea.innerHTML = `<div class="faqify-grid">` + faqs.map(faq => `
          <div class="faqify-grid-card">
            <h3>${faq.question}</h3>
            <div>${faq.answer}</div>
            ${votesEnabled ? renderVotes(faq.id) : ''}
          </div>
        `).join('') + `</div>`;
      } else {
         contentArea.innerHTML = "<p>Tabs style not fully implemented in this demo.</p>";
      }

      // Track view events
      faqs.forEach(f => trackEvent(f.id, "view"));
      
      // Bind vote buttons
      if (votesEnabled) {
         contentArea.querySelectorAll(".faqify-vote-btn").forEach(btn => {
            btn.addEventListener("click", function() {
               const eventType = this.dataset.vote === "up" ? "helpful" : "not_helpful";
               const faqId = this.dataset.id;
               trackEvent(faqId, eventType);
               this.parentElement.innerHTML = "<span>Thank you for your feedback!</span>";
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
      // fetch(`/apps/faqify/api/analytics`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ shop, faqId, event, page: window.location.pathname })
      // }).catch(() => {});
    }
  });
});
