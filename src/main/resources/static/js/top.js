
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
});
// 브라우저 크기 변경 시 메뉴 display 복구
window.addEventListener('resize', function () {
	const nav = document.getElementById('main-nav');
	const button = document.getElementById('hamburger-btn');

	if (window.innerWidth > 768) {
		// 데스크탑 모드: nav 강제 복구
		nav.style.display = 'flex';
		nav.style.flexDirection = 'row';
	} else {
		// 모바일 모드일 때는 숨김 상태로 유지
		nav.style.display = 'none';
	}
});

