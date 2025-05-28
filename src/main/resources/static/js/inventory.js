document.addEventListener('DOMContentLoaded', function() {
        const itemTableBody = document.getElementById('itembody');
        const noDataRow = document.getElementById('Noitem');
        const prevPageButton = document.getElementById('btn-prev-page');
        const nextPageButton = document.getElementById('btn-next-page');
        const currentPageInput = document.getElementById('currentPageInput');
        const totalCountSpan = document.querySelector('.pagination-wrap span:first-child');
        const currentPageSpan = document.querySelector('.pagination-wrap span:nth-child(2)');
		
        const excelDownBtn = document.getElementById('excelBtn');
        //검색 관련 변수
        const SearchCatSelect = document.getElementById('searchCatSelect');
        const SearchItemText = document.getElementById('searchItemText');
        const SearchButton = document.getElementById('searchButton');
        let CsearchCat =SearchCatSelect.value;
        let CsearchItem = '';
        
        //삭제버튼
        const deleteBtn = document.getElementById('deleteBtn');
        
        let currentPage = 1;
        let totalPages = 1;
        const pageSize = 10;
        

        function fetchItems(page) {
        	let url = `/api/items?page=${page}&size=${pageSize}`;
        	if(CsearchItem.trim() !== ''){
        		url += `&CsearchCat=${CsearchCat}&CsearchItem=${CsearchItem}`;
        	}
        	
            fetch(url)
            .then(response => {
                const totalCountHeader = response.headers.get('X-Total-Count');
                // API가 Page<Item.Response>를 반환하면, data는 content 배열을 포함한 Page 객체일 수 있습니다.
                // 또는 컨트롤러에서 List<Item.Response> 와 X-Total-Count를 별도로 반환할 수도 있습니다.
                // 여기서는 컨트롤러가 { content: [...], totalElements: ... } 또는 직접 List와 헤더를 준다고 가정합니다.
                // 만약 Spring Page 객체 전체가 data로 넘어온다면 data.content로 접근해야 합니다.
                return response.json().then(responseData => {
                    // Spring Page 객체를 직접 반환하는 경우, 실제 아이템 목록은 responseData.content에 있습니다.
                    // totalCount는 헤더 또는 responseData.totalElements에서 가져올 수 있습니다.
                    // 현재 코드는 헤더에서 totalCount를 가져오고, data가 직접 아이템 배열이라고 가정합니다.
                    // 만약 Page 객체가 넘어온다면: const items = responseData.content; totalPages = responseData.totalPages; currentPage = responseData.number + 1;
                    return { data: responseData.content ? responseData.content : responseData, totalCount: totalCountHeader || (responseData.totalElements !== undefined ? responseData.totalElements : 0) };
                });
            })
            .then(({ data, totalCount }) => {
                console.log('서버 응답 데이터:', data);
                console.log('총 개수:', totalCount);

                const items = data; // items는 Item.Response 객체의 배열
                totalPages = Math.ceil(totalCount / pageSize);
                currentPage = page;

                totalCountSpan.textContent = `총 ${totalCount || 0}건`;
                currentPageSpan.textContent = `${currentPage}/${totalPages || 1}페이지`;
                prevPageButton.disabled = currentPage === 1;
                nextPageButton.disabled = currentPage === totalPages || totalPages === 0; // totalPages가 0일때도 비활성화
                currentPageInput.value = currentPage;

                itemTableBody.innerHTML = '';
                if (items && items.length > 0) {
                    noDataRow.style.display = 'none';
                    items.forEach(item => { // item은 Item.Response DTO
                        const row = itemTableBody.insertRow();
                        row.style.cursor = 'pointer';
                        row.addEventListener('click', () => openModal(item));
                        const checkboxCell = row.insertCell();
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.classList.add('item-checkbox');
                        checkbox.addEventListener('click',(e) =>{
                        	e.stopPropagation();
                        });
                        checkboxCell.appendChild(checkbox);
                        checkboxCell.addEventListener('click', (e) => {
                            e.stopPropagation(); 
                        });
                        
                        row.insertCell().textContent = item.itemNm || "";      // 품목명
                        row.insertCell().textContent = item.itemCd || "";      // 품목코드
                        row.insertCell().textContent = item.itemCat1Nm || "";  // 대분류명
                        row.insertCell().textContent = item.itemCat2Nm || "";  // 소분류명
                        row.insertCell().textContent = item.custNm || "";      // 거래처명
                        row.insertCell().textContent = item.unitNm || "";      // 단위명
                        row.insertCell().textContent = item.qty === null ? "0" : item.qty; // 현재고량
                        //row.insertCell().textContent = item.itemCost === null ? "" : item.itemCost; // 단가
                        
						const costCell = row.insertCell();
						costCell.textContent = formatCurrencyKR(item.itemCost); // 단가 (천단위 쉼표 및 "원" 추가)
                        row.dataset.item = JSON.stringify(item); // Item.Response 전체 저장
                    });
                    updateCheckAllItem();
                } else {
                    noDataRow.style.display = '';
                    totalPages = 1; // 데이터가 없을 경우 totalPages를 1로 설정하여 UI 깨짐 방지
                    currentPageSpan.textContent = `${currentPage}/${totalPages}페이지`;
                    nextPageButton.disabled = true;
                }
            })
            .catch(error => {
                console.error('데이터를 가져오는 중 오류 발생:', error);
                itemTableBody.innerHTML = ''; // 오류 시 테이블 비우기
                noDataRow.style.display = ''; // '데이터 없음' 표시
                totalCountSpan.textContent = '총 0건';
                currentPageSpan.textContent = '1/1페이지';
                prevPageButton.disabled = true;
                nextPageButton.disabled = true;
            });
    }

        // 초기 데이터 로딩 (1페이지)
        fetchItems(currentPage);

        prevPageButton.addEventListener('click', function() {
            if (currentPage > 1) {
                fetchItems(currentPage - 1);
            }
        });

        nextPageButton.addEventListener('click', function() {
            if (currentPage < totalPages) {
                fetchItems(currentPage + 1);
            }
        });

        currentPageInput.addEventListener('change', function() {
            const pageNumber = parseInt(this.value);
            if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
                fetchItems(pageNumber);
            } else {
                alert('유효한 페이지 번호를 입력하세요.');
                this.value = currentPage;
            }
        });
        
        //검색 버튼 이벤트
        SearchButton.addEventListener('click', function() {
        	CsearchCat = SearchCatSelect.value;
        	CsearchItem = SearchItemText.value.trim();
        	fetchItems(1); // 검색 시 첫 페이지부터
        });
        
       	//삭제 버튼 이벤트
       	deleteBtn.addEventListener('click', function() {
			const checkedItemsData = [];
			const itemCheckboxes = itemTableBody.querySelectorAll('input[type="checkbox"]:checked');
			
			itemCheckboxes.forEach(checkbox => {
				const row = checkbox.closest('tr');
				if(row && row.dataset.item){
					const item = JSON.parse(row.dataset.item); // Item.Response 객체
					checkedItemsData.push(item.itemIdx); // itemIdx 사용
				}
			});

            if (checkedItemsData.length === 0) {
                alert('삭제할 항목을 선택해주세요.');
                return;
            }

		    if(confirm(`선택된 항목 ${checkedItemsData.length} 개를 정말 삭제하시겠습니까?`)){
			    fetch(`/api/items/deletes`,{
	                method: 'POST',
	                headers: { 'Content-Type': 'application/json' },
	                body: JSON.stringify(checkedItemsData)
			    })
			    .then(response =>{
				    if(response.ok){
					    return response.text();
				    } else {
	                    return response.json().then(error => { throw new Error(error.message || '삭제 실패'); });
				    }
			    })
		        .then(message => {
		            alert(message); 
		            fetchItems(currentPage); // 현재 페이지 데이터 다시 로드
		        })
		        .catch(error => {
		            console.error('삭제 중 오류 발생:', error);
		            alert('삭제에 실패했습니다: ' + error.message);
		        });
		    }
		});
		
       	//체크박스 클릭 이벤트
       	const checkallItem = document.getElementById('checkallItem');
       	const updateCheckAllItem = () => {
       		const itemCheckboxes = itemTableBody.querySelectorAll('.item-checkbox');
            const checkedCount = itemTableBody.querySelectorAll('.item-checkbox:checked').length;
            checkallItem.checked = (itemCheckboxes.length > 0 && checkedCount === itemCheckboxes.length);
       	};

        checkallItem.addEventListener('change', function() {
            const itemCheckboxes = itemTableBody.querySelectorAll('.item-checkbox');
            itemCheckboxes.forEach(checkbox => { checkbox.checked = this.checked; });
        });

        itemTableBody.addEventListener('change', function(event) {
            if (event.target.classList.contains('item-checkbox')) {
            	updateCheckAllItem();
            }
        });
            
        excelDownBtn.addEventListener('click', function() {
        	const exCsearchCat = SearchCatSelect.value;
            const exCsearchItem = SearchItemText.value.trim();
            let downUrl = `/api/items/excel`;
            const params = new URLSearchParams();
            if (exCsearchCat && exCsearchCat.trim() !== '') { params.append('CsearchCat', exCsearchCat); }
            if (exCsearchItem && exCsearchItem.trim() !== '') { params.append('CsearchItem', exCsearchItem); }
            if (params.toString()) { downUrl += '?' + params.toString(); }
            window.open(downUrl, '_blank');
		});
       	
    });
	
	function formatCurrencyKR(value, includeDecimals = false) {
	    if (value === null || value === undefined || isNaN(parseFloat(value))) {
	        return ""; // 또는 "가격 정보 없음", "0원" 등
	    }
	    const number = parseFloat(value);
	    const options = {
	        // style: 'currency', // 'currency' 스타일은 통화 기호(₩)를 자동으로 붙이지만, "원"을 직접 붙이기로 함
	        // currency: 'KRW', // 위와 동일
	        minimumFractionDigits: includeDecimals ? 2 : 0, // 소수점 표시 여부
	        maximumFractionDigits: includeDecimals ? 2 : 0
	    };
	    return number.toLocaleString('ko-KR', options) + "원";
	}

	// JAVASCRIPT 수정: 통화 형식 문자열에서 숫자만 추출하는 함수 추가
	function unformatCurrencyKR(formattedValue) {
	    if (typeof formattedValue !== 'string') {
	        // 이미 숫자이거나, null/undefined이면 그대로 반환 또는 적절히 처리
	        const num = parseFloat(formattedValue);
	        return isNaN(num) ? null : num;
	    }
	    // "원" 문자 및 쉼표(,) 제거 후 숫자로 변환
	    const numericString = formattedValue.replace(/[원,]/g, ""); 
	    const numValue = parseFloat(numericString);
	    return isNaN(numValue) ? null : numValue; // 변환 실패 시 null 반환
	}

	
		let currentTh = null;
		let currentOrder = 'desc';

		function order(thValue) {//정렬
			const allArrows = document.querySelectorAll("th a");
			allArrows.forEach(a => a.textContent = '↓');

			if (currentTh === thValue) {
				currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
			} else {
				currentOrder = 'asc';
				currentTh = thValue;
			}

			const arrow = thValue.querySelector('a');
			arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
		}
		
		//품목 코드 자동 생성 함수
		async function createItemCD() {
			const itemCodeInput = document.querySelector('#modalForm input[name="item_CD"]');
			itemCodeInput.readOnly = false; // 자동 생성이므로 입력 방지 후 값 설정
			let isUni = false;
			let Icode = '';
			while(!isUni){
				const ranNum = Math.floor(Math.random()*999)+1;
				const formNum = String(ranNum).padStart(3,'0');
				Icode = 'I' + formNum;
				try{
					const response = await fetch(`/api/items/check?itemCd=${Icode}`);
					if(!response.ok){ throw new Error(`SERVER ERROR: ${response.status}`); }
					const data = await response.json(); // data = {isUni: true/false}
					if(data.isUni){ // 백엔드에서 isUnique, isAvailable 등으로 명확한 키 사용 권장
						isUni = true;
					} else {
						console.warn(`품목코드 ${Icode}는 사용중입니다. 재부여 합니다.`);
					}
				} catch (error) {
					alert('품목 코드 확인 중 오류가 발생했습니다.');
					console.error('품목코드 오류 :',error);
					itemCodeInput.value= ''; // 오류 시 입력 필드 초기화
					return; // 함수 종료
				}
			}
			itemCodeInput.value = Icode;
			itemCodeInput.readOnly = true; // 값 설정 후 다시 읽기 전용
		}
		
		//거래처 목록 출력 함수
		async function selectCust(selectedCustId = null) {
			const custSelect = document.querySelector('#modalForm select[name="cust_NM"]');
			custSelect.innerHTML = '<option value="">거래처를 선택해주세요</option>';
			try{
				const response = await fetch(`/api/items/custs`);
		        if (!response.ok) { throw new Error(`Failed to load customers: ${response.status}`); }
		        const customers = await response.json(); // customers는 CustomerForItemDto 배열
		        customers.forEach(customer => {
		            const option = document.createElement('option');
		            option.value = customer.custIdx; // 필드명 변경: cust_IDX -> custIdx
		            option.textContent = customer.custNm; // 필드명 변경: cust_NM -> custNm
		            custSelect.appendChild(option);
		        });
                if (selectedCustId !== null) { // ID로 값 설정
                    custSelect.value = selectedCustId;
                }
			} catch (error) {
		        console.error('거래처 목록 로드 실패:', error);
				alert('거래처 목록을 불러오는 중 오류가 발생했습니다.');
			}
		}
		//대분류 목록 출력 함수
		async function selectCat1(selectedCatIdx=null) {
			const cat1Select = document.querySelector('#modalForm select[name="item_CATX1"]');
			cat1Select.innerHTML = '<option value="">대분류를 선택해주세요</option>';
            const cat2Select = document.querySelector('#modalForm select[name="item_CATX2"]'); // 소분류 셀렉트
			try{
				const response = await fetch(`/api/items/cats`);
		        if (!response.ok) { throw new Error(`Failed to load categories: ${response.status}`);}
		        const cats = await response.json(); // cats는 CatDto 배열
		        cats.forEach(cat => {
		            const option = document.createElement('option');
		            option.value = cat.catIdx; // 필드명 변경: cat_IDX -> catIdx
		            option.textContent = cat.catNm; // 필드명 변경: cat_NM -> catNm
		            cat1Select.appendChild(option);
		        });

                cat1Select.removeEventListener('change', cat2Change); // 기존 리스너 제거
		        cat1Select.addEventListener('change', cat2Change); // 새 리스너 연결

                if (selectedCatIdx !== null) {
                    cat1Select.value = selectedCatIdx;
                    // 대분류 선택 후 소분류 로드 (수정 모드 시)
                    if (selectedCatIdx) { // selectedCat1Id가 유효한 경우에만
                        const selectedCat2Id = document.querySelector('#modalForm input[name="item_CAT2_hidden_for_edit"]')?.value; // 임시 hidden input 활용 가능
                        await selectCat2(selectedCatIdx, selectedCat2Id ? parseInt(selectedCat2Id) : null);
                    }
                } else {
                    // 신규등록 시 소분류 초기화
                    cat2Select.innerHTML = '<option value="">소분류를 선택해주세요</option>';
		        	cat2Select.disabled = true;
                }
			} catch (error) {
		        console.error('대분류 목록 로드 실패:', error);
				alert('대분류 목록을 불러오는 중 오류가 발생했습니다.');
			}
		}
		// 대분류 선택 변경 시 소분류를 로드하는 이벤트 핸들러
		async function cat2Change() {
			const cat1Select = document.querySelector('#modalForm select[name="item_CATX1"]');
            const selectedCatIdx = cat1Select.value ? parseInt(cat1Select.value) : null;
		    const cat2Select = document.querySelector('#modalForm select[name="item_CATX2"]');
		    
		    if (selectedCatIdx) {
		        await selectCat2(selectedCatIdx); // 선택된 소분류 ID 없이 로드 (신규 선택 시)
		    } else {
		        cat2Select.innerHTML = '<option value="">소분류를 선택해주세요</option>';
		        cat2Select.value = "";
		        cat2Select.disabled = true;
		    }
		}
		
		// 소분류를 로드하고 특정 소분류를 선택하는 함수
		async function selectCat2(parent_IDX, selectedCatIdx = null) {
			const cat2Select = document.querySelector('#modalForm select[name="item_CATX2"]');
		    cat2Select.innerHTML = '<option value="">소분류를 선택해주세요</option>';
		    cat2Select.disabled = true;

		    if (!parent_IDX || parent_IDX <= 0) { return; }

		    try {
		        const response = await fetch(`/api/items/sub/${parent_IDX}`);
		        if (!response.ok) { throw new Error(`Failed to load sub categories: ${response.status}`);}
		        const subCats = await response.json(); // subCats는 CatDto 배열

		        if (subCats && subCats.length > 0) {
		        	cat2Select.disabled = false;
		            subCats.forEach(category => {
		                const option = document.createElement('option');
		                option.value = category.catIdx; // 필드명 변경: cat_IDX -> catIdx
		                option.textContent = category.catNm; // 필드명 변경: cat_NM -> catNm
		                cat2Select.appendChild(option);
		            });
		            if (selectedCatIdx !== null) {
		            	cat2Select.value = selectedCatIdx;
		            } else {
                        cat2Select.value = ""; // 명시적 초기화
                    }
		        } else {
		            cat2Select.innerHTML = '<option value="">하위 소분류 없음</option>';
                    cat2Select.value = "";
		            cat2Select.disabled = true;
		        }
		    } catch (error) {
		        console.error('소분류 목록 로드 실패:', error);
		        alert('소분류 목록을 불러오는 중 오류가 발생했습니다.');
		    }
		}
		
		//단위 출력 함수
		async function selectUnit(selectedUnitIdx = null) {
			const unitSelect = document.querySelector('#modalForm select[name="item_UNIT"]');
		    unitSelect.innerHTML = '<option value="">단위를 선택해주세요</option>';
		    try {
		        const response = await fetch('/api/items/units');
		        if (!response.ok) { throw new Error(`Failed to load units: ${response.status}`); }
		        const units = await response.json(); // units는 UnitForItemDto 배열
		        units.forEach(unit => {
		            const option = document.createElement('option');
		            option.value = unit.unitIdx; // 필드명 변경: unit_IDX -> unitIdx
		            option.textContent = unit.unitNm; // 필드명 변경: unit_NM -> unitNm
		            unitSelect.appendChild(option);
		        });
                if (selectedUnitIdx !== null) {
                    unitSelect.value = selectedUnitIdx;
                }
		    } catch (error) {
		        console.error('단위 목록 로드 실패:', error);
		        alert('단위 목록을 불러오는 중 오류가 발생했습니다.');
		    }
		}
		
		//Modal ~ 
		function openModal(item = null) {
			const modal = document.getElementById('modal');
            const title = document.getElementById('modalTitle');
		    const form = document.getElementById('modalForm');
		    form.reset(); // 폼 초기화

            // 숨겨진 필드 (소분류 ID 임시 저장용 - 수정 시점)
            let cat2HiddenInput = document.querySelector('#modalForm input[name="item_CAT2_hidden_for_edit"]');
            if (!cat2HiddenInput) {
                cat2HiddenInput = document.createElement('input');
                cat2HiddenInput.type = 'hidden';
                cat2HiddenInput.name = 'item_CAT2_hidden_for_edit';
                form.appendChild(cat2HiddenInput);
            }
            cat2HiddenInput.value = ''; // 초기화
		
		    const itemCodeInput = document.querySelector('#modalForm input[name="item_CD"]');
		    const customerSelect = document.querySelector('#modalForm select[name="cust_NM"]'); // HTML의 name="cust_NM" 사용
		    const cat1Select = document.querySelector('#modalForm select[name="item_CATX1"]');
		    const cat2Select = document.querySelector('#modalForm select[name="item_CATX2"]');
		    const unitSelect = document.querySelector('#modalForm select[name="item_UNIT"]');
		
		    if (item) { // 수정 모드 (item은 Item.Response)
		        title.textContent = '품목 수정';
		        document.querySelector('#modalForm button[name="save"]').style.display = 'none';
		        document.querySelector('#modalForm button[name="edit"]').style.display = 'block';
		
		        itemCodeInput.value = item.itemCd || "";
                itemCodeInput.readOnly = true;
		        document.querySelector('#modalForm input[name="item_NM"]').value = item.itemNm || "";
		        document.querySelector('#modalForm input[name="item_SPEC"]').value = item.itemSpec || "";
		        document.querySelector('#modalForm input[name="item_COST"]').value = item.itemCost === null ? "" : item.itemCost;
		        document.querySelector('#modalForm input[name="remark"]').value = item.remark || "";
		        document.querySelector('#modalForm input[name="optimal_INV"]').value = item.optimalInv === null ? "" : item.optimalInv;
		        document.querySelector('#modalForm input[name="item_IDX"]').value = item.itemIdx || "";
                
                // itemFlag는 직접 설정하지 않고, 대분류에 따라 서버에서 결정되거나,
                // 필요하다면 Item.Response에 itemFlag를 포함시켜서 가져와 설정할 수 있습니다.
                // 현재는 서버 DTO에 itemFlag가 있으므로, 이를 사용해 폼에 임시 저장하거나 할 수 있지만,
                // 폼 제출 시에는 대분류 ID를 기준으로 itemFlag가 다시 계산되므로 직접 설정은 불필요할 수 있습니다.

                // 드롭다운 값 설정
                selectCust(item.custIdx); // Item.Response의 custIdx 사용
                if (item.itemCat2Id) { // 소분류 ID 임시 저장
                     cat2HiddenInput.value = item.itemCat2Id;
                }
                selectCat1(item.itemCat1Id); // Item.Response의 itemCat1Id 사용, 이 함수가 selectCat2도 트리거함
                selectUnit(item.itemUnitId); // Item.Response의 itemUnitId 사용
		
		        const editButton = document.querySelector('#modalForm button[name="edit"]');
                // 이벤트 리스너 중복 방지를 위해 기존 리스너를 클로닝으로 제거 후 새로 추가
                const newEditButton = editButton.cloneNode(true);
                editButton.parentNode.replaceChild(newEditButton, editButton);
                newEditButton.addEventListener('click', (e) => {
		            e.preventDefault();
		            updateItem(item.itemIdx);
		        });
		
		    } else { // 신규 등록 모드
		        title.textContent = '신규 품목 등록';
		        document.querySelector('#modalForm button[name="save"]').style.display = 'block';
		        document.querySelector('#modalForm button[name="edit"]').style.display = 'none';
		
		        itemCodeInput.readOnly = false; // 자동생성 시 true로 바뀜
		        createItemCD();
		
		        selectCust();
		        selectCat1(); // 대분류 로드 (선택된 값 없이) -> 여기서 소분류는 자동으로 초기화됨
                selectUnit();

		        const saveBtn = document.querySelector('#modalForm button[name="save"]');
                const newSaveBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
		        newSaveBtn.addEventListener('click', submitModal);
		    }
		    modal.style.display = 'flex';
		}

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        }
     // 전역 이벤트 리스너로 변경 (openModal 함수가 호출될 때마다 이벤트 리스너가 중복 등록되는 것을 방지하기 위함)
        document.getElementById('modal').addEventListener('click', function(event) {
            if (event.target.id === 'modal') {
                closeModal('modal');
            }
        });
        // 폼 내부 클릭 시 모달이 닫히지 않도록 이벤트 전파 중단
        document.querySelector('.modal-content').addEventListener('click', function(event) {
            event.stopPropagation();
        });
        
        function outsideClick(e) {
            if (e.target.id === 'modal') {
                closeModal('modal');
            }
        }


		//품목 신규 등록 함수
        function submitModal(event) {
        	event.preventDefault();
            const formData = new FormData(document.getElementById('modalForm'));
            const formProps = Object.fromEntries(formData.entries()); // 폼 데이터를 객체로 변환

            // Item.CreateRequest DTO 형식에 맞게 페이로드 구성
            const payload = {
                itemCd: formProps.item_CD,
                itemNm: formProps.item_NM,
                itemSpec: formProps.item_SPEC,
                remark: formProps.remark,
                // itemFlag는 서버에서 itemCat1Id 기준으로 설정하거나, 클라이언트에서 계산
                custIdx: formProps.cust_NM ? parseInt(formProps.cust_NM) : null,
                itemCat1Id: formProps.item_CATX1 ? parseInt(formProps.item_CATX1) : null,
                itemCat2Id: formProps.item_CATX2 ? parseInt(formProps.item_CATX2) : null,
                itemUnitId: formProps.item_UNIT ? parseInt(formProps.item_UNIT) : null,
                optimalInv: formProps.optimal_INV ? parseInt(formProps.optimal_INV) : null,
                itemCost: formProps.item_COST ? parseFloat(formProps.item_COST) : null
            };
            
            // itemFlag 설정 (기존 로직 유지 또는 서버에서 처리하도록 변경)
            if (payload.itemCat1Id === 1) { // 예시: 대분류 ID가 1이면 '01'
                payload.itemFlag = '01';
            } else {
                payload.itemFlag = '02'; // 그 외 '02'
            }
            console.log("전송될 신규 품목 데이터 (payload):", payload);

            // 유효성 검사
            if (!payload.itemNm || payload.itemNm.trim() === '') { alert("품목명은 필수 입력 사항입니다."); return; }
            if (payload.custIdx === null || isNaN(payload.custIdx) || payload.custIdx <= 0) { alert("거래처를 선택해주세요."); return; }
            if (payload.itemCat1Id === null || isNaN(payload.itemCat1Id) || payload.itemCat1Id <= 0) { alert("대분류를 선택해주세요."); return; }
            // 소분류는 선택사항일 수 있으므로 대분류가 있을 때만 유효성 검사 (필요시)
            // if (payload.itemCat1Id && (payload.itemCat2Id === null || isNaN(payload.itemCat2Id) || payload.itemCat2Id <= 0)) { alert("소분류를 선택해주세요."); return; }
            if (payload.itemUnitId === null || isNaN(payload.itemUnitId) || payload.itemUnitId <=0) { alert("단위를 선택해주세요."); return; }
            if (payload.itemCost === null || isNaN(payload.itemCost) || payload.itemCost < 0) { alert("단가는 유효한 숫자여야 합니다."); return; }
            if (payload.optimalInv === null || isNaN(payload.optimalInv) || payload.optimalInv < 0) { alert("적정재고는 유효한 숫자여야 합니다."); return; }
            
            fetch(`/api/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(async response => {
            	
                if (response.ok) {
                    alert('새로운 품목이 등록되었습니다.');
                    closeModal('modal');
                    window.location.reload();
                } else {
                    const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류 발생' }));
                    alert('품목 등록에 실패했습니다: ' + (errorData.message || response.statusText));
                    console.error('품목 등록 실패:', response, errorData);	
                }
            })
            .catch(error => {
                alert('서버 통신 중 오류가 발생했습니다.');
                console.log(currentPage);
                console.error('서버 통신 오류:', error);
            });
        }


		//품목 데이터 업데이트 함수
		function updateItem(item_IDX) {
			
			const formData = new FormData(document.getElementById('modalForm'));
            const formProps = Object.fromEntries(formData.entries());

            // Item.UpdateRequest DTO 형식에 맞게 페이로드 구성
            const payload = {
                itemNm: formProps.item_NM,
                itemSpec: formProps.item_SPEC,
                remark: formProps.remark,
                // itemFlag는 서버에서 itemCat1Id 기준으로 설정하거나, 클라이언트에서 계산
                custIdx: formProps.cust_NM ? parseInt(formProps.cust_NM) : null,
                itemCat1Id: formProps.item_CATX1 ? parseInt(formProps.item_CATX1) : null,
                itemCat2Id: formProps.item_CATX2 ? parseInt(formProps.item_CATX2) : null,
                itemUnitId: formProps.item_UNIT ? parseInt(formProps.item_UNIT) : null,
                optimalInv: formProps.optimal_INV ? parseInt(formProps.optimal_INV) : null,
                itemCost: formProps.item_COST ? parseFloat(formProps.item_COST) : null
                // itemCd는 일반적으로 수정하지 않으므로 페이로드에서 제외
            };

            if (payload.itemCat1Id === 1) { // 예시: 대분류 ID가 1이면 '01'
                payload.itemFlag = '01';
            } else {
                payload.itemFlag = '02'; // 그 외 '02'
            }
            console.log("전송될 수정 품목 데이터 (payload):", payload); 
            
            // 유효성 검사 (submitModal과 유사하게 적용)
            if (!payload.itemNm || payload.itemNm.trim() === '') { alert("품목명은 필수 입력 사항입니다."); return; }
            // ... 기타 유효성 검사 추가 ...
            
            fetch(`/api/items/${item_IDX}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(async response => {
                if (!response.ok) {
                	const errorData = await response.json().catch(() => ({ message: '품목 수정 실패' }));
                	throw new Error(errorData.message || `품목 수정 실패: ${response.statusText}`);
                }
                return response.text(); // 성공 시 보통 메시지나 업데이트된 객체를 받음
            })
            .then(successMessageOrUpdatedItem => {
                // 백엔드가 업데이트된 Item.Response를 반환한다면 여기서 파싱하여 활용 가능
                // 여기서는 간단히 alert만 띄움
            	alert((payload.itemNm || '해당') + ' 품목 데이터가 수정되었습니다.');
                closeModal('modal');
                window.location.reload();
            })
            .catch(error => {
                alert('품목 수정 중 오류 발생: ' + error.message);
                console.error('품목 수정 오류:', error);
            });
        }