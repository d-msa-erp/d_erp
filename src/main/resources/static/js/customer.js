// customer.js

window.currentBizFlag = '02'; // 기본 탭 설정 ('02': 거래처)
let currentTh = 'custIdx';    // 기본 정렬 컬럼
let currentOrder = 'desc';  // 기본 정렬 순서 (내림차순)
window.currentCustIdx = null; // 수정을 위한 현재 고객 ID 저장용

// 고객 목록을 가져오는 함수 (AJAX 통신)
async function loadCustomers(bizFlag, sortBy = currentTh, sortDirection = currentOrder, keyword = '') {
    const customerTableBody = document.getElementById('customerTableBody');
    if (!customerTableBody) {
        console.warn("ID가 'customerTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }
    currentTh = sortBy;
    currentOrder = sortDirection;

    const apiUrl = `/api/customer/${bizFlag}?sortBy=${sortBy}&sortDirection=${sortDirection}&keyword=${encodeURIComponent(keyword)}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP 오류! 상태: ${response.status}`);
        }
        const customers = await response.json();
        renderCustomers(customers);
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        renderErrorMessage('데이터 로딩 중 오류가 발생했습니다.', 'customerTableBody', 5);
    }
}

// 테이블에 고객 데이터를 렌더링하는 함수
function renderCustomers(customers) {
    const customerTableBody = document.getElementById('customerTableBody');
    customerTableBody.innerHTML = '';

    if (customers && customers.length > 0) {
        customers.forEach(cust => {
            const row = document.createElement('tr');
            row.dataset.id = cust.custIdx;
            row.onclick = () => openCustomerDetail(cust.custIdx);

            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('customer-checkbox');
            checkbox.dataset.custId = cust.custIdx;
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            checkbox.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            checkbox.addEventListener('change', () => {
                const checkboxes = document.querySelectorAll('#customerTableBody input[type="checkbox"].customer-checkbox');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                const selectAllMainCheckbox = document.getElementById('selectAllCheckbox'); // 메인 테이블의 전체선택 체크박스 ID
                if (selectAllMainCheckbox) selectAllMainCheckbox.checked = allChecked;
            });

            ['custNm', 'compEmpNm', 'bizTel', 'custEmail'].forEach(key => {
                const cell = document.createElement('td');
                cell.textContent = cust[key] || '';
                row.appendChild(cell);
            });
            customerTableBody.appendChild(row);
        });
    } else {
        renderNoDataMessage('등록된 거래처가 없습니다.', 'customerTableBody', 5);
    }
}

// "데이터 없음" 메시지를 지정된 테이블 본문에 표시하는 함수
function renderNoDataMessage(message, tableBodyId, colspan) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const noDataRow = document.createElement('tr');
    const noDataCell = document.createElement('td');
    noDataCell.className = 'nodata';
    noDataCell.colSpan = colspan;
    noDataCell.textContent = message;
    noDataCell.style.gridColumn = `span ${colspan}`;
    noDataCell.style.textAlign = 'center';
    noDataRow.appendChild(noDataCell);
    tableBody.appendChild(noDataRow);
}

// 오류 메시지를 지정된 테이블 본문에 표시하는 함수
function renderErrorMessage(message, tableBodyId, colspan) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const errorRow = document.createElement('tr');
    const errorCell = document.createElement('td');
    errorCell.colSpan = colspan;
    errorCell.textContent = message || '데이터 처리 중 오류가 발생했습니다.';
    errorCell.style.color = 'red';
    errorCell.style.gridColumn = `span ${colspan}`;
    errorCell.style.textAlign = 'center';
    errorRow.appendChild(errorCell);
    tableBody.appendChild(errorRow);
}


function updateTableHeader(bizFlag) {
  const nameHeader = document.querySelector('#customerNameHeader'); // 메인 고객 테이블의 헤더 ID
  if (nameHeader) {
    const arrowElement = nameHeader.querySelector('a');
    const arrowContent = arrowElement ? arrowElement.outerHTML : '<a>↓</a>';
    nameHeader.innerHTML = (bizFlag === '01' ? '발주처명' : '거래처명') + arrowContent;
  }
}

function switchTab(el, type) {
  document.querySelectorAll('.table-wrapper > div:nth-child(2) > span.tab').forEach(span => {
    span.classList.remove('active');
  });
  el.classList.add('active');
  window.currentBizFlag = type;
  updateTableHeader(type);
  loadCustomers(type, 'custIdx', 'desc', '');
}

// === 품목 정보를 extraTab에 로드하는 함수 ===
async function loadItemsForExtraTab(custIdx) {
    const itemTableBody = document.getElementById('itemTableBody');
    if (!itemTableBody) {
        console.warn("ID가 'itemTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }
    itemTableBody.innerHTML = ''; // 이전 아이템 목록 지우기
    try {
        const response = await fetch(`/api/items/active-for-selection?custIdx=${custIdx}`);
        if (!response.ok) {
            throw new Error(`HTTP 오류! 상태: ${response.status}`);
        }
        const items = await response.json();

        if (items && items.length > 0) {
            items.forEach(item => {
                const row = document.createElement('tr');

                // 품목명 셀
                const nameCell = document.createElement('td');
                nameCell.textContent = item.itemNm || '';
                row.appendChild(nameCell);

                // 품목코드 셀
                const codeCell = document.createElement('td');
                codeCell.textContent = item.itemCd || '';
                row.appendChild(codeCell);

                itemTableBody.appendChild(row);
            });
        } else {
            // 컬럼이 2개(품목명, 품목코드)이므로 colspan을 2로 설정
            renderNoDataMessage('등록된 품목이 없습니다.', 'itemTableBody', 2);
        }
    } catch (error) {
        console.error('품목 데이터 로딩 실패:', error);
        // 컬럼이 2개(품목명, 품목코드)이므로 colspan을 2로 설정
        renderErrorMessage('품목 정보를 불러오는 중 오류가 발생했습니다.', 'itemTableBody', 2);
    }
}

// 상세 정보 모달 내 탭 변경 시 호출되는 함수
function switchModalTab(tabId) {
    const modalDetailContent = document.querySelector('#modal-detail .modal-content');
    if (!modalDetailContent) return;

    const tabButtons = modalDetailContent.querySelectorAll('.modal-tabs .tab-button');
    const tabContents = modalDetailContent.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    const buttonToActivate = modalDetailContent.querySelector(`.modal-tabs .tab-button[onclick="switchModalTab('${tabId}')"]`);
    const contentToActivate = modalDetailContent.querySelector(`.tab-content#${tabId}`);

    if (buttonToActivate) buttonToActivate.classList.add('active');
    if (contentToActivate) contentToActivate.classList.add('active');

    const modalDetailForm = document.querySelector('#modal-detail #modalForm');
    if (modalDetailForm) {
        const editButton = modalDetailForm.querySelector('button[name="edit"]');
        const saveButton = modalDetailForm.querySelector('button[name="save"]');

        if (editButton) {
            if (tabId === 'extraTab') {
                editButton.style.display = 'none'; // extraTab에서는 수정 버튼 숨김
                // extraTab이 활성화될 때 품목 정보 로드
                if (contentToActivate && contentToActivate.id === 'extraTab') {
                    loadItemsForExtraTab(window.currentCustIdx);
                }
            } else { // infoTab 등 다른 탭
                if (saveButton && saveButton.style.display === 'none') { // 수정 모드일 때만
                    editButton.style.display = 'block';
                } else {
                    editButton.style.display = 'none';
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this, this.dataset.bizflag);
        });
    });

    const modalNewForm = document.querySelector('#modal-new #modalForm');
    if (modalNewForm) {
        const saveNewBtn = modalNewForm.querySelector('button[name="save"]');
        if (saveNewBtn) {
            saveNewBtn.addEventListener('click', saveCustomer);
        }
    }

    const modalDetailForm = document.querySelector('#modal-detail #modalForm');
    if (modalDetailForm) {
        modalDetailForm.addEventListener('submit', function(event) {
            event.preventDefault();
            editCustomer();
        });
    }

    const emailInput = document.getElementById('eMail');
    const phoneInput = document.getElementById('phoneNumber');
    const bizNoInput = document.getElementById('bizNumber');
    const compNoInput = document.getElementById('compNumber');

    if(emailInput) emailInput.addEventListener('blur', () => validateInput(emailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, '유효한 이메일을 입력해주세요.'));
    if(phoneInput) {
        phoneInput.addEventListener('input', () => phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 11));
        phoneInput.addEventListener('blur', () => validateInput(phoneInput, /^\d{9,11}$/, '연락처는 9~11자리 숫자로 입력해주세요.'));
    }
    if(bizNoInput) {
        bizNoInput.addEventListener('input', () => bizNoInput.value = bizNoInput.value.replace(/\D/g, '').slice(0, 10));
        bizNoInput.addEventListener('blur', () => validateInput(bizNoInput, /^\d{10}$/, '사업자번호는 10자리 숫자로 입력해주세요.'));
    }
    if(compNoInput) {
        compNoInput.addEventListener('input', () => compNoInput.value = compNoInput.value.replace(/\D/g, '').slice(0, 13));
        compNoInput.addEventListener('blur', () => {
            if (compNoInput.value.trim()) {
                validateInput(compNoInput, /^(\d{10}|\d{13})$/, '사업장번호는 10자리 또는 13자리 숫자로 입력해주세요.');
            } else {
                compNoInput.style.borderColor = ''; compNoInput.classList.remove('error');
            }
        });
    }
    
    const initialActiveTab = document.querySelector('.tab.active');
    if (initialActiveTab) {
        window.currentBizFlag = initialActiveTab.dataset.bizflag;
        updateTableHeader(window.currentBizFlag);
        loadCustomers(window.currentBizFlag, currentTh, currentOrder, '');
    } else { 
        const firstTab = document.querySelector('.tab');
        if (firstTab) {
            firstTab.classList.add('active');
            window.currentBizFlag = firstTab.dataset.bizflag;
            updateTableHeader(window.currentBizFlag);
            loadCustomers(window.currentBizFlag, currentTh, currentOrder, '');
        } else { 
             updateTableHeader('02'); 
             loadCustomers('02');
        }
    }
    
    const searchBtn = document.getElementById('searchBtn');
    if(searchBtn) searchBtn.addEventListener('click', () => {
        const keyword = document.getElementById('searchInput').value.trim();
		if(!keyword){
			alert("검색어를 입력해주세요.");
			return;
		}
        loadCustomers(window.currentBizFlag, 'custIdx', 'desc', keyword);
    });
        
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if(deleteBtn) deleteBtn.addEventListener('click', deleteSelectedCustomers);
    
    const selectAllMainCb = document.getElementById('selectAllCheckbox'); // 메인 테이블의 전체 선택 체크박스 ID
    if(selectAllMainCb) selectAllMainCb.addEventListener('change', function() {
        document.querySelectorAll('#customerTableBody .customer-checkbox').forEach(cb => {
            cb.checked = this.checked;
        });
    });
});

function validateInput(inputElement, regex, errorMessage, required = false) {
    const value = inputElement.value.trim();
    if ((required && !value) || (value && !regex.test(value))) {
        inputElement.style.borderColor = 'red';
        inputElement.classList.add('error');
        return false;
    } else {
        inputElement.style.borderColor = '';
        inputElement.classList.remove('error');
        return true;
    }
}

async function openCustomerDetail(custIdx) {
  try {
    const response = await fetch(`/api/customer/detail/${custIdx}`);
    if (!response.ok) throw new Error(`데이터 로딩 실패 (status: ${response.status})`);
    const data = await response.json();
    openModal(data, window.currentBizFlag); 
  } catch (error) {
    console.error('상세 데이터 로딩 실패:', error);
    alert('상세 데이터를 불러오는 데 실패했습니다.');
  }
}

function openModal(data = null, bizFlag) {
  let modalToDisplay;
  let formInModal;

  document.querySelectorAll('#modal-new input, #modal-detail input').forEach(input => {
    input.style.borderColor = ''; input.classList.remove('error');
  });

  if (data) {
    modalToDisplay = document.getElementById('modal-detail');
    if (!modalToDisplay) { console.error("modal-detail 요소를 찾을 수 없습니다."); return; }
    formInModal = modalToDisplay.querySelector('form#modalForm');
	
    const titleEl = modalToDisplay.querySelector('h3'); 
    if (titleEl) titleEl.textContent = (bizFlag === '01' ? '발주처 정보 수정' : '거래처 정보 수정');
	
    if (formInModal) {
        formInModal.querySelector('button[name="save"]').style.display = 'none';
        formInModal.querySelector('button[name="edit"]').style.display = 'block';

        formInModal.querySelector('input[name="custNm"]').value = data.custNm || '';
        formInModal.querySelector('input[name="presidentNm"]').value = data.presidentNm || '';
        formInModal.querySelector('input[name="bizNo"]').value = data.bizNo || '';
        formInModal.querySelector('input[name="bizTel"]').value = data.bizTel || '';
        formInModal.querySelector('input[name="custEmail"]').value = data.custEmail || '';
        formInModal.querySelector('input[name="bizFax"]').value = data.bizFax || '';
        formInModal.querySelector('input[name="bizCond"]').value = data.bizCond || '';
        formInModal.querySelector('input[name="bizItem"]').value = data.bizItem || '';
        formInModal.querySelector('input[name="compEmpNm"]').value = data.compEmpNm || '';
        formInModal.querySelector('input[name="compNo"]').value = data.compNo || '';
        formInModal.querySelector('input[name="bizAddr"]').value = data.bizAddr || '';
    }
    window.currentCustIdx = data.custIdx;
    
    if (typeof switchModalTab === "function") {
        switchModalTab('infoTab'); 
    } else {
        console.warn("switchModalTab 함수를 찾을 수 없습니다.");
    }

  } else { 
    modalToDisplay = document.getElementById('modal-new');
    if (!modalToDisplay) { console.error("modal-new 요소를 찾을 수 없습니다."); return; }
    formInModal = modalToDisplay.querySelector('form#modalForm');

    const titleEl = modalToDisplay.querySelector('#modalTitle');
    if (titleEl) titleEl.textContent = (bizFlag === '01' ? '발주처 신규 등록' : '거래처 신규 등록');
    
    if (formInModal) {
        formInModal.querySelector('button[name="save"]').style.display = 'block';
        formInModal.querySelector('button[name="edit"]').style.display = 'none';
        formInModal.reset(); 
    }
    window.currentCustIdx = null;
  }

  if (modalToDisplay) modalToDisplay.style.display = 'flex';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
   
    const form = modal.querySelector('form');
    if (form) form.reset();
    
    modal.querySelectorAll('input').forEach(input => {
        input.style.borderColor = ''; input.classList.remove('error');
    });
  }
}

async function editCustomer() {
  const form = document.querySelector('#modal-detail #modalForm');
  if (!form) return;

  let isValid = true;
  
  isValid &= validateInput(form.querySelector('input[name="custNm"]'), /.+/, '거래처명은 필수입니다.', true);
  isValid &= validateInput(form.querySelector('input[name="bizNo"]'), /^\d{10}$/, '사업자번호는 10자리 숫자입니다.', true);
  isValid &= validateInput(form.querySelector('input[name="bizTel"]'), /^\d{9,11}$/, '연락처는 9-11자리 숫자입니다.', true);
  
  const emailField = form.querySelector('input[name="custEmail"]');
  if (emailField.value.trim()) {
      isValid &= validateInput(emailField, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, '유효한 이메일 주소를 입력해주세요.');
  }

  const compNoField = form.querySelector('input[name="compNo"]');
  if (compNoField.value.trim()) {
      isValid &= validateInput(compNoField, /^(\d{10}|\d{13})$/, '법인번호/사업장번호는 10자리 또는 13자리 숫자입니다.');
  }

  ['bizNo', 'bizTel', 'compNo'].forEach(name => {
      const input = form.querySelector(`input[name="${name}"]`);
      if (input) input.value = input.value.replace(/\D/g, '');
  });

  if (!isValid) {
    alert('입력 값을 다시 확인해주세요.');
    return;
  }
  
  const formData = new FormData(form);
  const updatedCustomer = { custIdx: window.currentCustIdx, bizFlag: window.currentBizFlag };
  for (let [key, value] of formData.entries()) {
    updatedCustomer[key] = value.trim();
  }

  try {
    const response = await fetch(`/api/customer/update/${window.currentCustIdx}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCustomer)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`수정 실패 (status: ${response.status}): ${errorText}`);
    }
    alert('수정이 완료되었습니다!');
    closeModal('modal-detail');
    loadCustomers(window.currentBizFlag, currentTh, currentOrder);
  } catch (error) {
    console.error('수정 오류:', error);
    alert(`수정 중 오류가 발생했습니다: ${error.message}`);
  }
}

async function saveCustomer() {
  const form = document.querySelector('#modal-new #modalForm');
  if (!form) return;

  let isValid = true;
  isValid &= validateInput(form.querySelector('input[name="custNm"]'), /.+/, '회사명은 필수입니다.', true);
  isValid &= validateInput(form.querySelector('input[name="presidentNm"]'), /.+/, '대표자명은 필수입니다.', true);
  isValid &= validateInput(form.querySelector('#bizNumber'), /^\d{10}$/, '사업자번호는 10자리 숫자입니다.', true);
  isValid &= validateInput(form.querySelector('#phoneNumber'), /^\d{9,11}$/, '연락처는 9-11자리 숫자입니다.', true);
  
  const emailField = form.querySelector('#eMail');
  if (emailField.value.trim()) {
    isValid &= validateInput(emailField, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, '유효한 이메일 주소를 입력해주세요.');
  }

  const compNoField = form.querySelector('#compNumber');
  if (compNoField.value.trim()) {
    isValid &= validateInput(compNoField, /^(\d{10}|\d{13})$/, '사업장번호는 10 또는 13자리 숫자입니다.');
  }
  
  ['bizNumber', 'phoneNumber', 'compNumber'].forEach(id => {
      const input = form.querySelector(`#${id}`);
      if (input) input.value = input.value.replace(/\D/g, '');
  });

  if (!isValid) {
    alert('입력 값을 다시 확인해주세요.');
    return;
  }

  const formData = new FormData(form);
  const newCustomer = { bizFlag: window.currentBizFlag };
  for (let [key, value] of formData.entries()) {
    newCustomer[key] = value.trim();
  }

  try {
    const response = await fetch('/api/customer/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`등록 실패 (status: ${response.status}): ${errorText}`);
    }
    alert('등록이 완료되었습니다!');
    closeModal('modal-new');
    loadCustomers(window.currentBizFlag, currentTh, currentOrder);
  } catch (error) {
    console.error('등록 오류:', error);
    alert(`등록 중 오류가 발생했습니다: ${error.message}`);
  }
}

function deleteSelectedCustomers() {
    const checkboxes = document.querySelectorAll('#customerTableBody input[type="checkbox"].customer-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('삭제할 항목을 선택해주세요.');
        return;
    }
    if (!confirm(`선택된 ${checkboxes.length}개의 항목을 정말 삭제하시겠습니까?\n삭제된 데이터는 복구가 불가능합니다.`)) return;

    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.custId);

    fetch('/api/customer/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedIds)
    })
    .then(async response => {
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `삭제 실패 (status: ${response.status})`);
      }
      if (response.status === 204) return null; 
      return response.json();
    })
    .then(() => {
      alert('선택된 항목이 삭제되었습니다.');
      loadCustomers(window.currentBizFlag, currentTh, currentOrder);
      const selectAllMainCb = document.getElementById('selectAllCheckbox');
      if(selectAllMainCb) selectAllMainCb.checked = false;
    })
    .catch(err => {
      console.error('삭제 처리 중 오류:', err);
      alert(err.message || '삭제 처리 중 오류가 발생했습니다.');
    });
}

function order(thElement) {
    const allArrows = document.querySelectorAll("th a");
    allArrows.forEach(a => {
        if (a.closest('th') !== thElement) {
            a.textContent = '↓';
        }
    });

    const key = thElement.dataset.key;
    if (currentTh === key) {
        currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentTh = key;
        currentOrder = 'asc'; 
    }

    const arrow = thElement.querySelector('a');
    arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
    
    loadCustomers(window.currentBizFlag, currentTh, currentOrder);
}