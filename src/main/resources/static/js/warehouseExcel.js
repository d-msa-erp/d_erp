// /js/warehouseExcel.js
console.log("[Excel] warehouseExcel.js 로드 확인");

/**
 * 선택된 창고 항목들의 상세 정보를 서버로부터 받아 엑셀 파일로 다운로드합니다.
 */
async function downloadSelectedWarehouseDetailsAsExcel() {
    console.log("[Excel] downloadSelectedWarehouseDetailsAsExcel() 호출됨 - 선택된 창고 상세 정보 엑셀 다운로드 시도.");

    // #warehouseTableBody 내의 체크된 개별 창고 체크박스 선택
    const checkedCheckboxes = document.querySelectorAll('#warehouseTableBody input.warehouse-checkbox:checked');
    if (checkedCheckboxes.length === 0) {
        alert("엑셀로 다운로드할 창고를 먼저 선택해주세요.");
        return;
    }

    // 각 체크박스의 data-wh-idx 속성에서 창고 ID를 추출
    const selectedWarehouseIds = Array.from(checkedCheckboxes).map(cb => cb.dataset.whIdx);
    console.log("[Excel] 선택된 창고 ID:", selectedWarehouseIds);

    try {
        const response = await fetch('/api/warehouses/download-excel-details', { // 창고 전용 API 엔드포인트
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(selectedWarehouseIds), // 선택된 ID 배열을 JSON으로 변환하여 전송
        });

        if (!response.ok) {
            let errorData = { message: `엑셀 파일 생성에 실패했습니다. 상태: ${response.status}` };
            try {
                // 서버에서 JSON 형태의 오류 메시지를 보낼 경우를 대비
                const errorResponse = await response.text();
                try {
                    errorData = JSON.parse(errorResponse);
                } catch (e) {
                    errorData.message = errorResponse; // JSON 파싱 실패 시 텍스트 그대로 사용
                }
            } catch (e) {
                // 오류 응답 본문 처리 중 추가 오류 발생 시
            }
            throw new Error(errorData.message || `서버 오류: ${response.status}`);
        }

        const disposition = response.headers.get('Content-Disposition');
        let filename = 'warehouse_details.xlsx'; // 기본 파일명
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = decodeURIComponent(matches[1].replace(/['"]/g, '').replace(/UTF-8''/i, ''));
            }
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none'; // 화면에 보이지 않도록
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); // 요소 제거
        window.URL.revokeObjectURL(downloadUrl);

        console.log("[Excel] 파일 다운로드 시작:", filename);

    } catch (error) {
        console.error("[Excel] 엑셀 다운로드 중 오류 발생:", error);
        alert(`엑셀 다운로드 오류: ${error.message}`);
    }
}