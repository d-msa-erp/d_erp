/**
 * 선택된 사원 항목들의 상세 정보를 가져와 새 창에서 인쇄합니다.
 */
async function printSelectedEmployeeDetails() {

	    // #userTableBody 내의 체크된 개별 사원 체크박스 선택
    const checkedCheckboxes = document.querySelectorAll('#userTableBody input[type="checkbox"]:checked');
    if (checkedCheckboxes.length === 0) {
        alert("인쇄할 사원을 먼저 선택해주세요.");
        return;
    }

    // 각 체크박스의 data-user-idx 속성에서 사원 ID를 추출
    const selectedUserIds = Array.from(checkedCheckboxes).map(cb => cb.dataset.userIdx);

    let printContents = `
        <html>
        <head>
            <title>사원 상세 정보 인쇄</title>
            <style>
                body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
                .employee-container { page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; border-radius: 5px; background-color: #fff; }
                .employee-container h2 { font-size: 16pt; margin-top: 0; margin-bottom: 15px; color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; }
                .employee-info { margin-bottom: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; }
                .employee-info p { margin: 6px 0; font-size: 10.5pt; display: flex; align-items: center; }
                .employee-info strong { display: inline-block; width: 100px; color: #555; font-weight: bold; flex-shrink: 0; }
                .role-dept-section { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #bbb; }
                .role-dept-section h3 { font-size: 13pt; margin-bottom: 10px; color: #283593; }
                .role-dept-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 15px; }
                .status-info { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #bbb; }
                .status-info h3 { font-size: 13pt; margin-bottom: 10px; color: #283593; }
                .status-active { color: #2e7d32; font-weight: bold; }
                .status-inactive { color: #d32f2f; font-weight: bold; }
                .status-suspended { color: #ff8f00; font-weight: bold; }
                .no-data { font-style: italic; color: #777; }
                @media print {
                    body { margin: 0; }
                    .employee-container { border: none; box-shadow: none; margin-bottom: 20mm; }
                    h1.print-main-title { display: block !important; font-size: 20pt; text-align: center; margin-bottom: 25px; }
                }
                h1.print-main-title { display: none; }
            </style>
        </head>
        <body>
            <h1 class="print-main-title">선택된 사원 상세 정보</h1>
    `;

    try {
        const employeeDetailsPromises = selectedUserIds.map(async id => {
            try {
                // 사원 상세 정보 API 호출
                const employeeResponse = await fetch(`/api/users/${id}`);
                if (!employeeResponse.ok) {
                    return { id, error: true, statusText: employeeResponse.statusText, status: employeeResponse.status };
                }
                const employeeData = await employeeResponse.json();
                return employeeData;

            } catch (err) {
                return { id, error: true, statusText: err.message || "네트워크 오류", status: "FetchError" };
            }
        });

        const results = await Promise.all(employeeDetailsPromises);

        results.forEach(employeeData => {
            if (!employeeData || employeeData.error) {
                printContents += `
                    <div class="employee-container">
                        <h2>사원 ID: ${employeeData.id || '알 수 없음'}</h2>
                        <p style="color:red;">이 사원의 상세 정보를 불러오는 데 실패했습니다. (오류: ${employeeData.statusText || '데이터 없음'})</p>
                    </div>`;
                return;
            }

            // 권한 타입 변환
            const getRoleName = (roleCode) => {
                const roles = {
                    '01': '시스템관리자',
                    '02': '대표',
                    '03': '영업 담당자',
                    '04': '구매 담당자',
                    '05': '생산 관리자',
                    '06': '재고 관리자',
                    '07': '인사 담당자'
                };
                return roles[roleCode] || roleCode || 'N/A';
            };

            // 재직 상태 변환 및 스타일 클래스
            const getStatusInfo = (statusCode) => {
                const statuses = {
                    '01': { name: '재직중', class: 'status-active' },
                    '02': { name: '퇴사', class: 'status-inactive' },
                    '03': { name: '휴직', class: 'status-suspended' },
                    '04': { name: '대기', class: 'status-suspended' },
                    '05': { name: '정직', class: 'status-suspended' }
                };
                return statuses[statusCode] || { name: statusCode || 'N/A', class: '' };
            };

            const statusInfo = getStatusInfo(employeeData.userStatus);

            // 날짜 포맷팅
            const formatDate = (dateString) => {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('ko-KR');
                } catch (e) {
                    return dateString;
                }
            };

            printContents += `<div class="employee-container">`;
            printContents += `<h2>${employeeData.userNm || 'N/A'} (ID: ${employeeData.userId || 'N/A'})</h2>`;
            
            printContents += `<div class="employee-info">`;
            printContents += `<p><strong>이메일:</strong> ${employeeData.userEmail || 'N/A'}</p>`;
            printContents += `<p><strong>직통번호:</strong> ${employeeData.userTel || 'N/A'}</p>`;
            printContents += `<p><strong>휴대폰:</strong> ${employeeData.userHp || 'N/A'}</p>`;
            printContents += `<p><strong>입사일:</strong> ${formatDate(employeeData.hireDt)}</p>`;
            if (employeeData.retireDt) {
                printContents += `<p><strong>퇴사일:</strong> ${formatDate(employeeData.retireDt)}</p>`;
            }
            printContents += `</div>`;

            printContents += `<div class="role-dept-section">`;
            printContents += `<h3>조직 및 권한 정보</h3>`;
            printContents += `<div class="role-dept-info">`;
            printContents += `<p><strong>부서:</strong> ${employeeData.userDept || 'N/A'}</p>`;
            printContents += `<p><strong>직책:</strong> ${employeeData.userPosition || 'N/A'}</p>`;
            printContents += `<p><strong>권한:</strong> ${getRoleName(employeeData.userRole)}</p>`;
            printContents += `</div>`;
            printContents += `</div>`;

            printContents += `<div class="status-info">`;
            printContents += `<h3>재직 상태</h3>`;
            printContents += `<p><strong>현재 상태:</strong> <span class="${statusInfo.class}">${statusInfo.name}</span></p>`;
            printContents += `</div>`;

            printContents += `</div>`;
        });

    } catch (error) {
        printContents += `<div class="employee-container"><p style="color:red;">선택된 사원 정보를 처리하는 중 예기치 않은 오류가 발생했습니다: ${error.message}</p></div>`;
    }

    printContents += `</body></html>`;

    const printWindow = window.open('', '_blank', 'height=700,width=900,scrollbars=yes');
    if (printWindow) {
        printWindow.document.write(printContents);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (e) {
                printWindow.alert("인쇄 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
            }
        }, 700);
    } else {
        alert("팝업 차단 기능이 활성화되어 있으면 인쇄 창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인해주세요.");
    }
}