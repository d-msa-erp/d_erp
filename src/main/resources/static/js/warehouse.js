// warehouse.js

// 전역 변수 (필요한 경우)
let currentSortBy = 'whIdx';
let currentOrder = 'asc';
let currentKeyword = '';
let currentWhIdxForModal = null; // 현재 모달에서 열린 창고의 ID

// 테이블 데이터 로드 함수
async function loadWarehousesTable(sortBy = currentSortBy, sortDirection = currentOrder, keyword = currentKeyword) {
    currentSortBy = sortBy;
    currentOrder = sortDirection;
    currentKeyword = keyword;

    const tableBody = document.getElementById('warehouseTableBody');
    tableBody.innerHTML = ''; // 기존 데이터 초기화

    try {
        const response = await fetch(`/api/warehouses?sortBy=${sortBy}&sortDirection=${sortDirection}&keyword=${keyword}`);
        if (!response.ok) {
            // HTTP 상태 코드가 200이 아닌 경우
            const errorText = await response.text();
            console.error(`Error fetching warehouses list: HTTP status ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
        }
        const warehouses = await response.json();

        if (warehouses.length === 0) {
            tableBody.innerHTML = '<tr><td class="nodata" style="grid-column: span 8; justify-content: center;">등록된 데이터가 없습니다.</td></tr>';
            return;
        }

        warehouses.forEach(warehouse => {
            const row = document.createElement('tr');
            row.dataset.whIdx = warehouse.whIdx; // 데이터 속성으로 whIdx 저장

            row.innerHTML = `
                <td><input type="checkbox" class="warehouse-checkbox" data-wh-idx="${warehouse.whIdx}" /></td>
                <td>${warehouse.whCd || ''}</td>
                <td>${warehouse.whNm || ''}</td>
                <td>${(warehouse.whType1 === 'Y' ? '자재 ' : '') + (warehouse.whType2 === 'Y' ? '제품 ' : '') + (warehouse.whType3 === 'Y' ? '반품 ' : '').trim() || ''}</td>
                <td>${warehouse.useFlag === 'Y' ? '사용' : '미사용'}</td>
                <td>${warehouse.whLocation || ''}</td>
                <td>${warehouse.remark || ''}</td>
                <td>${warehouse.whUserNm || '미지정'}</td> `;
            // 행 전체 클릭 시 모달 열기 (체크박스 클릭 제외)
            row.addEventListener('click', (event) => {
                if (event.target.type === 'checkbox' || event.target.tagName === 'A') {
                    return;
                }
                openModal('view', warehouse.whIdx); // 'view' 모드로 변경
            });
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading warehouses:', error);
        tableBody.innerHTML = '<tr><td class="nodata" style="grid-column: span 8; justify-content: center; color: red;">데이터 로드 실패</td></tr>';
    }
}

// 담당자 목록을 `<select>` 태그에 채우는 함수
async function loadManagersIntoSelect(selectElementId, selectedUserIdx = null) {
    const selectBox = document.getElementById(selectElementId);
    selectBox.innerHTML = '';

    selectBox.appendChild(createOption('', '담당자를 선택해주세요', true, true));

    try {
        const response = await fetch('/api/warehouses/users/active-for-selection'); // API 경로 수정
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching managers list: HTTP status ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
        }
        const managers = await response.json();

        managers.forEach(user => {
            const option = createOption(user.userIdx, `${user.userNm} (${user.userId})`);
            if (selectedUserIdx !== null && String(user.userIdx) === String(selectedUserIdx)) {
                option.selected = true;
            }
            selectBox.appendChild(option);
        });
    } catch (error) {
        console.error("담당자 목록 로드 실패:", error);
        // alert("담당자 목록을 불러오는 데 실패했습니다."); // 알림은 개발자 도구에서 확인하도록
    }
}

// option 엘리먼트 생성 헬퍼 함수
function createOption(value, text, disabled = false, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    option.disabled = disabled;
    if (selected) {
        option.selected = true;
    }
    return option;
}


// 정렬 함수
function order(thElement) {
    const newSortBy = thElement.dataset.sortBy;

    if (!newSortBy) {
        console.warn("data-sort-by 속성이 정의되지 않았거나 비어있습니다. 정렬 불가.", thElement);
        return;
    }

    if (currentSortBy === newSortBy) {
        currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentOrder = 'asc';
        currentSortBy = newSortBy;
    }

    document.querySelectorAll('th a').forEach(a => {
        a.textContent = '↓';
    });

    const currentThAnchor = thElement.querySelector('a');
    if (currentThAnchor) {
        currentThAnchor.textContent = currentOrder === 'asc' ? '↑' : '↓';
    }

    loadWarehousesTable(currentSortBy, currentOrder, currentKeyword);
}

// 탭 전환 함수
function openTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(`${tabName}Tab`).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');

    // '정보 수정' 탭으로 가면 저장/수정 버튼 보이게
    const saveButton = document.querySelector('#modalForm button[name="save"]');
    const editButton = document.querySelector('#modalForm button[name="edit"]');
    const whCdInput = document.querySelector('#modalForm input[name="whCd"]');


    if (tabName === 'info') {
        if (currentWhIdxForModal === null) { // 신규 등록 모드
            saveButton.style.display = 'block';
            editButton.style.display = 'none';
            whCdInput.value = '자동 생성';
            whCdInput.readOnly = true;
        } else { // 수정 모드
            saveButton.style.display = 'none';
            editButton.style.display = 'block';
            whCdInput.readOnly = true; // 수정 모드에서는 코드 변경 불가
        }
    } else { // 재고 현황 탭으로 돌아오면 저장/수정 버튼 숨김
        saveButton.style.display = 'none';
        editButton.style.display = 'none';
    }
}


// 모달 닫기 함수
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modalForm').reset();
    currentWhIdxForModal = null; // 모달 닫을 때 현재 창고 ID 초기화

    // 모달 닫을 때 whCd input의 readonly 속성 해제 (신규 등록 시 다시 입력 가능하도록)
    const whCdInput = document.querySelector('#modalForm input[name="whCd"]');
    if (whCdInput) whCdInput.readOnly = false;

    // ⭐ 추가: 모달 닫을 때 모든 탭의 active 클래스 제거 ⭐
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // ⭐ 재고 탭 관련 UI 초기화 ⭐
    displayNoStockMessage(); // 재고 테이블 초기화 및 메시지 표시
    document.getElementById('selectAllStockCheckboxes').checked = false; // 재고 전체 선택 체크박스 초기화
}

function outsideClick(event) {
    if (event.target.id === 'modal') {
        closeModal();
    }
}

// 하나의 함수로 신규 등록 및 수정/조회 모달 열기 처리
async function openModal(mode, whIdx = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const saveButton = modalForm.querySelector('button[name="save"]');
    const editButton = modalForm.querySelector('button[name="edit"]');

    const warehouseInfoDiv = document.getElementById('warehouseInfo');
    const warehouseStockTableBody = document.getElementById('warehouseStockTableBody'); // 재고 테이블 바디
    const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
    const moveStockButton = document.getElementById('moveStockButton');
    const deleteStockButton = document.getElementById('deleteStockButton');


    modalForm.reset();
    currentWhIdxForModal = whIdx; // 모달이 열리는 창고의 ID 저장

    const whIdxInput = modalForm.querySelector('input[name="whIdx"]');
    if (whIdxInput) whIdxInput.value = '';

    const whNmInput = modalForm.querySelector('input[name="whNm"]');
    const whCdInput = modalForm.querySelector('input[name="whCd"]');
    const remarkInput = modalForm.querySelector('input[name="remark"]');
    const whType1Checkbox = modalForm.querySelector('input[name="whType1"]');
    const whType2Checkbox = modalForm.querySelector('input[name="whType2"]');
    const whType3Checkbox = modalForm.querySelector('input[name="whType3"]');
    const useFlagCheckbox = modalForm.querySelector('input[name="useFlag"]');
    const whLocationInput = modalForm.querySelector('input[name="whLocation"]');
    const whUserIdxSelect = document.getElementById('modalWhUserIdx');

    // 탭 관련 UI 요소
    const tabsContainer = document.querySelector('.modal-tabs');
    const stockTabContent = document.getElementById('stockTab');
    const infoTabContent = document.getElementById('infoTab');

    // ⭐⭐⭐ 중요: 모달이 열릴 때 모든 탭의 active 클래스를 초기화하고 기본 탭을 활성화합니다. ⭐⭐⭐
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // --- 모달 모드에 따른 UI 조정 ---
    if (mode === 'new') {
        modalTitle.textContent = '신규 창고 등록';
        tabsContainer.style.display = 'none'; // 신규 등록 시 탭 숨김

        // 신규 등록 시 '정보 수정' 탭만 활성화
        infoTabContent.classList.add('active');
        // 해당 탭 버튼도 활성화 (숨겨져 있어도 상태는 정확하게)
        document.querySelector('.tab-button[data-tab="info"]').classList.add('active');


        saveButton.style.display = 'block';
        editButton.style.display = 'none';

        if (whCdInput) {
            whCdInput.value = '자동 생성';
            whCdInput.readOnly = true;
        }
        if (useFlagCheckbox) useFlagCheckbox.checked = true;

        await loadManagersIntoSelect('modalWhUserIdx');
        displayNoStockMessage(); // 신규 등록 시 재고 테이블 초기화

    } else if (mode === 'view' && whIdx !== null) { // 상세 조회 및 수정 모드
        modalTitle.textContent = '창고 상세 정보';
        tabsContainer.style.display = 'flex'; // 탭 보이기

        // ⭐ 상세 조회 시 무조건 '재고 현황' 탭을 활성화 ⭐
        stockTabContent.classList.add('active');
        document.querySelector('.tab-button[data-tab="stock"]').classList.add('active');

        saveButton.style.display = 'none'; // 조회 모드에서는 저장/수정 버튼 숨김
        editButton.style.display = 'none';

        if (whCdInput) whCdInput.readOnly = true;

        try {
            const warehouseResponse = await fetch(`/api/warehouses/${whIdx}`);
            if (!warehouseResponse.ok) {
                const errorText = await warehouseResponse.text();
                console.error(`Error fetching warehouse details: HTTP status ${warehouseResponse.status}`, errorText);
                throw new Error(`HTTP error! status: ${warehouseResponse.status}, Message: ${errorText}`);
            }
            const warehouse = await warehouseResponse.json();

            if (whIdxInput) whIdxInput.value = warehouse.whIdx || '';
            if (whNmInput) whNmInput.value = warehouse.whNm || '';
            if (whCdInput) whCdInput.value = warehouse.whCd || '';
            if (remarkInput) remarkInput.value = warehouse.remark || '';
            if (whType1Checkbox) whType1Checkbox.checked = (warehouse.whType1 === 'Y');
            if (whType2Checkbox) whType2Checkbox.checked = (warehouse.whType2 === 'Y');
            if (whType3Checkbox) whType3Checkbox.checked = (warehouse.whType3 === 'Y');
            if (useFlagCheckbox) useFlagCheckbox.checked = (warehouse.useFlag === 'Y');
            if (whLocationInput) whLocationInput.value = warehouse.whLocation || '';

            await loadManagersIntoSelect('modalWhUserIdx', warehouse.whUserIdx);

            // ⭐ 재고 데이터 로드 (수정된 API 경로 사용) ⭐
            await loadWarehouseStockDetails(whIdx); // 새로운 함수 호출
            
        } catch (error) {
            console.error('창고 상세 정보를 불러오는 중 오류 발생:', error);
            alert('창고 정보를 불러오는데 실패했습니다.');
            closeModal();
            return;
        }
    } else {
        console.error("openModal 함수 호출 오류: 유효하지 않은 모드 또는 whIdx가 누락되었습니다.", mode, whIdx);
        alert('모달을 여는 중 오류가 발생했습니다.');
        return;
    }
    modal.style.display = 'flex'; // 모달 표시
}


// 검색 폼 제출 처리 함수
function handleSearchSubmit(event) {
    event.preventDefault();
    const keyword = document.getElementById('searchInput').value;
    loadWarehousesTable(currentSortBy, currentOrder, keyword);
}

// ⭐ 재고 데이터 로드 및 렌더링 함수 (추가 또는 수정) ⭐
async function loadWarehouseStockDetails(whIdx) {
    const warehouseStockTableBody = document.getElementById('warehouseStockTableBody');
    const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
    const moveStockButton = document.getElementById('moveStockButton');
    const deleteStockButton = document.getElementById('deleteStockButton');

    warehouseStockTableBody.innerHTML = ''; // 기존 내용 삭제

    try {
        // ⭐ 이전에 제안했던 API 경로를 사용합니다. ⭐
        const response = await fetch(`/api/warehouses/${whIdx}/inventory-details`);
        if (!response.ok) {
            // HTTP 상태 코드가 200이 아닌 경우
            if (response.status === 204) { // 204 No Content (데이터는 없지만 성공)
                console.warn(`창고 ID ${whIdx}에 대한 재고 정보가 없습니다 (204 No Content).`);
                displayNoStockMessage();
                return;
            }
            const errorText = await response.text();
            console.error(`Error fetching warehouse stock details: HTTP status ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
        }
        const stockDetails = await response.json();

        if (stockDetails && stockDetails.length > 0) {
            stockDetails.forEach(stock => {
                const row = document.createElement('tr');
                // invIdx를 data 속성으로 저장하여 나중에 삭제/이동 시 사용
                row.dataset.invIdx = stock.invIdx;
                row.dataset.itemIdx = stock.itemIdx;
                row.innerHTML = `
                    <td><input type="checkbox" class="stock-checkbox" data-inv-idx="${stock.invIdx}" data-item-idx="${stock.itemIdx}" /></td>
                    <td>${stock.itemNm || 'N/A'}</td>
                    <td>${stock.itemCd || 'N/A'}</td>
                    <td>${stock.itemSpec || 'N/A'}</td> <td>${stock.stockQty !== null ? stock.stockQty : '0'}</td> <td>${stock.itemUnitNm || 'N/A'}</td> <td>${stock.itemCustNm || 'N/A'}</td> <td>${stock.itemRemark || 'N/A'}</td> `;
                warehouseStockTableBody.appendChild(row);
            });
            // 재고 데이터가 있으면 '전체 선택' 체크박스 및 버튼 활성화
            selectAllStockCheckboxes.disabled = false;
            moveStockButton.disabled = false;
            deleteStockButton.disabled = false;
        } else {
            displayNoStockMessage(); // 재고가 없는 경우 메시지 표시 및 비활성화
        }

    } catch (error) {
        console.error('창고 재고 정보를 불러오는 중 오류 발생:', error);
        displayNoStockMessage(true); // 에러 발생 시 메시지 표시 및 비활성화
    }
}

// 재고 없음 메시지 표시 및 버튼 비활성화 함수
function displayNoStockMessage(isError = false) {
    const warehouseStockTableBody = document.getElementById('warehouseStockTableBody');
    const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
    const moveStockButton = document.getElementById('moveStockButton');
    const deleteStockButton = document.getElementById('deleteStockButton');

    const message = isError ? '재고 데이터 로드 실패' : '재고 데이터 없음';
    const color = isError ? 'red' : 'inherit';
    const colspan = 8; // HTML 테이블 헤더 컬럼 수에 맞게 조정

    warehouseStockTableBody.innerHTML = `
        <tr>
            <td colspan="${colspan}" style="text-align: center; color: ${color};">${message}</td>
        </tr>
    `;
    selectAllStockCheckboxes.disabled = true;
    selectAllStockCheckboxes.checked = false; // 체크 해제
    moveStockButton.disabled = true;
    deleteStockButton.disabled = true;
}


// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    loadWarehousesTable();

    // 탭 버튼 클릭 이벤트 리스너
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const tabName = event.target.dataset.tab;
            openTab(tabName);
        });
    });


    // 신규등록 버튼
    document.getElementById('newRegistrationButton').addEventListener('click', () => {
        openModal('new');
    });

    // 폼 제출 처리 (등록/수정)
    document.getElementById('modalForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = {};
        formData.forEach((value, key) => {
            if (key === 'whType1' || key === 'whType2' || key === 'whType3' || key === 'useFlag') {
                data[key] = event.target.elements[key].checked ? 'Y' : 'N';
            } else {
                data[key] = value;
            }
        });

        data.whUserIdx = document.getElementById('modalWhUserIdx').value;

        if (!data.whUserIdx) {
            alert("담당자를 선택해 주세요.");
            return;
        }

        const isEditMode = data.whIdx && data.whIdx !== '';
        const url = isEditMode ? `/api/warehouses/${data.whIdx}` : '/api/warehouses';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `HTTP error! Status: ${response.status}, Message: ${errorText}`);
                } catch (e) {
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }
            }

            alert(isEditMode ? '창고 정보가 성공적으로 수정되었습니다.' : '신규 창고가 성공적으로 등록되었습니다.');
            closeModal();
            loadWarehousesTable();
        } catch (error) {
            console.error('Error saving warehouse:', error);
            alert(`창고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
        }
    });

    // 삭제 버튼
    document.getElementById('deleteButton').addEventListener('click', async () => {
        const checkedCheckboxes = document.querySelectorAll('#warehouseTableBody input[type="checkbox"]:checked');
        const whIdxesToDelete = Array.from(checkedCheckboxes).map(cb => cb.dataset.whIdx);

        if (whIdxesToDelete.length === 0) {
            alert('삭제할 창고를 선택해주세요.');
            return;
        }

        if (!confirm(`${whIdxesToDelete.length}개의 창고를 정말로 삭제하시겠습니까?`)) {
            return;
        }

        try {
            const response = await fetch('/api/warehouses', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(whIdxesToDelete)
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `HTTP error! Status: ${response.status}, Message: ${errorText}`);
                } catch (e) {
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }
            }

            alert('선택된 창고가 성공적으로 삭제되었습니다.');
            loadWarehousesTable();
        } catch (error) {
            console.error('Error deleting warehouses:', error);
            alert(`창고 삭제에 실패했습니다: ${error.message}`);
        }
    });

    // 헤더 체크박스 전체 선택/해제
    document.getElementById('selectAllCheckboxes').addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('.warehouse-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });

    // ⭐ 재고 탭의 전체 선택/해제 체크박스 기능 추가 ⭐
    document.getElementById('selectAllStockCheckboxes').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#warehouseStockTableBody .stock-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    // ⭐ 재고 탭의 개별 체크박스 상태 변경 시 전체 선택 체크박스 상태 업데이트 ⭐
    document.getElementById('warehouseStockTableBody').addEventListener('change', function(event) {
        if (event.target.classList.contains('stock-checkbox')) {
            const allCheckboxes = document.querySelectorAll('#warehouseStockTableBody .stock-checkbox');
            const checkedCheckboxes = document.querySelectorAll('#warehouseStockTableBody .stock-checkbox:checked');
            document.getElementById('selectAllStockCheckboxes').checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
        }
    });

    // ⭐ 재고이동 버튼 클릭 이벤트 (예시) ⭐
    document.getElementById('moveStockButton').addEventListener('click', function() {
        const selectedStock = Array.from(document.querySelectorAll('#warehouseStockTableBody .stock-checkbox:checked'))
                                   .map(cb => ({
                                       invIdx: cb.dataset.invIdx,
                                       itemIdx: cb.dataset.itemIdx
                                   }));
        if (selectedStock.length > 0) {
            alert('선택된 재고 이동: ' + JSON.stringify(selectedStock));
            // 여기에 재고 이동 모달을 열거나, 재고 이동 API 호출 로직 추가
            // 이동 후 loadWarehouseStockDetails(currentWhIdxForModal) 다시 호출하여 테이블 갱신
        } else {
            alert('이동할 재고를 선택해주세요.');
        }
    });

    // ⭐ 재고 삭제 버튼 클릭 이벤트 (예시) ⭐
    document.getElementById('deleteStockButton').addEventListener('click', function() {
        const selectedInvIdxes = Array.from(document.querySelectorAll('#warehouseStockTableBody .stock-checkbox:checked'))
                                     .map(cb => cb.dataset.invIdx);
        if (selectedInvIdxes.length > 0) {
            if (confirm('선택된 재고를 정말 삭제하시겠습니까?')) {
                alert('선택된 재고 삭제: ' + JSON.stringify(selectedInvIdxes));
                // 여기에 재고 삭제 API 호출 로직 추가 (예: POST /api/inventory/delete, DELETE /api/inventory/{invIdxes})
                // 삭제 후 loadWarehouseStockDetails(currentWhIdxForModal) 다시 호출하여 테이블 갱신
            }
        } else {
            alert('삭제할 재고를 선택해주세요.');
        }
    });

    // 초기 로드 시 재고 없음 메시지 및 버튼 비활성화 상태로 시작
    displayNoStockMessage();
});