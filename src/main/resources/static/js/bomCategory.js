
//CATEGORY(품목 모달용)
        function openCategoryModal() {
            document.getElementById('modal-category').style.display = 'flex'; // Changed to flex for centering
            loadCategories(); // Load categories when modal opens
        }

        // The user provided `outsideClick` and `closeModal` in their HTML
        // function outsideClick(event, modalId) {
        //     if (event.target == document.getElementById(modalId)) {
        //         document.getElementById(modalId).style.display = 'none';
        //     }
        // }
        // function closeModal(modalId) {
        //     document.getElementById(modalId).style.display = 'none';
        // }


        // --- 품목 카테고리 관리 모달 관련 스크립트 시작 ---

        // 카테고리 로드 함수
        async function loadCategories() {
            const categoryTbody = document.getElementById('MainCatBody');
            categoryTbody.innerHTML = '<tr><td colspan="6" class="no-data">카테고리 정보를 불러오는 중...</td></tr>'; // 로딩 메시지

            try {
                const response = await fetch('/api/category/details');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const categories = await response.json();

                categoryTbody.innerHTML = ''; // 기존 내용 지우기

                if (categories.length === 0) {
                    categoryTbody.innerHTML = '<tr><td colspan="6" class="no-data">등록된 카테고리가 없습니다.</td></tr>';
                    return;
                }

                // 부모-자식 관계를 위한 맵 생성
                const categoryMap = new Map();
                categories.forEach(cat => {
                    categoryMap.set(cat.catIdx, { ...cat, subCategories: [] });
                });

                categories.forEach(cat => {
                    if (cat.parentIdx !== null && categoryMap.has(cat.parentIdx)) {
                        categoryMap.get(cat.parentIdx).subCategories.push(cat);
                    }
                });

                // 대분류 먼저 추가
                const mainCategories = Array.from(categoryMap.values()).filter(cat => cat.parentIdx === null);
                
                mainCategories.forEach(mainCat => {
                    const mainRow = document.createElement('tr');
                    mainRow.dataset.catIdx = mainCat.catIdx; // 대분류의 catIdx 저장

                    mainRow.innerHTML = `
                        <td><input type="checkbox" class="category-checkbox" data-cat-idx="${mainCat.catIdx}" /></td>
                        <td><input type="text" value="${mainCat.catNm}" readonly /></td>
                        <td><input type="text" value="${mainCat.catCd}" readonly /></td>
                        <td><input type="text" value="${mainCat.reMark || ''}" readonly /></td>
                        <td class="subcategory-column">
                            <table class="grid-table">
                                <thead>
                                    <tr>
                                        <th>소분류명</th>
                                        <th>소분류코드</th>
                                        <th>비고</th>
                                        <th>삭제</th>
                                    </tr>
                                </thead>
                                <tbody class="subcategory-tbody" data-parent-idx="${mainCat.catIdx}">
                                    </tbody>
                            </table>
                        </td>
                        <td><button type="button" onclick="removeCategoryRow(this)" class="delete-btn-in-table">삭제</button></td>
                    `;
                    categoryTbody.appendChild(mainRow);

                    // 소분류 추가
                    const subcategoryTbody = mainRow.querySelector('.subcategory-tbody');
                    mainCat.subCategories.forEach(subCat => {
                        const subRow = document.createElement('tr');
                        subRow.dataset.catIdx = subCat.catIdx; // 소분류의 catIdx 저장
                        subRow.innerHTML = `
                            <td><input type="text" value="${subCat.catNm}" readonly /></td>
                            <td><input type="text" value="${subCat.catCd}" readonly /></td>
                            <td><input type="text" value="${subCat.reMark || ''}" readonly /></td>
                            <td><button type="button" onclick="removeSubCategoryRow(this)" class="delete-btn-in-table">삭제</button></td>
                        `;
                        subcategoryTbody.appendChild(subRow);
                    });
                });

            } catch (error) {
                console.error('카테고리 정보를 가져오는 중 오류 발생:', error);
                categoryTbody.innerHTML = '<tr><td colspan="6" class="no-data">카테고리 데이터를 불러오는 데 실패했습니다.</td></tr>';
            }
        }

        // 대분류 추가 함수
        async function addCategoryRow() {
            const categoryNameInput = document.getElementById('new-category-name');
            const categoryCodeInput = document.getElementById('new-category-code');
            const categoryMemoInput = document.getElementById('new-category-memo');

            const catNm = categoryNameInput.value.trim();
            const catCd = categoryCodeInput.value.trim();
            const reMark = categoryMemoInput.value.trim();

            if (!catNm || !catCd) {
                alert('대분류명과 분류코드는 필수 입력 항목입니다.');
                return;
            }

            const newCategory = {
                catNm: catNm,
                catCd: catCd,
                parentIdx: null, // 대분류는 parentIdx가 null
                reMark: reMark
            };

            try {
                const response = await fetch('/api/category/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newCategory),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `서버 오류 발생: ${response.status}`);
                }

                alert('대분류가 성공적으로 추가되었습니다!');
                categoryNameInput.value = '';
                categoryCodeInput.value = '';
                categoryMemoInput.value = '';
                loadCategories(); // 목록 새로고침
            } catch (error) {
                console.error('대분류 추가 중 오류 발생:', error);
                alert('대분류 추가 실패: ' + error.message);
            }
        }

        // 소분류 추가 함수
        async function addSubCategoryToChecked() {
            const subCategoryNameInput = document.getElementById('new-subcategory-name');
            const subCategoryCodeInput = document.getElementById('new-subcategory-code');
            const subCategoryMemoInput = document.getElementById('new-subcategory-memo');

            const catNm = subCategoryNameInput.value.trim();
            const catCd = subCategoryCodeInput.value.trim();
            const reMark = subCategoryMemoInput.value.trim();

            if (!catNm || !catCd) {
                alert('소분류명과 소분류코드는 필수 입력 항목입니다.');
                return;
            }

            const checkedCheckboxes = document.querySelectorAll('.category-checkbox:checked');

            if (checkedCheckboxes.length === 0) {
                alert('소분류를 추가할 대분류를 하나 선택해주세요.');
                return;
            }
            if (checkedCheckboxes.length > 1) {
                alert('소분류는 하나의 대분류에만 추가할 수 있습니다. 하나의 대분류만 선택해주세요.');
                return;
            }

            const parentIdx = checkedCheckboxes[0].dataset.catIdx; // 대분류의 catIdx

            const newSubCategory = {
                catNm: catNm,
                catCd: catCd,
                parentIdx: parseInt(parentIdx), // 소분류는 parentIdx를 가짐
                reMark: reMark
            };

            try {
                const response = await fetch('/api/category/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newSubCategory),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `서버 오류 발생: ${response.status}`);
                }

                alert('소분류가 성공적으로 추가되었습니다!');
                subCategoryNameInput.value = '';
                subCategoryCodeInput.value = '';
                subCategoryMemoInput.value = '';
                loadCategories(); // 목록 새로고침
            } catch (error) {
                console.error('소분류 추가 중 오류 발생:', error);
                alert('소분류 추가 실패: ' + error.message);
            }
        }

        // 대분류 삭제 함수
        async function removeCategoryRow(buttonElement) {
            const row = buttonElement.closest('tr');
            const catIdx = row.dataset.catIdx;

            if (!confirm('정말로 이 대분류와 모든 소분류를 삭제하시겠습니까?')) {
                return;
            }

            try {
                const response = await fetch(`/api/category/delete/${catIdx}`, {
                    method: 'DELETE',
                });

                if (response.status === 204) { // No Content
                    alert('카테고리가 성공적으로 삭제되었습니다.');
                    loadCategories();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `서버 오류 발생: ${response.status}`);
                }
            } catch (error) {
                console.error('카테고리 삭제 중 오류 발생:', error);
                alert('카테고리 삭제 실패: ' + error.message);
            }
        }

        // 소분류 삭제 함수
        async function removeSubCategoryRow(buttonElement) {
            const row = buttonElement.closest('tr');
            const catIdx = row.dataset.catIdx;

            if (!confirm('정말로 이 소분류를 삭제하시겠습니까?')) {
                return;
            }

            try {
                const response = await fetch(`/api/category/delete/${catIdx}`, {
                    method: 'DELETE',
                });

                if (response.status === 204) { // No Content
                    alert('소분류가 성공적으로 삭제되었습니다.');
                    loadCategories();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `서버 오류 발생: ${response.status}`);
                }
            } catch (error) {
                console.error('소분류 삭제 중 오류 발생:', error);
                alert('소분류 삭제 실패: ' + error.message);
            }
        }