async function loadCustomers(bizFlag) {
	const customerTableBody = document.getElementById('customerTableBody');

	if (!customerTableBody) {
	    console.warn("ID가 'customerTableBody'인 요소를 찾을 수 없습니다.");
	    return;
	}

	// JSON 받아올 API 주소 (Spring 컨트롤러에서 @ResponseBody로 반환되는 엔드포인트를 사용하세요)
	const apiUrl = `/api/customer/${bizFlag}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const customers = await response.json();

        customerTableBody.innerHTML = '';

        if (customers && customers.length > 0) {
            customers.forEach(cust => {
                const row = document.createElement('tr');
                row.onclick = () => openCustomerDetail(cust.custIdx);

                // 체크박스
                const checkboxCell = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkboxCell.appendChild(checkbox);
                row.appendChild(checkboxCell);

                // 거래처명
                const nameCell = document.createElement('td');
                nameCell.textContent = cust.custNm || '';
                row.appendChild(nameCell);

                // 담당자명
                const presidentCell = document.createElement('td');
                presidentCell.textContent = cust.presidentNm || '';
                row.appendChild(presidentCell);

                // 연락처
                const telCell = document.createElement('td');
                telCell.textContent = cust.bizTel || '';
                row.appendChild(telCell);

                // 이메일
                const emailCell = document.createElement('td');
                emailCell.textContent = cust.custEmail || '';
                row.appendChild(emailCell);

                customerTableBody.appendChild(row);
            });
        } else {
			const noDataRow = document.createElement('tr');
			const noDataCell = document.createElement('td');

			noDataCell.className = 'nodata';
			noDataCell.setAttribute('style', 'grid-column: span 5; justify-content: center;');
			noDataCell.colSpan = 5;
			noDataCell.textContent = '등록된 데이터가 없습니다.';

			noDataRow.appendChild(noDataCell);
			customerTableBody.appendChild(noDataRow);
        }
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        customerTableBody.innerHTML = '';
        const errorRow = document.createElement('tr');
        const errorCell = document.createElement('td');
        errorCell.colSpan = 5;
        errorCell.textContent = '데이터 로딩 중 오류가 발생했습니다.';
        errorCell.style.color = 'red';
		errorCell.setAttribute('style', 'grid-column: span 5; justify-content: center;');
        errorCell.style.textAlign = 'center';
        errorRow.appendChild(errorCell);
        customerTableBody.appendChild(errorRow);
    }
}

// 헤더 텍스트 변경
function updateTableHeader(bizFlag) {
  const nameHeader = document.querySelector('#customerNameHeader');
  if (nameHeader) {
    nameHeader.innerHTML = (bizFlag === '02' ? '발주처명' : '거래처명') + '<a>↓</a>';
  }
}

function switchTab(el, type) {
  // 스타일 초기화 후 활성화
  document.querySelectorAll('.table-wrapper > div:nth-child(2) > span').forEach(span => {
    span.classList.remove('active');
  });
  el.classList.add('active');
  
  // 헤더 텍스트 변경
   updateTableHeader(type);

  // 데이터 로드
  loadCustomers(type);
}

// 페이지 처음 로딩 시 기본 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
	const tabs = document.querySelectorAll('.tab');
	tabs.forEach(tab => {
	    tab.addEventListener('click', () => {
	        const biztab = tab.dataset.bizflag;
	        loadCustomers(biztab);
	    });
	});
	

	 
	// 기본 로딩
	updateTableHeader('01');
	loadCustomers('01');
});

// 고객 클릭 시 호출하는 함수
async function openCustomerDetail(custIdx) {
  try {
    const response = await fetch(`/api/customer/detail/${custIdx}`);
    if (!response.ok) throw new Error('데이터 로딩 실패');

    const data = await response.json();
    openModal(data);  // 받은 데이터로 모달 열기
  } catch (error) {
    console.error(error);
    alert('거래처 상세 데이터를 불러오는 데 실패했습니다.');
  }
}


function openModal(data = null) {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modalTitle');
  const saveBtn = document.querySelector('#modalForm button[name="save"]');
  const editBtn = document.querySelector('#modalForm button[name="edit"]');

  if (data) {
    // 수정 모드
    title.textContent = '거래처 정보 수정';
    saveBtn.style.display = 'none';
    editBtn.style.display = 'block';

    // input 요소에 데이터 주입
    const inputs = document.querySelectorAll('#modalForm input');
    const values = [
      data.custNm, data.presidentNm, data.bizNo,
      data.bizTel, data.custEmail, data.bizFax,
      data.bizCond, data.bizItem, data.compEmpNm, data.bizAddr
    ];

    inputs.forEach((input, i) => {
      input.value = values[i] || '';
    });

  } else {
    // 신규 등록 모드
    title.textContent = '신규 거래처 등록';
    saveBtn.style.display = 'block';
    editBtn.style.display = 'none';

    // input 초기화
    document.querySelectorAll('#modalForm input').forEach(input => {
      input.value = '';
    });
  }

  modal.style.display = 'flex';
}
