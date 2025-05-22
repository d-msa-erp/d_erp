window.currentBizFlag = '02';
let currentTh = 'custIdx';
let currentOrder = 'desc';


// 리스트를 받아오는 ajax 통신
async function loadCustomers(bizFlag, sortBy = currentTh, sortDirection = currentOrder , keyword = '') {
    const customerTableBody = document.getElementById('customerTableBody');
    if (!customerTableBody) {
        console.warn("ID가 'customerTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }

    const apiUrl = `/api/customer/${bizFlag}?sortBy=${sortBy}&sortDirection=${sortDirection}&keyword=${encodeURIComponent(keyword)}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const customers = await response.json();
        customerTableBody.innerHTML = '';

        if (customers && customers.length > 0) {
            renderCustomers(customers);
        } else {
            renderNoDataMessage();
        }
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        renderErrorMessage('데이터 로딩 중 오류가 발생했습니다.');
    }
}

// 테이블 랜더링
function renderCustomers(customers) {
    const customerTableBody = document.getElementById('customerTableBody');
    customerTableBody.innerHTML = '';

    if (customers && customers.length > 0) {
        customers.forEach(cust => {
            const row = document.createElement('tr');
            row.dataset.id = cust.custIdx;
            row.onclick = () => openCustomerDetail(cust.custIdx, window.currentBizFlag);

            // 체크박스 셀
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('customer-checkbox');
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            // 행 클릭 막기
            checkbox.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            // 체크박스 상태 변경 시 전체선택 동기화
            checkbox.addEventListener('change', () => {
                const checkboxes = document.querySelectorAll('#customerTableBody input[type="checkbox"]');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                document.getElementById('selectAllCheckbox').checked = allChecked;
            });

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
        renderNoDataMessage();
    }
}

function renderNoDataMessage() {
    const customerTableBody = document.getElementById('customerTableBody');
    customerTableBody.innerHTML = '';

    const noDataRow = document.createElement('tr');
    const noDataCell = document.createElement('td');

    noDataCell.className = 'nodata';
    noDataCell.colSpan = 5;
    noDataCell.textContent = '등록된 데이터가 없습니다.';
    noDataCell.setAttribute('style', 'grid-column: span 5; justify-content: center; text-align: center;');

    noDataRow.appendChild(noDataCell);
    customerTableBody.appendChild(noDataRow);
}


function renderErrorMessage(message) {
    const customerTableBody = document.getElementById('customerTableBody');
    customerTableBody.innerHTML = '';

    const errorRow = document.createElement('tr');
    const errorCell = document.createElement('td');

    errorCell.colSpan = 5;
    errorCell.textContent = message || '데이터 로딩 중 오류가 발생했습니다.';
    errorCell.style.color = 'red';
    errorCell.setAttribute('style', 'grid-column: span 5; justify-content: center; text-align: center;');

    errorRow.appendChild(errorCell);
    customerTableBody.appendChild(errorRow);
}



// 헤더 텍스트 변경
function updateTableHeader(bizFlag) {
  const nameHeader = document.querySelector('#customerNameHeader');
  if (nameHeader) {
    nameHeader.innerHTML = (bizFlag === '01' ? '발주처명' : '거래처명') + '<a>↓</a>';
  }
}

// 탭 변경
function switchTab(el, type) {
  // 스타일 초기화 후 활성화
  document.querySelectorAll('.table-wrapper > div:nth-child(2) > span').forEach(span => {
    span.classList.remove('active');
  });
  el.classList.add('active');
  window.currentBizFlag = type;
  
  
  // 헤더 텍스트 변경
   updateTableHeader(type);

  // 데이터 로드
  loadCustomers(type, 'custIdx', 'desc', '');
}

// 페이지 처음 로딩 시 기본 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
	// 탭 로딩
	const tabs = document.querySelectorAll('.tab');
	tabs.forEach(tab => {
	    tab.addEventListener('click', () => {
	        const biztab = tab.dataset.bizflag;
	        loadCustomers(biztab, currentTh, currentOrder, '');
	    });
	});
	
	// 정보 수정
	const editButton = document.querySelector('#modalForm button[name="edit"]');
	if (editButton) {
		editButton.addEventListener('click', editCustomer);
	}

	// 신규 등록
	const saveButton = document.querySelector('#modalForm button[name="save"]');
	if (saveButton) {
		saveButton.addEventListener('click', saveCustomer);
	}
	
	
	// 검증식
	const emailInput = document.getElementById('eMail');
	const phoneInput = document.getElementById('phoneNumber');
	const bizNoInput = document.getElementById('bizNumber');
	const compNoInput = document.getElementById('compNumber');

	emailInput.addEventListener('blur', () => {
	  const email = emailInput.value.trim();
	  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	  if (email && !emailRegex.test(email)) {
	    emailInput.style.borderColor = 'red';
	  } else {
	    emailInput.style.borderColor = '';
	  }
	});

	phoneInput.addEventListener('input', () => {
	  // 숫자만 남기고 11자리 제한
	  phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 11);

	  // 9자리 이상인지 체크
	  if (phoneInput.value.length < 9) {
	    phoneInput.style.borderColor = 'red';
	  } else {
	    phoneInput.style.borderColor = '';
	  }
	});

	bizNoInput.addEventListener('input', () => {
	  // 숫자만 남기고 10자리 제한
	  bizNoInput.value = bizNoInput.value.replace(/\D/g, '').slice(0, 10);

	  // 무조건 10자리여야 함
	  if (bizNoInput.value.length !== 10) {
	    bizNoInput.style.borderColor = 'red';
	  } else {
	    bizNoInput.style.borderColor = '';
	  }
	});
	compNoInput.addEventListener('input', () => {
		  // 숫자만 남기고 10자리 제한
		  compNoInput.value = compNoInput.value.replace(/\D/g, '').slice(0, 10);
	
	  if (compNoInput.length !== 0){
		  if (compNoInput.value.length !== 10) {
		    compNoInput.style.borderColor = 'red';
		  } else {
		    compNoInput.style.borderColor = '';
		  }		
	  }
	});
	 
	// 기본 로딩
	updateTableHeader('02');
	loadCustomers('02');
});

// 고객 클릭 시 호출하는 함수
async function openCustomerDetail(custIdx, bizFlag) {
  try {
    const response = await fetch(`/api/customer/detail/${custIdx}`);
    if (!response.ok) throw new Error('데이터 로딩 실패');

    const data = await response.json();
    openModal(data, bizFlag);  // 받은 데이터로 모달 열기
  } catch (error) {
    console.error(error);
    alert('상세 데이터를 불러오는 데 실패했습니다.');
  }
}


function openModal(data = null, bizFlag) {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modalTitle');
  const saveBtn = document.querySelector('#modalForm button[name="save"]');
  const editBtn = document.querySelector('#modalForm button[name="edit"]');

  
  
  const inputs = document.querySelectorAll('#modalForm input');
  inputs.forEach(input => {
    input.classList.remove('error');      // 만약 error 클래스로 스타일 적용했다면
    input.style.borderColor = '';         // 인라인 스타일로 했으면 초기화
  });
  
  if (data) {
    // 수정 모드
	title.textContent = (bizFlag === '01' ? '발주처 정보 수정' : '거래처 정보 수정');
    saveBtn.style.display = 'none';
    editBtn.style.display = 'block';

    // input 요소에 데이터 주입
    const inputs = document.querySelectorAll('#modalForm input');
    const values = [
      data.custNm, data.presidentNm, data.bizNo,
      data.bizTel, data.custEmail, data.bizFax, 
      data.bizCond, data.bizItem, data.compEmpNm, data.compNo, data.bizAddr
    ];

    inputs.forEach((input, i) => {
      input.value = values[i] || '';
    });
	
	window.currentCustIdx = data.custIdx;
  } else {
    // 신규 등록 모드
	title.textContent = (bizFlag === '01' ? '발주처 신규 등록' : '거래처 신규 등록');
    saveBtn.style.display = 'block';
    editBtn.style.display = 'none';

    // input 초기화
    document.querySelectorAll('#modalForm input').forEach(input => {
      input.value = '';
    });
  }

  modal.style.display = 'flex';
}

// 거래처 / 발주처 정보 수정
async function editCustomer() {
  const inputs = document.querySelectorAll('#modalForm input');
  const values = Array.from(inputs).map(input => input.value.trim()); // input들의 밸류를 한번에 받아와서 배열로 정렬

  
  const custIdx = window.currentCustIdx; 

  const updatedCustomer = {
    custIdx,
    custNm: values[0],
    presidentNm: values[1],
    bizNo: values[2],
    bizTel: values[3],
    custEmail: values[4],
    bizFax: values[5],
    bizCond: values[6],
    bizItem: values[7],
    compEmpNm: values[8],
	compNO: values[9],
    bizAddr: values[10]
  };

  try {
    const response = await fetch(`/api/customer/update/${custIdx}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedCustomer)
    });

    if (!response.ok) throw new Error('수정 실패');

    alert('수정이 완료되었습니다!');
    closeModal('modal');
    loadCustomers(updatedCustomer.bizFlag || '02');  // 다시 리스트 갱신
  } catch (error) {
    console.error(error);
    alert('수정 중 오류가 발생했습니다.');
  }
}


const emailInput = document.getElementById('eMail');

emailInput.addEventListener('blur', () => {
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    emailInput.style.borderColor = 'red';
    alert('유효한 이메일 주소를 입력해주세요.');
  } else {
    emailInput.style.borderColor = ''; // 기본으로 돌리기
  }
});

document.addEventListener('DOMContentLoaded', () => {

});

const form = document.getElementById('modalForm');

async function saveCustomer() {
	const inputs = document.querySelectorAll('#modalForm input');
	let isValid = true;


	inputs.forEach(input => {
		input.classList.remove('error'); // 초기화

		// 이메일 검사
		if (input.id === 'eMail') {
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailPattern.test(input.value.trim())) {
				input.classList.add('error');
				isValid = false;
			}
		}

		// 전화번호 숫자만 & 길이 11자리
		if (input.id === 'phoneNumber') {
			const phonePattern = /^\d{11}$/;
			if (!phonePattern.test(input.value.trim())) {
				input.classList.add('error');
				isValid = false;
			}
		}

		// 사업자번호 숫자만 & 길이 10자리
		if (input.id === 'bizNumber') {
			const bizPattern = /^\d{10}$/;
			if (!bizPattern.test(input.value.trim())) {
				input.classList.add('error');
				isValid = false;
			}
		}
		if (input.id === 'compNumber') {
			const bizPattern = /^\d{10}$/;
			if (!bizPattern.test(input.value.trim())) {
				input.classList.add('error');
				isValid = false;
			}
		}
});
  
  
  if (!isValid) {
    alert('입력 값을 다시 확인해주세요.');
    return;
  }

  // 검증 통과 시, 데이터 객체 만들기
  const values = Array.from(inputs).map(input => input.value.trim());
  const newCustomer = {
    custNm: values[0],
    presidentNm: values[1],
    bizNo: values[2],
    bizTel: values[3],
    custEmail: values[4],
    bizFax: values[5],
    bizCond: values[6],
    bizItem: values[7],
    compEmpNm: values[8],
    compNo: values[9],
    bizAddr: values[10],
	bizFlag: window.currentBizFlag
  };

  try {
    const response = await fetch('/api/customer/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCustomer)
    });

    if (!response.ok) throw new Error('등록 실패');

    alert('등록이 완료되었습니다!');
    closeModal('modal');
    loadCustomers(window.currentBizFlag);
  } catch (error) {
    console.error(error);
    alert('등록 중 오류가 발생했습니다.');
  }
}
// 전체 체크박스 컨트롤
document.getElementById('selectAllCheckbox').addEventListener('change', function () {
    const isChecked = this.checked;
    const checkboxes = document.querySelectorAll('#customerTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
    });
});

// 고객 삭제
document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#customerTableBody input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        alert('삭제할 항목을 선택해주세요.');
        return;
    }

    if (!confirm('정말 삭제하시겠습니까? \n삭제된 데이터는 복구가 불가능합니다.')) return;

    // 삭제할 고객 ID 목록 수집
    const selectedIds = Array.from(checkboxes).map(cb => {
        const row = cb.closest('tr');
        return row.dataset.id;
    });

	fetch('/api/customer/delete', {
	  method: 'DELETE',
	  headers: {
	    'Content-Type': 'application/json'
	  },
	  body: JSON.stringify(selectedIds)
	})
	.then(async response => {
	  if (!response.ok) {
	    const message = await response.text();
	    throw new Error(message);
	  }
	})
	.then(() => {
	  alert('삭제되었습니다.');
	  loadCustomers(window.currentBizFlag);
	})
	.catch(err => {
	  console.error(err);
	  alert(err.message); // 여기서 "품목들을 먼저 삭제해주세요." 같은 메시지를 띄움
	});
});
// 정렬
function order(thElement) {
    const allArrows = document.querySelectorAll("th a");
    allArrows.forEach(a => a.textContent = '↓');

    const key = thElement.dataset.key;

    if (currentTh === key) {
        currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentOrder = 'asc';
        currentTh = key;
    }

    const arrow = thElement.querySelector('a');
    arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';

    // 정렬 기준과 방향을 이용해서 데이터 다시 불러오기
    const sortBy = key;
    loadCustomers(window.currentBizFlag, sortBy, currentOrder);
}

// 검색
document.getElementById('searchBtn').addEventListener('click', () => {
    const keyword = document.getElementById('searchInput').value.trim();
    loadCustomers(window.currentBizFlag, 'custIdx', 'desc', keyword);
	console.log(currentTh);
});
