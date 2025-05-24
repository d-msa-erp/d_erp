// === 전역 변수 ===
       let currentSortBy = 'invTransIdx';
       let currentOrder = 'desc';
       let currentPage = 1;
       let totalPages = 1;
       const pageSize = 10;
       let currentInvTransIdxForModal = null; // 현재 모달에서 열린 입고 트랜잭션 ID

       // 검색 필터 값 저장
       let searchFilters = {
           transDateFrom: '',
           transDateTo: '',
           itemIdx: '',
           custIdx: '',
           userIdx: '',
           whIdx: '',
           transStatus: ''
       };

       // Datalist 데이터를 저장할 배열
       // 검색용 datalist와 모달용 datalist는 분리해서 관리
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
       const resetSearchButton = document.getElementById('resetSearchButton'); // 초기화 버튼 추가
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

       // === 검색 필드 요소 가져오기 ===
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


       // === 모달 폼 필드 요소 가져오기 ===
       const modalTransCode = document.getElementById('modalTransCode');
       const modalTransDate = document.getElementById('modalTransDate');
       const modalTransQty = document.getElementById('modalTransQty');
       const modalUnitPrice = document.getElementById('modalUnitPrice');
       const modalRemark = document.getElementById('modalRemark');
       const modalTransStatusSelect = document.getElementById('modalTransStatus');
       const modalInvTransIdx = document.getElementById('modalInvTransIdx');
       const modalTransStatusGroup = document.getElementById('modalTransStatusGroup');

       // === Datalist input 및 hidden 필드 가져오기 (모달 내 폼) ===
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
           currentPage = page;
           currentSortBy = sortBy;
           currentOrder = sortDirection;
           searchFilters = filters; // 현재 검색 필터 상태 저장

           receivingTableBody.innerHTML = '';
           displayNoDataMessage(receivingTableBody, 11);

           // 필터 파라미터 구성
           const queryParams = new URLSearchParams();
           queryParams.append('page', currentPage);
           queryParams.append('size', pageSize);
           queryParams.append('sortBy', sortBy);
           queryParams.append('sortDirection', sortDirection);

           // 검색 필터 값 추가
           if (filters.transDateFrom) queryParams.append('transDateFrom', filters.transDateFrom);
           if (filters.transDateTo) queryParams.append('transDateTo', filters.transDateTo);
           if (filters.itemIdx) queryParams.append('itemIdx', filters.itemIdx);
           if (filters.custIdx) queryParams.append('custIdx', filters.custIdx);
           if (filters.userIdx) queryParams.append('userIdx', filters.userIdx);
           if (filters.whIdx) queryParams.append('whIdx', filters.whIdx);
           if (filters.transStatus) queryParams.append('transStatus', filters.transStatus);


           try {
               // TODO: 백엔드 API 엔드포인트에 맞게 URL 수정 (필터 파라미터 추가)
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

               // 페이지네이션 버튼 상태 업데이트
               btnFirstPage.disabled = currentPage === 1;
               btnPrevPage.disabled = currentPage === 1;
               btnNextPage.disabled = currentPage === totalPages;
               btnLastPage.disabled = currentPage === totalPages;
               pageNumberInput.max = totalPages;


               if (invTransactions.length === 0) {
                   displayNoDataMessage(receivingTableBody, 11);
                   return;
               }

               receivingTableBody.innerHTML = ''; // 데이터가 있을 경우 다시 초기화

               invTransactions.forEach(trans => {
                   const row = document.createElement('tr');
                   row.dataset.invTransIdx = trans.invTransIdx;

                   const totalAmount = (trans.transQty || 0) * (trans.unitPrice || 0);

                   row.innerHTML = `
                       <td><input type="checkbox" class="trans-checkbox" data-inv-trans-idx="${trans.invTransIdx}" /></td>
                       <td>${trans.invTransCode || ''}</td>
                       <td>${formatDate(trans.transDate) || ''}</td>
                       <td>${trans.itemNm || ''} (${trans.itemCd || ''})</td>
                       <td>${trans.custNm || ''}</td>
                       <td>${trans.transQty !== null ? trans.transQty.toLocaleString() : '0'}</td>
                       <td>${trans.unitPrice !== null ? trans.unitPrice.toLocaleString() : '0'}</td>
                       <td>${totalAmount.toLocaleString()}</td>
                       <td>${trans.whNm || ''}</td>
                       <td>${trans.userNm || '미지정'}</td>
                       <td>${getTransStatusText(trans.transStatus) || ''}</td>
                   `;
                   // 행 전체 클릭 시 모달 열기 (체크박스 클릭 제외)
                   row.addEventListener('click', (event) => {
                       if (event.target.type === 'checkbox') {
                           return;
                       }
                       openModal('view', trans.invTransIdx);
                   });
                   receivingTableBody.appendChild(row);
               });

           } catch (error) {
               console.error('Error loading receiving data:', error);
               displayNoDataMessage(receivingTableBody, 11, true);
           }
       }

       // === 데이터 없음 메시지 표시 함수 ===
       function displayNoDataMessage(tableBodyElement, colspanCount, isError = false) {
           const message = isError ? '데이터 로드 실패' : '등록된 데이터가 없습니다.';
           const color = isError ? 'red' : 'inherit';
           tableBodyElement.innerHTML = `
               <tr>
                   <td class="nodata" colspan="${colspanCount}" style="color: ${color};">${message}</td>
               </tr>
           `;
       }

       // === 테이블 정렬 함수 ===
       document.querySelectorAll('#receivingTable thead th').forEach(th => {
           th.addEventListener('click', function() {
               order(this);
           });
       });

       function order(thElement) {
           const newSortBy = thElement.dataset.sortBy;

           if (!newSortBy) {
               console.warn("data-sort-by 속성이 정의되지 않았거나 비어있습니다. 정렬 불가.", thElement);
               return;
           }

           document.querySelectorAll('#receivingTable thead th .sort-arrow').forEach(arrow => {
               arrow.textContent = '↓';
               arrow.classList.remove('active');
           });

           if (currentSortBy === newSortBy) {
               currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
           } else {
               currentOrder = 'asc';
               currentSortBy = newSortBy;
           }

           const currentThArrow = thElement.querySelector('.sort-arrow');
           if (currentThArrow) {
               currentThArrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
               currentThArrow.classList.add('active');
           }

           loadReceivingTable(1, currentSortBy, currentOrder, searchFilters);
       }

       // === 모달 열기 함수 ===
       async function openModal(mode, invTransIdx = null) {
           modalForm.reset(); // 폼 초기화
           currentInvTransIdxForModal = invTransIdx;

           // 기본 UI 상태 설정 (신규 등록 모드)
           modalTitle.textContent = '신규 입고 등록';
           saveButton.style.display = 'block';
           editButton.style.display = 'none';
           modalTransCode.value = '자동 생성';
           modalTransCode.readOnly = true;
           modalTransStatusGroup.style.display = 'none';

           // Datalist 데이터 미리 로드 (모달용 데이터)
           await loadModalDatalistData();

           // === 모드에 따른 UI 및 데이터 설정 ===
           if (mode === 'new') {
               modalTransDate.value = new Date().toISOString().substring(0, 10); // 오늘 날짜 기본 설정
               modalInvTransIdx.value = ''; // 신규 등록 시 인덱스 초기화
           } else if (mode === 'view' && invTransIdx !== null) {
               modalTitle.textContent = '입고 상세 정보';
               saveButton.style.display = 'none';
               editButton.style.display = 'block';
               modalTransCode.readOnly = true;
               modalTransStatusGroup.style.display = 'flex';

               try {
                   const response = await fetch(`/api/inv-transactions/${invTransIdx}`);
                   if (!response.ok) {
                       const errorText = await response.text();
                       console.error(`Error fetching inv transaction details: HTTP status ${response.status}`, errorText);
                       throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
                   }
                   const transaction = await response.json();

                   modalInvTransIdx.value = transaction.invTransIdx || '';
                   modalTransCode.value = transaction.invTransCode || '';
                   modalTransDate.value = formatDateToInput(transaction.transDate) || '';
                   modalTransQty.value = transaction.transQty || '';
                   modalUnitPrice.value = transaction.unitPrice || '';
                   modalRemark.value = transaction.remark || '';
                   modalTransStatusSelect.value = transaction.transStatus || '';

                   setModalDatalistValue('modalCustNm', 'modalHiddenCustIdx', modalCustsData, transaction.custIdx);
                   setModalDatalistValue('modalItemNm', 'modalHiddenItemIdx', modalItemsData, transaction.itemIdx);
                   setModalDatalistValue('modalWhNm', 'modalHiddenWhIdx', modalWarehousesData, transaction.whIdx);
                   setModalDatalistValue('modalUserNm', 'modalHiddenUserIdx', modalManagersData, transaction.userIdx);

               } catch (error) {
                   console.error('입고 상세 정보를 불러오는 중 오류 발생:', error);
                   alert('입고 정보를 불러오는데 실패했습니다.');
                   closeModal();
                   return;
               }
           } else {
               console.error("openModal 함수 호출 오류: 유효하지 않은 모드 또는 invTransIdx가 누락되었습니다.", mode, invTransIdx);
               alert('모달을 여는 중 오류가 발생했습니다.');
               return;
           }
           modal.style.display = 'flex'; // 모달 표시
       }

       // === 모달 닫기 함수 ===
       function closeModal() {
           modal.style.display = 'none';
           modalForm.reset();
           currentInvTransIdxForModal = null;
           modalTransCode.readOnly = false;
           modalTransStatusGroup.style.display = 'none';
       }

       // === 모달 외부 클릭 시 닫기 ===
       function outsideClick(e) {
           if (e.target.id === 'receivingModal') closeModal();
       }

       // === Datalist 데이터 로드 함수 (검색용) ===
       async function loadSearchDatalistData() {
           try {
               const itemResponse = await fetch('/api/items/active-for-selection');
               if (itemResponse.ok) searchItemsData = await itemResponse.json();
               else console.error('Error fetching search items for datalist:', await itemResponse.text());

               const custResponse = await fetch('/api/customers/active-for-selection');
               if (custResponse.ok) searchCustsData = await custResponse.json();
               else console.error('Error fetching search customers for datalist:', await custResponse.text());

               const warehouseResponse = await fetch('/api/warehouses/active-for-selection');
               if (warehouseResponse.ok) searchWarehousesData = await warehouseResponse.json();
               else console.error('Error fetching search warehouses for datalist:', await warehouseResponse.text());

               const managerResponse = await fetch('/api/users/active-for-selection');
               if (managerResponse.ok) searchManagersData = await managerResponse.json();
               else console.error('Error fetching search managers for datalist:', await managerResponse.text());

               populateDatalist('searchItemsDatalist', searchItemsData, 'itemNm', 'itemCd', 'itemIdx');
               populateDatalist('searchCustsDatalist', searchCustsData, 'custNm', 'custCd', 'custIdx');
               populateDatalist('searchWarehousesDatalist', searchWarehousesData, 'whNm', 'whCd', 'whIdx');
               populateDatalist('searchManagersDatalist', searchManagersData, 'userNm', 'userId', 'userIdx');

           } catch (error) {
               console.error("검색용 Datalist 데이터 로드 실패:", error);
           }
       }

       // === Datalist 데이터 로드 함수 (모달용) ===
       async function loadModalDatalistData() {
           try {
               const itemResponse = await fetch('/api/items/active-for-selection');
               if (itemResponse.ok) modalItemsData = await itemResponse.json();
               else console.error('Error fetching modal items for datalist:', await itemResponse.text());

               const custResponse = await fetch('/api/customers/active-for-selection');
               if (custResponse.ok) modalCustsData = await custResponse.json();
               else console.error('Error fetching modal customers for datalist:', await custResponse.text());

               const warehouseResponse = await fetch('/api/warehouses/active-for-selection');
               if (warehouseResponse.ok) modalWarehousesData = await warehouseResponse.json();
               else console.error('Error fetching modal warehouses for datalist:', await warehouseResponse.text());

               const managerResponse = await fetch('/api/users/active-for-selection');
               if (managerResponse.ok) modalManagersData = await managerResponse.json();
               else console.error('Error fetching modal managers for datalist:', await managerResponse.text());

               populateDatalist('modalItemsDatalist', modalItemsData, 'itemNm', 'itemCd', 'itemIdx');
               populateDatalist('modalCustsDatalist', modalCustsData, 'custNm', 'custCd', 'custIdx');
               populateDatalist('modalWarehousesDatalist', modalWarehousesData, 'whNm', 'whCd', 'whIdx');
               populateDatalist('modalManagersDatalist', modalManagersData, 'userNm', 'userId', 'userIdx');

           } catch (error) {
               console.error("모달용 Datalist 데이터 로드 실패:", error);
           }
       }

       // === Datalist 옵션 채우는 범용 함수 ===
       function populateDatalist(datalistId, dataArray, displayField, codeField, idxField) {
           const datalist = document.getElementById(datalistId);
           if (!datalist) return;
           datalist.innerHTML = '';
           dataArray.forEach(item => {
               const option = document.createElement('option');
               option.value = `${item[displayField]} (${item[codeField]})`;
               option.dataset.idx = item[idxField];
               datalist.appendChild(option);
           });
       }

       // === Datalist input 값 변경 시 hidden 필드 설정 함수 (검색용) ===
       function setSearchHiddenIdx(inputElementId, hiddenInputId, datalistData, displayField, codeField, idxField) {
           const input = document.getElementById(inputElementId);
           const hiddenInput = document.getElementById(hiddenInputId);
           const inputValue = input.value;

           const matchedItem = datalistData.find(data => `${data[displayField]} (${data[codeField]})` === inputValue);

           if (matchedItem) {
               hiddenInput.value = matchedItem[idxField];
               input.setCustomValidity('');
           } else {
               hiddenInput.value = '';
               // input.setCustomValidity('유효한 항목을 목록에서 선택해주세요.'); // 필요 시 유효성 경고
           }
       }

       // === Datalist input 값 변경 시 hidden 필드 설정 함수 (모달용) ===
       function setModalHiddenIdx(inputElementId, hiddenInputId, datalistData, displayField, codeField, idxField) {
           const input = document.getElementById(inputElementId);
           const hiddenInput = document.getElementById(hiddenInputId);
           const inputValue = input.value;

           const matchedItem = datalistData.find(data => `${data[displayField]} (${data[codeField]})` === inputValue);

           if (matchedItem) {
               hiddenInput.value = matchedItem[idxField];
               input.setCustomValidity('');
           } else {
               hiddenInput.value = '';
           }
       }

       // === Datalist input에 기존 값 설정 함수 (모달용) ===
       function setModalDatalistValue(inputElementId, hiddenInputId, datalistData, selectedIdx) {
           const input = document.getElementById(inputElementId);
           const hiddenInput = document.getElementById(hiddenInputId);

           const selectedItem = datalistData.find(item => String(item[item.hasOwnProperty('userIdx') ? 'userIdx' : item.hasOwnProperty('whIdx') ? 'whIdx' : item.hasOwnProperty('itemIdx') ? 'itemIdx' : 'custIdx']) === String(selectedIdx));

           if (selectedItem) {
               const displayField = selectedItem.hasOwnProperty('userNm') ? 'userNm' : selectedItem.hasOwnProperty('whNm') ? 'whNm' : selectedItem.hasOwnProperty('itemNm') ? 'itemNm' : 'custNm';
               const codeField = selectedItem.hasOwnProperty('userId') ? 'userId' : selectedItem.hasOwnProperty('whCd') ? 'whCd' : selectedItem.hasOwnProperty('itemCd') ? 'itemCd' : 'custCd';

               input.value = `${selectedItem[displayField]} (${selectedItem[codeField]})`;
               hiddenInput.value = selectedItem[selectedItem.hasOwnProperty('userIdx') ? 'userIdx' : selectedItem.hasOwnProperty('whIdx') ? 'whIdx' : selectedItem.hasOwnProperty('itemIdx') ? 'itemIdx' : 'custIdx'];
           } else {
               input.value = '';
               hiddenInput.value = '';
           }
       }

       // === 날짜 포맷 함수 (YYYY-MM-DD) ===
       function formatDateToInput(dateString) {
           if (!dateString) return '';
           const date = new Date(dateString);
           return date.toISOString().substring(0, 10);
       }

       // === 날짜 포맷 함수 (YYYY.MM.DD) (테이블 표시용) ===
       function formatDate(dateString) {
           if (!dateString) return '';
           const date = new Date(dateString);
           const year = date.getFullYear();
           const month = (date.getMonth() + 1).toString().padStart(2, '0');
           const day = date.getDate().toString().padStart(2, '0');
           return `${year}.${month}.${day}`;
       }

       // === 거래 상태 코드 변환 함수 ===
       function getTransStatusText(statusCode) {
           switch (statusCode) {
               case 'R1':
                   return '입고전';
               case 'R2':
                   return '가입고';
               case 'R3':
                   return '입고완료';
               case 'S1':
                   return '출고전';
               case 'S2':
                   return '출고완료';
               default:
                   return '';
           }
       }

       // === 이벤트 리스너 등록 ===
       document.addEventListener('DOMContentLoaded', () => {
           loadSearchDatalistData(); // 페이지 로드 시 검색 필드용 Datalist 데이터 로드
           loadReceivingTable(); // 페이지 로드 시 입고 목록 로드

           // 검색 버튼 클릭 이벤트
           searchButton.addEventListener('click', (event) => {
               event.preventDefault();

               // 검색 필터 값 업데이트
               searchFilters = {
                   transDateFrom: searchTransDateFromInput.value,
                   transDateTo: searchTransDateToInput.value,
                   itemIdx: searchHiddenItemIdxInput.value,
                   custIdx: searchHiddenCustIdxInput.value,
                   userIdx: searchHiddenUserIdxInput.value,
                   whIdx: searchHiddenWhIdxInput.value,
                   transStatus: searchTransStatusSelect.value
               };
               loadReceivingTable(1, currentSortBy, currentOrder, searchFilters); // 검색 시 1페이지로 이동
           });

           // 검색 필드에서 Enter 키 입력 시 검색
           document.querySelectorAll('.shipping-info-form input').forEach(input => {
               input.addEventListener('keypress', (event) => {
                   if (event.key === 'Enter') {
                       event.preventDefault();
                       searchButton.click();
                   }
               });
           });
           searchTransStatusSelect.addEventListener('change', () => { // select 변경 시 바로 검색
               searchButton.click();
           });


           // 초기화 버튼 클릭 이벤트
           resetSearchButton.addEventListener('click', () => {
               // 검색 필드 값 초기화
               document.getElementById('receivingForm').reset();
               searchHiddenItemIdxInput.value = '';
               searchHiddenCustIdxInput.value = '';
               searchHiddenUserIdxInput.value = '';
               searchHiddenWhIdxInput.value = '';

               // 검색 필터 상태 초기화
               searchFilters = {
                   transDateFrom: '',
                   transDateTo: '',
                   itemIdx: '',
                   custIdx: '',
                   userIdx: '',
                   whIdx: '',
                   transStatus: ''
               };
               loadReceivingTable(1); // 초기화 후 1페이지로 다시 로드
           });

           // 신규등록 버튼 클릭 이벤트
           newRegistrationButton.addEventListener('click', () => {
               openModal('new');
           });

           // 헤더 체크박스 전체 선택/해제
           selectAllCheckboxes.addEventListener('change', function() {
               const isChecked = this.checked;
               document.querySelectorAll('.trans-checkbox').forEach(checkbox => {
                   checkbox.checked = isChecked;
               });
           });

           // 개별 체크박스 상태 변경 시 전체 선택 체크박스 업데이트
           receivingTableBody.addEventListener('change', function(event) {
               if (event.target.classList.contains('trans-checkbox')) {
                   const allCheckboxes = document.querySelectorAll('.trans-checkbox');
                   const checkedCheckboxes = document.querySelectorAll('.trans-checkbox:checked');
                   selectAllCheckboxes.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
               }
           });

           // Datalist input 변경 이벤트 (검색 필드용 hidden 필드 설정)
           searchItemNmInput.addEventListener('input', () => setSearchHiddenIdx('searchItemNm', 'searchHiddenItemIdx', searchItemsData, 'itemNm', 'itemCd', 'itemIdx'));
           searchItemNmInput.addEventListener('change', () => setSearchHiddenIdx('searchItemNm', 'searchHiddenItemIdx', searchItemsData, 'itemNm', 'itemCd', 'itemIdx'));

           searchCustNmInput.addEventListener('input', () => setSearchHiddenIdx('searchCustNm', 'searchHiddenCustIdx', searchCustsData, 'custNm', 'custCd', 'custIdx'));
           searchCustNmInput.addEventListener('change', () => setSearchHiddenIdx('searchCustNm', 'searchHiddenCustIdx', searchCustsData, 'custNm', 'custCd', 'custIdx'));

           searchWhNmInput.addEventListener('input', () => setSearchHiddenIdx('searchWhNm', 'searchHiddenWhIdx', searchWarehousesData, 'whNm', 'whCd', 'whIdx'));
           searchWhNmInput.addEventListener('change', () => setSearchHiddenIdx('searchWhNm', 'searchHiddenWhIdx', searchWarehousesData, 'whNm', 'whCd', 'whIdx'));

           searchUserNmInput.addEventListener('input', () => setSearchHiddenIdx('searchUserNm', 'searchHiddenUserIdx', searchManagersData, 'userNm', 'userId', 'userIdx'));
           searchUserNmInput.addEventListener('change', () => setSearchHiddenIdx('searchUserNm', 'searchHiddenUserIdx', searchManagersData, 'userNm', 'userId', 'userIdx'));


           // Datalist input 변경 이벤트 (모달용 hidden 필드 설정)
           modalCustNmInput.addEventListener('input', () => setModalHiddenIdx('modalCustNm', 'modalHiddenCustIdx', modalCustsData, 'custNm', 'custCd', 'custIdx'));
           modalCustNmInput.addEventListener('change', () => setModalHiddenIdx('modalCustNm', 'modalHiddenCustIdx', modalCustsData, 'custNm', 'custCd', 'custIdx'));

           modalItemNmInput.addEventListener('input', () => setModalHiddenIdx('modalItemNm', 'modalHiddenItemIdx', modalItemsData, 'itemNm', 'itemCd', 'itemIdx'));
           modalItemNmInput.addEventListener('change', () => setModalHiddenIdx('modalItemNm', 'modalHiddenItemIdx', modalItemsData, 'itemNm', 'itemCd', 'itemIdx'));

           modalWhNmInput.addEventListener('input', () => setModalHiddenIdx('modalWhNm', 'modalHiddenWhIdx', modalWarehousesData, 'whNm', 'whCd', 'whIdx'));
           modalWhNmInput.addEventListener('change', () => setModalHiddenIdx('modalWhNm', 'modalHiddenWhIdx', modalWarehousesData, 'whNm', 'whCd', 'whIdx'));

           modalUserNmInput.addEventListener('input', () => setModalHiddenIdx('modalUserNm', 'modalHiddenUserIdx', modalManagersData, 'userNm', 'userId', 'userIdx'));
           modalUserNmInput.addEventListener('change', () => setModalHiddenIdx('modalUserNm', 'modalHiddenUserIdx', modalManagersData, 'userNm', 'userId', 'userIdx'));


           // 폼 제출 처리 (등록/수정)
           modalForm.addEventListener('submit', async (event) => {
               event.preventDefault();

               // Datalist의 hidden 필드 값 유효성 검사 (필수 값만)
               if (!modalHiddenCustIdxInput.value) {
                   alert("유효한 거래처를 선택해주세요.");
                   modalCustNmInput.focus();
                   return;
               }
               if (!modalHiddenItemIdxInput.value) {
                   alert("유효한 품목을 선택해주세요.");
                   modalItemNmInput.focus();
                   return;
               }
               if (!modalHiddenWhIdxInput.value) {
                   alert("유효한 입고 창고를 선택해주세요.");
                   modalWhNmInput.focus();
                   return;
               }
               // 담당자는 NULL 허용이므로 userIdx는 필수로 체크하지 않음.

               const formData = new FormData(event.target);
               const data = {
                   invTransIdx: formData.get('invTransIdx') || null, // 수정 시 필요
                   invTransCode: formData.get('invTransCode') === '자동 생성' ? null : formData.get('invTransCode'),
                   transType: 'R', // 입고 고정
                   orderIdx: null, // 주문/발주와 연동 시 사용
                   whIdx: parseInt(formData.get('whIdx')),
                   transDate: formData.get('transDate'),
                   transQty: parseInt(formData.get('transQty')),
                   unitPrice: parseFloat(formData.get('unitPrice')),
                   transStatus: formData.get('transStatus') || 'R1', // 신규 등록 시 '입고전' 기본값
                   userIdx: formData.get('userIdx') ? parseInt(formData.get('userIdx')) : null,
                   itemIdx: parseInt(formData.get('itemIdx')),
                   remark: formData.get('remark')
               };

               const isEditMode = data.invTransIdx && data.invTransIdx !== '';
               const url = isEditMode ? `/api/inv-transactions/${data.invTransIdx}` : '/api/inv-transactions';
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

                   alert(isEditMode ? '입고 정보가 성공적으로 수정되었습니다.' : '새 입고가 성공적으로 등록되었습니다.');
                   closeModal();
                   loadReceivingTable(currentPage, currentSortBy, currentOrder, searchFilters); // 현재 검색/정렬 상태 유지하며 목록 새로고침
               } catch (error) {
                   console.error('Error saving receiving data:', error);
                   alert(`입고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
               }
           });

           // 삭제 버튼 클릭 이벤트
           deleteButton.addEventListener('click', async () => {
               const checkedCheckboxes = document.querySelectorAll('.trans-checkbox:checked');
               const invTransIdxesToDelete = Array.from(checkedCheckboxes).map(cb => cb.dataset.invTransIdx);

               if (invTransIdxesToDelete.length === 0) {
                   alert('삭제할 입고 항목을 선택해주세요.');
                   return;
               }

               if (!confirm(`${invTransIdxesToDelete.length}개의 입고 항목을 정말로 삭제하시겠습니까?`)) {
                   return;
               }

               try {
                   const response = await fetch('/api/inv-transactions', {
                       method: 'DELETE',
                       headers: {
                           'Content-Type': 'application/json'
                       },
                       body: JSON.stringify(invTransIdxesToDelete)
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

                   alert('선택된 입고 항목이 성공적으로 삭제되었습니다.');
                   loadReceivingTable(currentPage, currentSortBy, currentOrder, searchFilters); // 현재 검색/정렬 상태 유지하며 목록 새로고침
               } catch (error) {
                   console.error('Error deleting receiving data:', error);
                   alert(`입고 항목 삭제에 실패했습니다: ${error.message}`);
               }
           });

           // 페이지네이션 버튼 이벤트 리스너
           btnFirstPage.addEventListener('click', () => loadReceivingTable(1, currentSortBy, currentOrder, searchFilters));
           btnPrevPage.addEventListener('click', () => {
               if (currentPage > 1) loadReceivingTable(currentPage - 1, currentSortBy, currentOrder, searchFilters);
           });
           btnNextPage.addEventListener('click', () => {
               if (currentPage < totalPages) loadReceivingTable(currentPage + 1, currentSortBy, currentOrder, searchFilters);
           });
           btnLastPage.addEventListener('click', () => loadReceivingTable(totalPages, currentSortBy, currentOrder, searchFilters));
           pageNumberInput.addEventListener('keypress', (event) => {
               if (event.key === 'Enter') {
                   let page = parseInt(pageNumberInput.value);
                   if (isNaN(page) || page < 1) page = 1;
                   if (page > totalPages) page = totalPages;
                   loadReceivingTable(page, currentSortBy, currentOrder, searchFilters);
               }
           });
       });