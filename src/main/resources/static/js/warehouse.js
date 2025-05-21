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
        const response = await fetch('/api/users/active-for-selection');
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

    // --- 모달 모드에 따른 UI 조정 ---
    if (mode === 'new') {
        modalTitle.textContent = '신규 창고 등록';
        tabsContainer.style.display = 'none'; // 신규 등록 시 탭 숨김
        stockTabContent.style.display = 'none'; // 재고 탭 숨김
        infoTabContent.style.display = 'block'; // 정보 수정 탭만 보임
        saveButton.style.display = 'block';
        editButton.style.display = 'none';

        if (whCdInput) {
            whCdInput.value = '자동 생성';
            whCdInput.readOnly = true;
        }
        if (useFlagCheckbox) useFlagCheckbox.checked = true;

        await loadManagersIntoSelect('modalWhUserIdx');

    } else if (mode === 'view' && whIdx !== null) { // 상세 조회 및 수정 모드
        modalTitle.textContent = '창고 상세 정보';
        tabsContainer.style.display = 'flex'; // 탭 보이기
        
        // ⭐⭐⭐ 이 부분이 중요합니다. 재고 현황 탭을 명시적으로 활성화 ⭐⭐⭐
        openTab('stock'); 

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

            // ⭐ 재고 데이터 로드 (API는 예시, 실제 API로 교체 필요) ⭐
            // 백엔드에 이 API가 구현되지 않았거나 문제가 있다면 이 부분을 주석 처리하고
            // 창고 기본 정보 로드만 먼저 테스트해보세요.
            try {
                const stockResponse = await fetch(`/api/warehouses/${whIdx}/stock`);
                if (!stockResponse.ok) {
                    const errorText = await stockResponse.text();
                    console.error(`Error fetching warehouse stock: HTTP status ${stockResponse.status}`, errorText);
                    throw new Error(`HTTP error! status: ${stockResponse.status}, Message: ${errorText}`);
                }
                const stockData = await stockResponse.json();
                warehouseStockTableBody.innerHTML = ''; // 기존 재고 데이터 초기화
                if (stockData && stockData.length > 0) {
                    stockData.forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${item.itemName || ''}</td>
                            <td>${item.itemNumber || ''}</td>
                            <td>${item.quantity || 0}</td>
                        `;
                        warehouseStockTableBody.appendChild(row);
                    });
                } else {
                    warehouseStockTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">재고 데이터 없음</td></tr>';
                }
            } catch (stockError) {
                console.error('재고 데이터를 불러오는 중 오류 발생:', stockError);
                warehouseStockTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">재고 데이터 로드 실패</td></tr>';
            }


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
});