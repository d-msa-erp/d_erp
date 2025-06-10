document.addEventListener('DOMContentLoaded', function () {
  let isUpdate = false;
  let currentCustCd = null;

  // 상단 타이틀 변경 (top.html 내 #site-title)
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
      //console.warn('상단 타이틀 사업장명 설정 오류:', err);
    });

  // 사업장 정보 로드
  fetch('/api/site/details?bizFlag=03')
    .then(response => {
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('사업장 정보 조회 실패: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.length > 0) {
        isUpdate = true;
        const site = data[0];
        currentCustCd = site.custCd;

        document.getElementById('siteNm').value = site.siteNm || '';
        document.getElementById('ceoNm').value = site.ceoNm || '';
        document.getElementById('bizNo').value = site.bizNo || '';
        autoHyphen(document.getElementById('bizNo'));
        document.getElementById('compNo').value = site.compNo || '';
        autoHyphen(document.getElementById('compNo'));
        document.getElementById('corpRegNo').value = site.corpRegNo || '';
        autoHyphen(document.getElementById('corpRegNo'));
        document.getElementById('bizCond').value = site.bizCond || '';
        document.getElementById('bizItem').value = site.bizItem || '';
        document.getElementById('bizTel').value = site.bizTel || '';
        autoHyphen(document.getElementById('bizTel'));
        document.getElementById('bizFax').value = site.bizFax || '';
        autoHyphen(document.getElementById('bizFax'));
        document.getElementById('bizAddr').value = site.bizAddr || '';
      } else {
        isUpdate = false;
        currentCustCd = null;
        //console.log("신규 등록 모드");
      }
    })
    .catch(error => {
      console.error("사업장 정보 로딩 오류:", error);
      alert("사업장 정보를 불러오는 중 오류: " + error.message);
    });

  // 자동 하이픈 및 숫자 입력 제한
  function autoHyphen(target) {
    const id = target.id;
    let val = target.value.replace(/\D/g, '');

    switch (id) {
      case 'bizNo':
        target.value = val.replace(/^(\d{3})(\d{2})(\d{0,5}).*/, (m, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join('-'));
        break;
      case 'corpRegNo':
        target.value = val.replace(/^(\d{6})(\d{0,7}).*/, (m, p1, p2) => [p1, p2].filter(Boolean).join('-'));
        break;
      case 'bizTel':
      case 'bizFax':
        if (val.startsWith('02')) {
          target.value = val.replace(/^(\d{2})(\d{3,4})(\d{0,4}).*/, (m, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join('-'));
        } else {
          target.value = val.replace(/^(\d{3})(\d{3,4})(\d{0,4}).*/, (m, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join('-'));
        }
        break;
      case 'compNo':
        target.value = val;
        break;
    }
  }

  ['bizNo', 'corpRegNo', 'bizTel', 'bizFax', 'compNo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => autoHyphen(el));
      el.addEventListener('keypress', e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); });
      el.addEventListener('paste', e => {
        const paste = e.clipboardData.getData('text');
        if (!/^\d+$/.test(paste.replace(/\D/g, ''))) {
          e.preventDefault();
          alert("숫자만 입력 가능합니다.");
        }
      });
    }
  });

  // 정규식 유효성 검사
  function validateForm() {
    const patterns = {
      bizNo: /^\d{3}-\d{2}-\d{5}$/,
      compNo: /^\d{1,20}$/,
      corpRegNo: /^\d{6}-\d{7}$/,
      bizTel: /^0\d{1,2}-\d{3,4}-\d{4}$/,
      bizFax: /^0\d{1,2}-\d{3,4}-\d{4}$/
    };

    for (const [id, regex] of Object.entries(patterns)) {
      const value = document.getElementById(id).value.trim();
      if (!regex.test(value)) {
        alert(`${id} 형식이 잘못되었습니다.`);
        document.getElementById(id).focus();
        return false;
      }
    }
    return true;
  }

  // 제출 처리
  const siteForm = document.getElementById('siteForm');
  if (siteForm) {
    siteForm.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!validateForm()) return;

      const siteData = {
        siteNm: document.getElementById('siteNm').value.trim(),
        ceoNm: document.getElementById('ceoNm').value.trim(),
        bizNo: document.getElementById('bizNo').value.replaceAll('-', ''),
        compNo: document.getElementById('compNo').value.trim(),
        corpRegNo: document.getElementById('corpRegNo').value.replaceAll('-', ''),
        bizCond: document.getElementById('bizCond').value.trim(),
        bizItem: document.getElementById('bizItem').value.trim(),
        bizTel: document.getElementById('bizTel').value.trim(),
        bizFax: document.getElementById('bizFax').value.trim(),
        bizAddr: document.getElementById('bizAddr').value.trim(),
        bizFlag: '03'
      };

      if (isUpdate && currentCustCd) {
        siteData.custCd = currentCustCd;
      }

      const apiUrl = isUpdate ? '/api/site/update' : '/api/site/create';

      fetch(apiUrl, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      })
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(text || `요청 실패 (상태: ${response.status})`);
            });
          }
          return response.text();
        })
        .then(result => {
          alert(isUpdate ? '수정 완료' : '등록 완료');
          //console.log(result);

          if (!isUpdate && result) {
            try {
              const newSite = JSON.parse(result);
              if (newSite.custCd) {
                currentCustCd = newSite.custCd;
                isUpdate = true;
              }
            } catch (e) {
              //console.warn('신규 등록 응답 파싱 실패', e);
            }
          }
		  location.reload();
        })
        .catch(error => {
          alert('오류 발생: ' + error.message);
          console.error('에러 상세:', error);
        });
    });
  }
});
