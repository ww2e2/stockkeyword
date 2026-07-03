export function renderRankingsClientScript() {
  return `

    function createRankingCard(titleText, items, valueKey) {
      const card = document.createElement('section');
      card.className = 'summary-card';

      const heading = document.createElement('h3');
      heading.textContent = titleText;
      card.appendChild(heading);

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '이번달 데이터가 아직 없습니다.';
        card.appendChild(empty);
        return card;
      }

      const list = document.createElement('ol');
      list.className = 'rank-list';

      items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'rank-item';

        const rank = document.createElement('span');
        rank.className = 'rank-order';
        rank.textContent = String(index + 1);

        const label = document.createElement('span');
        label.className = 'rank-label';
        label.textContent = item[valueKey] || '-';

        const count = document.createElement('span');
        count.className = 'rank-count';
        count.textContent = (item.count || 0) + '회';

        li.appendChild(rank);
        li.appendChild(label);
        li.appendChild(count);
        list.appendChild(li);
      });

      card.appendChild(list);
      return card;
    }

    function renderMonthlyRankings(data) {
      if (!rankingPanelEl) return;
      rankingPanelEl.innerHTML = '';

      rankingPanelEl.appendChild(
        createRankingCard('이번달 키워드 검색 순위 TOP 20', data.keywordSearchTop20 || [], 'keyword')
      );
      rankingPanelEl.appendChild(
        createRankingCard('이번달 콘텐츠 유형 검색 순위', data.contentTypeTop20 || [], 'label')
      );
      rankingPanelEl.appendChild(
        createRankingCard('이번달 템플릿 종류 검색 순위 TOP 20', data.templateTypeTop20 || [], 'label')
      );
      rankingPanelEl.appendChild(
        createRankingCard('이번달 템플릿 키워드 검색 순위 TOP 20', data.templateKeywordTop20 || [], 'keyword')
      );
    }

    async function loadMonthlyRankings() {
      if (!rankingPanelEl) return;

      try {
        const response = await fetch('/api/monthly-rankings');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || '랭킹 요청 실패');
        }

        renderMonthlyRankings(data);
      } catch (error) {
        rankingPanelEl.innerHTML = '';
        const card = document.createElement('section');
        card.className = 'summary-card';
        const heading = document.createElement('h3');
        heading.textContent = '이번달 인기 검색 순위';
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = error?.message || String(error);
        card.appendChild(heading);
        card.appendChild(empty);
        rankingPanelEl.appendChild(card);
      }
    }
`;
}
