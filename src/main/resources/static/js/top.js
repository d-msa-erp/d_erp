document.querySelectorAll('.grid-table td').forEach(td => {
  if (!td.querySelector('.ellipsis')) {
    const wrap = document.createElement('div');
    wrap.className = 'ellipsis';
    wrap.textContent = td.textContent.trim();
    td.textContent = '';
    td.appendChild(wrap);
  }
});

function toggleMenu(event, el) {
	event.stopPropagation();//버블링 방지

	// 이미 active면 해제
	if (el.classList.contains('active')) {
		el.classList.remove('active');
		return;
	}

	// 다른 메뉴 닫기
	document.querySelectorAll('.menu-item').forEach(item => {
		item.classList.remove('active');
	});

	// 현재 메뉴만 활성화
	el.classList.add('active');
}

// 바깥 누르면 모두 닫기
document.addEventListener('click', () => {
	document.querySelectorAll('.menu-item').forEach(item => {
		item.classList.remove('active');
	});
});


//햄버거 핸들링용
document.addEventListener('DOMContentLoaded', function() {

	const button = document.getElementById('hamburger-btn');
	const nav = document.getElementById('main-nav');


	if (button && nav) {
		button.addEventListener('click', function() {

			const currentDisplay = window.getComputedStyle(nav).display;
			if (currentDisplay === 'none') {
				nav.style.display = 'flex';
				nav.style.flexDirection = 'column';
			} else {
				nav.style.display = 'none';
			}
		});

	}
	
	// 사업장명 동적 삽입 (BIZ_FLAG = '03')
	  fetch('/api/site/details?bizFlag=03')
	    .then(res => {
	      if (!res.ok) throw new Error('사업장명 조회 실패');
	      return res.json();
	    })
	    .then(data => {
	      if (data && data.length > 0) {
	        const siteNm = data[0].siteNm || '스마트 제조 시스템';
	        const titleEl = document.getElementById('site-title');
	        if (titleEl) titleEl.textContent = siteNm;
	      }
	    })
	    .catch(err => {
	      console.warn('사업장명 설정 오류:', err);
	    });
	});
window.addEventListener('resize', function () {
	const nav = document.getElementById('main-nav');
	const hamburger = document.getElementById('hamburger-btn');

	const hamburgerDisplay = window.getComputedStyle(hamburger).display;

	if (hamburgerDisplay === 'none') {
		nav.style.display = 'flex';
		nav.style.flexDirection = 'row';
	} else {
		nav.style.display = 'none'; // 추가 필요
	}
});