document.addEventListener('DOMContentLoaded', function () {
  let isUpdate = false;

  fetch('/api/site/details?bizFlag=03')
    .then(response => {
      if (!response.ok) throw new Error('사업장 조회 실패');
      return response.json();
    })
    .then(data => {
      if (data && data.length > 0) {
        isUpdate = true;
        const site = data[0];

        document.getElementById('custCd').value = site.custCd || '';
        document.getElementById('siteNm').value = site.siteNm || '';
        document.getElementById('ceoNm').value = site.ceoNm || '';
        document.getElementById('bizNo').value = site.bizNo || '';
        document.getElementById('compNo').value = site.compNo || '';
        document.getElementById('corpRegNo').value = site.corpRegNo || '';
        document.getElementById('bizCond').value = site.bizCond || '';
        document.getElementById('bizItem').value = site.bizItem || '';
        document.getElementById('bizTel').value = site.bizTel || '';
        document.getElementById('bizFax').value = site.bizFax || '';
        document.getElementById('bizAddr').value = site.bizAddr || '';
      } else {
        isUpdate = false;
        document.getElementById('custCd').value = '선익짱'; // 초기화
      }
    });

  document.getElementById('frm').addEventListener('submit', function (event) {
    event.preventDefault();

    let custCdValue = document.getElementById('custCd').value.trim();
    if (!custCdValue) {
      custCdValue = '선익짱'; // 신규등록 시 고정값
    }

    const siteData = {
      custCd: custCdValue,
      siteNm: document.getElementById('siteNm').value,
      ceoNm: document.getElementById('ceoNm').value,
      bizNo: document.getElementById('bizNo').value,
      compNo: document.getElementById('compNo').value,
      corpRegNo: document.getElementById('corpRegNo').value,
      bizCond: document.getElementById('bizCond').value,
      bizItem: document.getElementById('bizItem').value,
      bizTel: document.getElementById('bizTel').value,
      bizFax: document.getElementById('bizFax').value,
      bizAddr: document.getElementById('bizAddr').value
    };

    fetch(isUpdate ? '/api/site/update' : '/api/site/create', {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData)
    })
      .then(res => res.ok ? res.json() : res.text().then(t => { throw new Error(t); }))
      .then(result => {
        alert(isUpdate ? '수정 완료' : '등록 완료');
        console.log(result);
      })
      .catch(error => {
        alert('요청 실패: ' + error.message);
        console.error(error);
      });
  });
});
