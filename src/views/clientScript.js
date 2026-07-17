export function renderClientScript() {
  return `
    <script>
      (() => {
        const query = (selector, root = document) =>
          root.querySelector(selector);
        const queryAll = (selector, root = document) =>
          Array.from(root.querySelectorAll(selector));

        queryAll('.search-form').forEach((form) => {
          form.addEventListener('submit', (event) => {
            if (form.dataset.searchSubmitting === 'true') {
              event.preventDefault();
              return;
            }

            form.dataset.searchSubmitting = 'true';
            const submitButton = query('[type="submit"]', form);
            if (submitButton) submitButton.disabled = true;
          });
        });

        const workTargetCard = query('[data-work-target]');
        if (workTargetCard) {
          window.requestAnimationFrame(() => {
            const topbarHeight =
              query('.topbar')?.getBoundingClientRect().height || 0;
            const targetTop =
              workTargetCard.getBoundingClientRect().top + window.scrollY;

            window.scrollTo({
              top: Math.max(0, targetTop - topbarHeight - 24),
              behavior: 'smooth',
            });
          });
        }

        const sidebarToggle = query('[data-sidebar-toggle]');
        const sidebarBackdrop = query('.sidebar-backdrop');

        const setSidebarOpen = (isOpen) => {
          document.body.classList.toggle('sidebar-open', isOpen);

          if (sidebarToggle) {
            sidebarToggle.setAttribute('aria-expanded', String(isOpen));
            sidebarToggle.setAttribute(
              'aria-label',
              isOpen ? '메뉴 닫기' : '메뉴 열기',
            );
          }

          if (sidebarBackdrop) {
            sidebarBackdrop.hidden = !isOpen;
          }
        };

        sidebarToggle?.addEventListener('click', () => {
          setSidebarOpen(!document.body.classList.contains('sidebar-open'));
        });

        sidebarBackdrop?.addEventListener('click', () => {
          setSidebarOpen(false);
        });

        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            setSidebarOpen(false);
          }
        });

        const copyText = async (text) => {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
          }

          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        };

        document.addEventListener('click', async (event) => {
          const sidebarLink = event.target.closest('.sidebar-link');
          if (sidebarLink && window.matchMedia('(max-width: 900px)').matches) {
            setSidebarOpen(false);
          }

          const removeButton = event.target.closest('[data-keyword-remove]');
          if (removeButton) {
            const result = removeButton.closest(
              '.keyword-result, .keyword-result-embedded',
            );
            removeButton.closest('.keyword-chip')?.remove();

            if (result) {
              const keywords = queryAll('.keyword-chip-label', result)
                .map((item) => item.textContent.trim());
              const count = query('[data-selected-keyword-count]', result);
              const keywordString = query('[data-keyword-string]', result);

              if (count) count.textContent = keywords.length + '개';
              if (keywordString) keywordString.textContent = keywords.join(', ');
            }
            return;
          }

          const copyButton = event.target.closest('[data-copy-keywords]');
          if (copyButton) {
            const result = copyButton.closest(
              '.keyword-result, .keyword-result-embedded',
            );
            const keywordString = query('[data-keyword-string]', result);
            const text = keywordString?.textContent?.trim() || '';

            if (!text) return;

            try {
              await copyText(text);
              const originalText = copyButton.textContent;
              copyButton.textContent = '복사 완료';

              window.setTimeout(() => {
                copyButton.textContent = originalText;
              }, 1200);
            } catch {
              copyButton.textContent = '복사 실패';
            }
            return;
          }

          const templateTab = event.target.closest('[data-template-tab]');
          const templateResult = templateTab?.closest('[data-template-result]');

          if (templateTab && templateResult) {
            const target = templateTab.dataset.templateTab;

            queryAll('[data-template-panel]', templateResult)
              .forEach((panel) => {
                panel.hidden = panel.dataset.templatePanel !== target;
              });

            queryAll('[data-template-tab]', templateResult)
              .forEach((tab) => {
                const isActive = tab === templateTab;
                tab.classList.toggle('is-active', isActive);
                tab.setAttribute('aria-selected', String(isActive));
              });
            return;
          }

          const rankingTab = event.target.closest('[data-ranking-tab]');
          const rankingResult = rankingTab?.closest('[data-ranking-result]');

          if (rankingTab && rankingResult) {
            const target = rankingTab.dataset.rankingTab;

            queryAll('[data-ranking-panel]', rankingResult)
              .forEach((panel) => {
                panel.hidden = panel.dataset.rankingPanel !== target;
              });

            queryAll('[data-ranking-tab]', rankingResult)
              .forEach((tab) => {
                const isActive = tab === rankingTab;
                tab.classList.toggle('is-active', isActive);
                tab.setAttribute('aria-selected', String(isActive));
              });
            return;
          }

          const topicToggle = event.target.closest('[data-topic-toggle]');

          if (topicToggle) {
            const panelId = topicToggle.getAttribute('aria-controls');
            const panel = panelId
              ? document.getElementById(panelId)
              : query('[data-topic-panel]', topicToggle.parentElement);
            const willOpen =
              topicToggle.getAttribute('aria-expanded') !== 'true';

            topicToggle.setAttribute('aria-expanded', String(willOpen));

            if (panel) {
              panel.hidden = !willOpen;
            }
          }
        });
      })();
    </script>
  `;
}
