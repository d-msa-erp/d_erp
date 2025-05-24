// === 전역 변수 ===
let currentSortBy = 'invTransIdx';
let currentOrder = 'desc';
let currentPage = 1;
let totalPages = 1;
const pageSize = 10;
let currentInvTransIdxForModal = null;

let searchFilters = {
    transDateFrom: '', transDateTo: '', itemIdx: '', custIdx: '',
    userIdx: '', whIdx: '', transStatus: ''
};

let searchItemsData = [];
let searchCustsData = [];
let searchWarehousesData = [];
let searchManagersData = [];

let modalItemsData = [];
let modalCustsData = [];
let modalWarehousesData = [];
let modalManagersData = [];

// === UI 컨트롤 요소 가져오기 ===
const receivingTableBody = document.querySelector('#receivingTable tbody');
const selectAllCheckboxes = document.getElementById('selectAllCheckboxes');
const searchButton = document.getElementById('searchButton');
const resetSearchButton = document.getElementById('resetSearchButton');
const newRegistrationButton = document.getElementById('newRegistrationButton');
const deleteButton = document.getElementById('deleteButton');
const modal = document.getElementById('receivingModal');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const saveButton = modalForm.querySelector('button[name="save"]');
const editButton = modalForm.querySelector('button[name="edit"]');
const totalRecordsSpan = document.getElementById('totalRecords');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const pageNumberInput = document.getElementById('pageNumberInput');
const btnFirstPage = document.getElementById('btn-first-page');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');
const btnLastPage = document.getElementById('btn-last-page');

const searchTransDateFromInput = document.getElementById('searchTransDateFrom');
const searchTransDateToInput = document.getElementById('searchTransDateTo');
const searchItemNmInput = document.getElementById('searchItemNm');
const searchHiddenItemIdxInput = document.getElementById('searchHiddenItemIdx');
const searchCustNmInput = document.getElementById('searchCustNm');
const searchHiddenCustIdxInput = document.getElementById('searchHiddenCustIdx');
const searchUserNmInput = document.getElementById('searchUserNm');
const searchHiddenUserIdxInput = document.getElementById('searchHiddenUserIdx');
const searchWhNmInput = document.getElementById('searchWhNm');
const searchHiddenWhIdxInput = document.getElementById('searchHiddenWhIdx');
const searchTransStatusSelect = document.getElementById('searchTransStatus');

const modalTransCode = document.getElementById('modalTransCode');
const modalTransDate = document.getElementById('modalTransDate');
const modalTransQty = document.getElementById('modalTransQty');
const modalUnitPrice = document.getElementById('modalUnitPrice');
const modalRemark = document.getElementById('modalRemark');
const modalTransStatusSelect = document.getElementById('modalTransStatus');
const modalInvTransIdx = document.getElementById('modalInvTransIdx');
const modalTransStatusGroup = document.getElementById('modalTransStatusGroup');

const modalCustNmInput = document.getElementById('modalCustNm');
const modalHiddenCustIdxInput = document.getElementById('modalHiddenCustIdx');
const modalItemNmInput = document.getElementById('modalItemNm');
const modalHiddenItemIdxInput = document.getElementById('modalHiddenItemIdx');
const modalWhNmInput = document.getElementById('modalWhNm');
const modalHiddenWhIdxInput = document.getElementById('modalHiddenWhIdx');
const modalUserNmInput = document.getElementById('modalUserNm');
const modalHiddenUserIdxInput = document.getElementById('modalHiddenUserIdx');

// === 테이블 데이터 로드 함수 ===
async function loadReceivingTable(page = currentPage, sortBy = currentSortBy, sortDirection = currentOrder, filters = searchFilters) {
    currentPage = page; currentSortBy = sortBy; currentOrder = sortDirection; searchFilters = filters;
    receivingTableBody.innerHTML = '';
    const queryParams = new URLSearchParams({
        page: currentPage, size: pageSize, sortBy, sortDirection,
        ...(filters.transDateFrom && { transDateFrom: filters.transDateFrom }),
        ...(filters.transDateTo && { transDateTo: filters.transDateTo }),
        ...(filters.itemIdx && { itemIdx: filters.itemIdx }),
        ...(filters.custIdx && { custIdx: filters.custIdx }),
        ...(filters.userIdx && { userIdx: filters.userIdx }),
        ...(filters.whIdx && { whIdx: filters.whIdx }),
        ...(filters.transStatus && { transStatus: filters.transStatus }),
    });

    try {
        const response = await fetch(`/api/inv-transactions?${queryParams.toString()}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching receiving list: HTTP status ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
        }
        const responseData = await response.json();
        const invTransactions = responseData.content || [];
        totalPages = responseData.totalPages || 1;
        const totalElements = responseData.totalElements || 0;

        totalRecordsSpan.textContent = totalElements;
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        pageNumberInput.value = currentPage;
        btnFirstPage.disabled = currentPage === 1;
        btnPrevPage.disabled = currentPage === 1;
        btnNextPage.disabled = currentPage === totalPages || totalPages === 0;
        btnLastPage.disabled = currentPage === totalPages || totalPages === 0;
        pageNumberInput.max = totalPages > 0 ? totalPages : 1;

        if (invTransactions.length === 0) {
            displayNoDataMessage(receivingTableBody, 11); return;
        }
        receivingTableBody.innerHTML = '';
        invTransactions.forEach(trans => {
            const row = document.createElement('tr');
            row.dataset.invTransIdx = trans.invTransIdx;
            const totalAmount = (trans.transQty && trans.unitPrice) ? (parseFloat(trans.transQty) * parseFloat(trans.unitPrice)) : 0;
            row.innerHTML = `
                <td><input type="checkbox" class="trans-checkbox" data-inv-trans-idx="${trans.invTransIdx}" /></td>
                <td>${trans.invTransCode || ''}</td><td>${formatDate(trans.transDate) || ''}</td>
                <td>${trans.itemNm || ''} ${trans.itemCd ? '(' + trans.itemCd + ')' : ''}</td>
                <td>${trans.custNm || ''}</td><td>${trans.transQty !== null ? Number(trans.transQty).toLocaleString() : '0'}</td>
                <td>${trans.unitPrice !== null ? Number(trans.unitPrice).toLocaleString() : '0'}</td>
                <td>${totalAmount.toLocaleString()}</td><td>${trans.whNm || ''}</td>
                <td>${trans.userNm || '미지정'}</td><td>${getTransStatusText(trans.transStatus) || ''}</td>
            `;
            row.addEventListener('click', (event) => {
                if (event.target.type === 'checkbox') return;
                openModal('view', trans.invTransIdx);
            });
            receivingTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading receiving data:', error);
        displayNoDataMessage(receivingTableBody, 11, true);
    }
}

function displayNoDataMessage(tableBodyElement, colspanCount, isError = false) {
    const message = isError ? '데이터를 불러오는 중 오류가 발생했습니다.' : '등록된 데이터가 없습니다.';
    tableBodyElement.innerHTML = `<tr><td class="nodata" colspan="${colspanCount}" style="color: ${isError ? 'red' : '#666'}; padding: 20px;">${message}</td></tr>`;
}

document.querySelectorAll('#receivingTable thead th[data-sort-by]').forEach(th => {
    th.addEventListener('click', function() { order(this); });
});
function order(thElement) {
    const newSortBy = thElement.dataset.sortBy; if (!newSortBy) return;
    document.querySelectorAll('#receivingTable thead th .sort-arrow').forEach(arrow => { arrow.textContent = '↓'; arrow.classList.remove('active'); });
    if (currentSortBy === newSortBy) currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    else { currentSortBy = newSortBy; currentOrder = 'asc'; }
    const currentThArrow = thElement.querySelector('.sort-arrow');
    if (currentThArrow) { currentThArrow.textContent = currentOrder === 'asc' ? '↑' : '↓'; currentThArrow.classList.add('active'); }
    loadReceivingTable(1, currentSortBy, currentOrder, searchFilters);
}

async function openModal(mode, invTransIdx = null) {
    modalForm.reset(); currentInvTransIdxForModal = invTransIdx;
    [modalCustNmInput, modalHiddenCustIdxInput, modalItemNmInput, modalHiddenItemIdxInput,
     modalWhNmInput, modalHiddenWhIdxInput, modalUserNmInput, modalHiddenUserIdxInput]
     .forEach(input => { input.value = ''; if(input.type !== 'hidden') input.setCustomValidity(''); });
    saveButton.style.display = 'none'; editButton.style.display = 'none';
    modalTransCode.readOnly = true; modalTransStatusGroup.style.display = 'none';
    try { await loadModalDatalistData(); } catch (error) { console.error("모달용 Datalist 로드 중 에러:", error); }
    if (mode === 'new') {
        modalTitle.textContent = '신규 입고 등록'; saveButton.style.display = 'block';
        modalTransCode.value = '자동 생성'; modalTransDate.value = new Date().toISOString().substring(0, 10);
        modalInvTransIdx.value = '';
    } else if (mode === 'view' && invTransIdx !== null) {
        modalTitle.textContent = '입고 상세 정보'; editButton.style.display = 'block';
        modalTransStatusGroup.style.display = 'flex';
        try {
            const response = await fetch(`/api/inv-transactions/${invTransIdx}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, Message: ${await response.text()}`);
            const transaction = await response.json();
            modalInvTransIdx.value = transaction.invTransIdx || ''; modalTransCode.value = transaction.invTransCode || '';
            modalTransDate.value = formatDateToInput(transaction.transDate) || '';
            modalTransQty.value = transaction.transQty || ''; modalUnitPrice.value = transaction.unitPrice || '';
            modalRemark.value = transaction.remark || transaction.invTransRemark || '';
            modalTransStatusSelect.value = transaction.transStatus || '';
            setModalDatalistValue('modalCustNm', 'modalHiddenCustIdx', modalCustsData, transaction.custIdx);
            setModalDatalistValue('modalItemNm', 'modalHiddenItemIdx', modalItemsData, transaction.itemIdx);
            setModalDatalistValue('modalWhNm', 'modalHiddenWhIdx', modalWarehousesData, transaction.whIdx);
            setModalDatalistValue('modalUserNm', 'modalHiddenUserIdx', modalManagersData, transaction.userIdx);
        } catch (error) {
            console.error('입고 상세 정보 로드 오류:', error); alert('입고 정보를 불러오는데 실패했습니다: ' + error.message);
            closeModal(); return;
        }
    } else { alert('모달을 여는 중 오류가 발생했습니다.'); return; }
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none'; modalForm.reset(); currentInvTransIdxForModal = null;
    [modalCustNmInput, modalItemNmInput, modalWhNmInput, modalUserNmInput].forEach(input => input.setCustomValidity(''));
}
function outsideClick(e) { if (e.target.id === 'receivingModal') closeModal(); }

// === Datalist 데이터 로드 함수 (검색 필드 - 품목) ===
async function loadSearchItemsDatalist(custIdx = null) {
    let itemApiUrl = '/api/items/active-for-selection';
    if (custIdx && custIdx.trim() !== '') {
        itemApiUrl += `?custIdx=${encodeURIComponent(custIdx)}`;
    }
    try {
        const itemResponse = await fetch(itemApiUrl);
        if (itemResponse.ok) searchItemsData = await itemResponse.json();
        else { console.error('Error fetching search items:', await itemResponse.text()); searchItemsData = []; }
    } catch (error) { console.error("Search Items Datalist 로드 실패:", error); searchItemsData = []; }
    populateDatalist('searchItemsDatalist', searchItemsData, 'itemNm', 'itemCd', 'itemIdx');
}

// === Datalist 데이터 로드 함수 (검색용 - 품목 외) ===
async function loadSearchDatalistData() {
    try {
        await Promise.all([
            loadSearchItemsDatalist(), // 초기 전체 품목 로드
            (async () => {
                const custResponse = await fetch('/api/customers/active-for-selection?bizFlag=01');
                if (custResponse.ok) searchCustsData = await custResponse.json();
                else console.error('Error fetching search customers:', await custResponse.text());
                populateDatalist('searchCustsDatalist', searchCustsData, 'custNm', 'custCd', 'custIdx');
            })(),
            (async () => {
                const warehouseResponse = await fetch('/api/warehouses/active-for-selection');
                if (warehouseResponse.ok) searchWarehousesData = await warehouseResponse.json();
                else console.error('Error fetching search warehouses:', await warehouseResponse.text());
                populateDatalist('searchWarehousesDatalist', searchWarehousesData, 'whNm', 'whCd', 'whIdx');
            })(),
            (async () => {
                const managerResponse = await fetch('/api/users/active-for-selection');
                if (managerResponse.ok) searchManagersData = await managerResponse.json();
                else console.error('Error fetching search managers:', await managerResponse.text());
                populateDatalist('searchManagersDatalist', searchManagersData, 'userNm', 'userId', 'userIdx');
            })()
        ]);
    } catch (error) { console.error("Datalist 초기 로드 중 전체 오류:", error); }
}

// === Datalist 데이터 로드 함수 (모달용) ===
async function loadModalDatalistData() {
    try {
        const [itemRes, custRes, warehouseRes, managerRes] = await Promise.all([
            fetch('/api/items/active-for-selection'), // 모달에서는 항상 전체 품목 또는 상황에 맞는 품목 로드
            fetch('/api/customers/active-for-selection?bizFlag=01'),
            fetch('/api/warehouses/active-for-selection'),
            fetch('/api/users/active-for-selection')
        ]);
        if (itemRes.ok) modalItemsData = await itemRes.json(); else console.error('Error fetching modal items:', await itemRes.text());
        if (custRes.ok) modalCustsData = await custRes.json(); else console.error('Error fetching modal customers:', await custRes.text());
        if (warehouseRes.ok) modalWarehousesData = await warehouseRes.json(); else console.error('Error fetching modal warehouses:', await warehouseRes.text());
        if (managerRes.ok) modalManagersData = await managerRes.json(); else console.error('Error fetching modal managers:', await managerRes.text());
        populateDatalist('modalItemsDatalist', modalItemsData, 'itemNm', 'itemCd', 'itemIdx');
        populateDatalist('modalCustsDatalist', modalCustsData, 'custNm', 'custCd', 'custIdx');
        populateDatalist('modalWarehousesDatalist', modalWarehousesData, 'whNm', 'whCd', 'whIdx');
        populateDatalist('modalManagersDatalist', modalManagersData, 'userNm', 'userId', 'userIdx');
    } catch (error) { console.error("모달용 Datalist 로드 실패:", error); }
}

function populateDatalist(datalistId, dataArray, displayField, codeField, idxField) {
    const datalist = document.getElementById(datalistId);
    if (!datalist) { console.warn(`Datalist ID '${datalistId}' not found.`); return; }
    datalist.innerHTML = '';
    if (!Array.isArray(dataArray)) { console.warn(`Data for '${datalistId}' not an array.`); return; }
    dataArray.forEach(item => {
        const option = document.createElement('option');
        const displayValue = item[displayField] || 'N/A';
        const codeValue = item[codeField] || 'N/A';
        option.value = `${displayValue} (${codeValue})`;
        option.dataset.idx = item[idxField];
        datalist.appendChild(option);
    });
}

function setupDatalistInputListener(inputId, hiddenInputId, displayField, codeField, idxField, required = false) {
    const inputElement = document.getElementById(inputId);
    const hiddenInputElement = document.getElementById(hiddenInputId);
    if (!inputElement || !hiddenInputElement) { console.warn(`Datalist setup: Input or HiddenInput for ${inputId}`); return; }
    if (required) inputElement.required = true;
    const handler = () => {
        const inputValue = inputElement.value;
        let currentDatalistArray;
        if (inputId.startsWith('search')) {
            if (inputId.includes('Item')) currentDatalistArray = searchItemsData;
            else if (inputId.includes('Cust')) currentDatalistArray = searchCustsData;
            else if (inputId.includes('Wh')) currentDatalistArray = searchWarehousesData;
            else if (inputId.includes('Manager') || inputId.includes('User')) currentDatalistArray = searchManagersData;
        } else {
            if (inputId.includes('Item')) currentDatalistArray = modalItemsData;
            else if (inputId.includes('Cust')) currentDatalistArray = modalCustsData;
            else if (inputId.includes('Wh')) currentDatalistArray = modalWarehousesData;
            else if (inputId.includes('Manager') || inputId.includes('User')) currentDatalistArray = modalManagersData;
        }
        currentDatalistArray = currentDatalistArray || [];
        if (!Array.isArray(currentDatalistArray) || currentDatalistArray.length === 0 && inputValue.trim() !== '') {
            hiddenInputElement.value = '';
            if (required) inputElement.setCustomValidity('선택할 목록이 없거나 로딩 중입니다.');
            else inputElement.setCustomValidity('');
            return;
        }
        const matchedItem = currentDatalistArray.find(data => `${data[displayField] || ''} (${data[codeField] || ''})` === inputValue);
        if (matchedItem) {
            hiddenInputElement.value = matchedItem[idxField]; inputElement.setCustomValidity('');
        } else {
            hiddenInputElement.value = '';
            if (inputValue.trim() !== '') inputElement.setCustomValidity('목록에 있는 유효한 항목을 선택하거나, 입력 값을 확인해주세요.');
            else if (required) inputElement.setCustomValidity('필수 항목입니다. 목록에서 항목을 선택해주세요.');
            else inputElement.setCustomValidity('');
        }
    };
    inputElement.addEventListener('input', handler); inputElement.addEventListener('change', handler);
}

function setModalDatalistValue(inputElementId, hiddenInputId, datalistData, selectedIdx) {
    const input = document.getElementById(inputElementId); const hiddenInput = document.getElementById(hiddenInputId);
    if (!input || !hiddenInput) return;
    input.setCustomValidity('');
    if (selectedIdx === null || selectedIdx === undefined || String(selectedIdx).trim() === '') {
        input.value = ''; hiddenInput.value = '';
        if (input.required) { /* input.setCustomValidity('필수 항목입니다.'); */ } // 필요시 활성화
        return;
    }
    if (!Array.isArray(datalistData) || datalistData.length === 0) {
        console.warn(`Datalist for ${inputElementId} empty. Cannot set ID: ${selectedIdx}`);
        input.value = ''; hiddenInput.value = '';
        if (input.required) input.setCustomValidity('선택할 목록이 없습니다.');
        return;
    }
    const idxFieldName = (() => {
        const firstItem = datalistData[0];
        if (firstItem.hasOwnProperty('itemIdx')) return 'itemIdx'; if (firstItem.hasOwnProperty('custIdx')) return 'custIdx';
        if (firstItem.hasOwnProperty('whIdx')) return 'whIdx'; if (firstItem.hasOwnProperty('userIdx')) return 'userIdx';
        if (inputElementId.toLowerCase().includes('item')) return 'itemIdx'; if (inputElementId.toLowerCase().includes('cust')) return 'custIdx';
        if (inputElementId.toLowerCase().includes('wh')) return 'whIdx'; if (inputElementId.toLowerCase().includes('user')) return 'userIdx';
        return 'id';
    })();
    const selectedItem = datalistData.find(item => String(item[idxFieldName]) === String(selectedIdx));
    if (selectedItem) {
        const displayField = selectedItem.hasOwnProperty('itemNm') ? 'itemNm' : selectedItem.hasOwnProperty('custNm') ? 'custNm' : selectedItem.hasOwnProperty('whNm') ? 'whNm' : selectedItem.hasOwnProperty('userNm') ? 'userNm' : 'name';
        const codeField = selectedItem.hasOwnProperty('itemCd') ? 'itemCd' : selectedItem.hasOwnProperty('custCd') ? 'custCd' : selectedItem.hasOwnProperty('whCd') ? 'whCd' : selectedItem.hasOwnProperty('userId') ? 'userId' : 'code';
        input.value = `${selectedItem[displayField] || ''} (${selectedItem[codeField] || ''})`;
        hiddenInput.value = selectedItem[idxFieldName]; input.setCustomValidity('');
    } else {
        input.value = ''; hiddenInput.value = '';
        console.warn(`No item in ${inputElementId} for ID: ${selectedIdx}. Cleared.`);
        if (input.required) input.setCustomValidity('선택된 값이 목록에 없습니다.');
    }
}

function formatDateToInput(dateString) {
    if (!dateString) return ''; try { const date = new Date(dateString); if (isNaN(date.getTime())) return ''; return date.toISOString().substring(0, 10); } catch (e) { return ''; }
}
function formatDate(dateString) {
    if (!dateString) return ''; try { const date = new Date(dateString); if (isNaN(date.getTime())) return ''; const year = date.getFullYear(); const month = (date.getMonth() + 1).toString().padStart(2, '0'); const day = date.getDate().toString().padStart(2, '0'); return `${year}.${month}.${day}`; } catch (e) { return ''; }
}
function getTransStatusText(statusCode) {
    const statusMap = { 'R1': '입고전', 'R2': '가입고', 'R3': '입고완료', 'S1': '출고전', 'S2': '출고완료' };
    return statusMap[statusCode] || statusCode || '';
}

document.addEventListener('DOMContentLoaded', () => {
    loadSearchDatalistData().then(() => {
        setupDatalistInputListener('searchItemNm', 'searchHiddenItemIdx', 'itemNm', 'itemCd', 'itemIdx');
        setupDatalistInputListener('searchCustNm', 'searchHiddenCustIdx', 'custNm', 'custCd', 'custIdx');
        setupDatalistInputListener('searchWhNm', 'searchHiddenWhIdx', 'whNm', 'whCd', 'whIdx');
        setupDatalistInputListener('searchUserNm', 'searchHiddenUserIdx', 'userNm', 'userId', 'userIdx');

        // 거래처(searchCustNmInput) 선택 변경 시 품목 Datalist 업데이트
        searchCustNmInput.addEventListener('change', () => {
            const selectedCustIdx = searchHiddenCustIdxInput.value;
            searchItemNmInput.value = ''; // 품목 입력 필드 초기화
            searchHiddenItemIdxInput.value = ''; // 품목 hidden ID 필드 초기화
            searchItemNmInput.setCustomValidity(''); // 품목 입력 필드의 유효성 상태 초기화
            loadSearchItemsDatalist(selectedCustIdx); // 선택된 거래처에 따라 품목 Datalist 새로고침
        });
    });
    setupDatalistInputListener('modalItemNm', 'modalHiddenItemIdx', 'itemNm', 'itemCd', 'itemIdx', true);
    setupDatalistInputListener('modalCustNm', 'modalHiddenCustIdx', 'custNm', 'custCd', 'custIdx', true);
    setupDatalistInputListener('modalWhNm', 'modalHiddenWhIdx', 'whNm', 'whCd', 'whIdx', true);
    setupDatalistInputListener('modalUserNm', 'modalHiddenUserIdx', 'userNm', 'userId', 'userIdx', false);

    loadReceivingTable();

    searchButton.addEventListener('click', (event) => {
        event.preventDefault();
        searchFilters = {
            transDateFrom: searchTransDateFromInput.value, transDateTo: searchTransDateToInput.value,
            itemIdx: searchHiddenItemIdxInput.value, custIdx: searchHiddenCustIdxInput.value,
            userIdx: searchHiddenUserIdxInput.value, whIdx: searchHiddenWhIdxInput.value,
            transStatus: searchTransStatusSelect.value
        };
        loadReceivingTable(1, currentSortBy, currentOrder, searchFilters);
    });

    document.querySelectorAll('#receivingForm input[type="text"],#receivingForm input[type="date"],#receivingForm select').forEach(input => {
        input.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); searchButton.click(); } });
        if (input.tagName === 'SELECT') input.addEventListener('change', () => searchButton.click());
    });

    resetSearchButton.addEventListener('click', () => {
        document.getElementById('receivingForm').reset();
        [searchHiddenItemIdxInput, searchHiddenCustIdxInput, searchHiddenUserIdxInput, searchHiddenWhIdxInput]
            .forEach(input => { input.value = ''; const visibleInputId = input.id.replace('Hidden','').replace('Idx','Nm');
                                const visibleInput = document.getElementById(visibleInputId); if(visibleInput) visibleInput.setCustomValidity(''); });
        searchFilters = { transDateFrom:'', transDateTo:'', itemIdx:'', custIdx:'', userIdx:'', whIdx:'', transStatus:'' };
        currentSortBy = 'invTransIdx'; currentOrder = 'desc';
        document.querySelectorAll('#receivingTable thead th .sort-arrow').forEach(arrow => {
            arrow.textContent = '↓'; arrow.classList.remove('active');
            const th = arrow.closest('th'); if (th && th.dataset.sortBy === currentSortBy) {
                arrow.classList.add('active'); arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
            }
        });
        loadSearchItemsDatalist(); // 거래처 필터 없이 전체 품목으로 Datalist 리셋
        loadReceivingTable(1, currentSortBy, currentOrder, searchFilters);
    });

    newRegistrationButton.addEventListener('click', () => openModal('new'));
    selectAllCheckboxes.addEventListener('change', function() { document.querySelectorAll('.trans-checkbox').forEach(cb => cb.checked = this.checked); });
    receivingTableBody.addEventListener('change', function(event) {
        if (event.target.classList.contains('trans-checkbox')) {
            const allCB = document.querySelectorAll('.trans-checkbox');
            const checkedCB = document.querySelectorAll('.trans-checkbox:checked');
            selectAllCheckboxes.checked = allCB.length > 0 && allCB.length === checkedCB.length;
        }
    });

    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!modalForm.checkValidity()) { modalForm.reportValidity(); return; }
        const requiredModalDatalistInputs = [
            { visible: modalItemNmInput, hidden: modalHiddenItemIdxInput, name: "품목" },
            { visible: modalCustNmInput, hidden: modalHiddenCustIdxInput, name: "거래처" },
            { visible: modalWhNmInput, hidden: modalHiddenWhIdxInput, name: "입고 창고" }
        ];
        for (const field of requiredModalDatalistInputs) {
            if (field.visible.required && !field.hidden.value) {
                if (field.visible.value.trim() === '') field.visible.setCustomValidity('필수 항목입니다. 목록에서 선택해주세요.');
                else field.visible.setCustomValidity('목록에 있는 유효한 항목을 선택해주세요.');
                modalForm.reportValidity(); return;
            }
        }
        const formData = new FormData(event.target);
        const isEditMode = formData.get('invTransIdx') && formData.get('invTransIdx') !== '';
        const data = {
            invTransIdx: formData.get('invTransIdx') || null,
            invTransCode: formData.get('invTransCode') === '자동 생성' ? null : formData.get('invTransCode'),
            transType: 'R', whIdx: parseInt(formData.get('whIdx')), transDate: formData.get('transDate'),
            transQty: parseInt(formData.get('transQty')), unitPrice: parseFloat(formData.get('unitPrice')),
            transStatus: formData.get('transStatus') || 'R1',
            userIdx: formData.get('userIdx') ? parseInt(formData.get('userIdx')) : null,
            itemIdx: parseInt(formData.get('itemIdx')), custIdx: parseInt(formData.get('custIdx')),
            remark: formData.get('remark')
        };
        const url = isEditMode ? `/api/inv-transactions/${data.invTransIdx}` : '/api/inv-transactions';
        const method = isEditMode ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) {
                const errorText = await response.text(); let errorMessage = `HTTP error! ${response.status}: ${errorText}`;
                try { const errorJson = JSON.parse(errorText); errorMessage = errorJson.message || errorMessage; } catch (e) {}
                throw new Error(errorMessage);
            }
            alert(isEditMode ? '입고 정보가 성공적으로 수정되었습니다.' : '새 입고가 성공적으로 등록되었습니다.');
            closeModal();
            loadReceivingTable(isEditMode ? currentPage : 1, currentSortBy, currentOrder, searchFilters);
        } catch (error) {
            console.error('Error saving receiving data:', error);
            alert(`입고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
        }
    });

    deleteButton.addEventListener('click', async () => {
        const checkedCBs = document.querySelectorAll('.trans-checkbox:checked');
        const idsToDelete = Array.from(checkedCBs).map(cb => cb.dataset.invTransIdx);
        if (idsToDelete.length === 0) { alert('삭제할 입고 항목을 선택해주세요.'); return; }
        if (!confirm(`${idsToDelete.length}개 입고 항목을 삭제하시겠습니까?\n삭제된 데이터는 복구 불가합니다.`)) return;
        try {
            const response = await fetch('/api/inv-transactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(idsToDelete) });
            if (!response.ok && response.status !== 204) {
                const errorText = await response.text(); let errorMessage = `HTTP error! ${response.status}: ${errorText}`;
                try { const errorJson = JSON.parse(errorText); errorMessage = errorJson.message || errorMessage; } catch (e) {}
                throw new Error(errorMessage);
            }
            alert('선택된 입고 항목이 삭제되었습니다.');
            const newTotal = parseInt(totalRecordsSpan.textContent) - idsToDelete.length;
            if (newTotal <= (currentPage - 1) * pageSize && currentPage > 1) currentPage--;
            loadReceivingTable(currentPage, currentSortBy, currentOrder, searchFilters);
            selectAllCheckboxes.checked = false;
        } catch (error) {
            console.error('Error deleting receiving data:', error);
            alert(`입고 항목 삭제 실패: ${error.message}`);
        }
    });

    btnFirstPage.addEventListener('click', () => loadReceivingTable(1, currentSortBy, currentOrder, searchFilters));
    btnPrevPage.addEventListener('click', () => { if (currentPage > 1) loadReceivingTable(currentPage - 1, currentSortBy, currentOrder, searchFilters); });
    btnNextPage.addEventListener('click', () => { if (currentPage < totalPages) loadReceivingTable(currentPage + 1, currentSortBy, currentOrder, searchFilters); });
    btnLastPage.addEventListener('click', () => loadReceivingTable(totalPages, currentSortBy, currentOrder, searchFilters));
    pageNumberInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            let page = parseInt(pageNumberInput.value);
            if (isNaN(page) || page < 1) page = 1;
            if (page > totalPages && totalPages > 0) page = totalPages; else if (totalPages === 0) page = 1;
            loadReceivingTable(page, currentSortBy, currentOrder, searchFilters);
        }
    });
    pageNumberInput.addEventListener('blur', () => {
        let page = parseInt(pageNumberInput.value);
        if (isNaN(page) || page < 1) page = 1;
        if (page > totalPages && totalPages > 0) page = totalPages; else if (totalPages === 0) page = 1;
        pageNumberInput.value = page;
    });
});