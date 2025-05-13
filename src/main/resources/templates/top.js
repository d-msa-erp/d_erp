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