document.addEventListener('DOMContentLoaded', function () {
  let isUpdate = false; // 현재 데이터가 업데이트인지 신규 등록인지 구분하는 플래그
  let currentCustCd = null; // 현재 로드된 사업장의 custCd (수정 시 사용)

  // 페이지 로드 시 사업장 정보 조회 (bizFlag=03은 '본사' 또는 특정 사업장을 의미할 수 있음)
  fetch('/api/site/details?bizFlag=03') // 이 API는 해당 bizFlag의 사업장 정보를 배열로 반환한다고 가정
    .then(response => {
      if (!response.ok) {
        // 404 (Not Found)는 아직 데이터가 없는 경우일 수 있으므로 오류로 간주하지 않고 신규 등록 모드로 진입
        if (response.status === 404) return null; 
        throw new Error('사업장 정보 조회에 실패했습니다. 상태: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.length > 0) { // 데이터가 있으면 기존 정보 수정 모드
        isUpdate = true;
        const site = data[0]; // 첫 번째 사업장 정보를 사용한다고 가정
        currentCustCd = site.custCd; // 수정 시 사용할 custCd 저장

        // document.getElementById('custCd').value = site.custCd || ''; // custCd는 hidden이므로 직접 설정 불필요할 수 있음
        document.getElementById('siteNm').value = site.siteNm || '';
        document.getElementById('ceoNm').value = site.ceoNm || '';
        document.getElementById('bizNo').value = site.bizNo || '';
        document.getElementById('compNo').value = site.compNo || ''; // 사업장 번호
        document.getElementById('corpRegNo').value = site.corpRegNo || ''; // 법인 번호
        document.getElementById('bizCond').value = site.bizCond || ''; // 종목
        document.getElementById('bizItem').value = site.bizItem || ''; // 업태
        document.getElementById('bizTel').value = site.bizTel || '';
        document.getElementById('bizFax').value = site.bizFax || '';
        document.getElementById('bizAddr').value = site.bizAddr || '';
      } else { // 데이터가 없으면 신규 등록 모드
        isUpdate = false;
        currentCustCd = null; // 신규 등록 시 custCd는 서버에서 생성되거나, 특정 값을 사용
        console.log("기존 사업장 정보 없음. 신규 등록 모드로 진행합니다.");
        // 신규 등록 시 특정 기본값 설정 (예: custCd는 서버에서 자동 생성되도록 비워두거나,
        // 또는 특정 규칙에 따라 클라이언트에서 생성 - 현재 로직은 '선익짱'으로 하드코딩 시도했었음)
        // document.getElementById('custCd').value = '선익짱'; // 이 부분은 서버 정책에 따라 조정 필요
      }
    })
    .catch(error => {
        console.error("사업장 정보 로딩 중 오류:", error);
        alert("사업장 정보를 불러오는 중 오류가 발생했습니다. " + error.message);
        isUpdate = false; // 오류 시 신규 등록 모드로 간주 (또는 다른 오류 처리)
    });

  // 폼 제출 이벤트 리스너 (폼 ID를 'siteForm'으로 변경했으므로 여기서도 맞춰줌)
  const siteForm = document.getElementById('siteForm');
  if (siteForm) {
    siteForm.addEventListener('submit', function (event) {
        event.preventDefault(); // 기본 폼 제출 방지

        // const custCdValue = document.getElementById('custCd').value.trim(); // hidden 필드의 custCd

        const siteData = {
            // custCd: isUpdate ? currentCustCd : (custCdValue || null), // 수정 시에는 로드된 custCd, 신규 시에는 입력값 또는 null
            // 신규 등록 시 custCd를 서버에서 생성하거나, bizFlag로 구분한다면 클라이언트에서 보낼 필요 없을 수 있음
            // 또는, 특정 고정값을 사용해야 할 수도 있음 (예: '선익짱'은 초기 로직)
            // 여기서는 수정 시에만 currentCustCd를 사용하고, 신규 시에는 서버에서 처리하도록 custCd를 보내지 않거나,
            // bizFlag와 함께 다른 필수값을 보냄. API 명세에 따라 조정 필요.
            siteNm: document.getElementById('siteNm').value,
            ceoNm: document.getElementById('ceoNm').value,
            bizNo: document.getElementById('bizNo').value,
            compNo: document.getElementById('compNo').value,
            corpRegNo: document.getElementById('corpRegNo').value,
            bizCond: document.getElementById('bizCond').value,
            bizItem: document.getElementById('bizItem').value,
            bizTel: document.getElementById('bizTel').value,
            bizFax: document.getElementById('bizFax').value,
            bizAddr: document.getElementById('bizAddr').value,
            bizFlag: '03' // 어떤 사업장을 등록/수정하는지 알려주는 플래그 (필요시)
        };

        // 수정 모드일 경우, custCd를 siteData에 포함 (경로 변수 대신 body에 포함하는 경우)
        if (isUpdate && currentCustCd) {
            siteData.custCd = currentCustCd;
        }
        
        const apiUrl = isUpdate ? `/api/site/update` : '/api/site/create';
        // PUT 요청 시, 경로에 ID를 포함해야 할 수도 있음 (예: /api/site/update/${currentCustCd})
        // API 설계에 따라 수정 필요. 여기서는 body에 custCd를 포함한다고 가정.

        fetch(apiUrl, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(siteData)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text || `요청 처리 실패 (상태: ${response.status})`); });
            }
            // 성공적인 응답 (200 OK, 201 Created 등)은 JSON을 반환할 수도, 안 할 수도 있음
            // 여기서는 JSON을 기대하지 않고 성공 메시지만 처리
            return response.text(); // 또는 response.json() 만약 서버가 JSON 객체를 반환한다면
        })
        .then(result => {
            alert(isUpdate ? '사업장 정보가 성공적으로 수정되었습니다.' : '사업장 정보가 성공적으로 등록되었습니다.');
            console.log(isUpdate ? "수정 결과:" : "등록 결과:", result);
            // 성공 후 현재 페이지 다시 로드 또는 사용자에게 다른 피드백
            // location.reload(); // 예: 페이지 새로고침
            // 또는, isUpdate 플래그를 true로 설정하고 currentCustCd를 업데이트 (신규 등록 성공 시)
            if (!isUpdate && result) { // 신규 등록 성공 시 반환된 데이터에서 custCd 등을 얻을 수 있다면
                try {
                    const newSiteData = JSON.parse(result);
                    if (newSiteData.custCd) {
                        currentCustCd = newSiteData.custCd;
                        // document.getElementById('custCd').value = newSiteData.custCd; // Hidden 필드 업데이트
                        isUpdate = true; // 다음 저장부터는 수정 모드
                    }
                } catch (e) {
                    console.warn("신규 등록 응답 파싱 실패:", e);
                }
            }

        })
        .catch(error => {
            alert('요청 처리 중 오류가 발생했습니다: ' + error.message);
            console.error("오류 상세:", error);
        });
    });
  }
});

// DaumPostcode 함수는 kakaoApi.js에 정의되어 있다고 가정
// function DaumPostcode(buttonElement) { ... }