
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
window.addEventListener('resize', function () {
	const nav = document.getElementById('main-nav');
	const hamburger = document.getElementById('hamburger-btn');

	const hamburgerDisplay = window.getComputedStyle(hamburger).display;

	if (hamburgerDisplay === 'none') {
		// 햄버거 버튼 안 보이면 데스크탑 → row
		nav.style.display = 'none';
		nav.style.flexDirection = 'row';
		console.log("22222");
	} else {
		// 햄버거 버튼 보이면 모바일 → column or none 유지
		if (nav.style.display !== 'none') {
			nav.style.flexDirection = 'column';
		}
	}
});

