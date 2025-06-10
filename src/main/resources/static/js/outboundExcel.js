// /js/outboundExcel.js
//console.log("[Excel] outboundExcel.js 로드 확인");

/**
 * 선택된 출고 항목들의 상세 정보를 서버로부터 받아 엑셀 파일로 다운로드합니다.
 */
async function downloadSelectedOutboundDetailsAsExcel() {
    //console.log("[Excel] downloadSelectedOutboundDetailsAsExcel() 호출됨 - 선택된 출고 상세 정보 엑셀 다운로드 시도.");

    const checkedCheckboxes = document.querySelectorAll('#outboundTable tbody input.trans-checkbox:checked');
    if (checkedCheckboxes.length === 0) {
        alert("엑셀로 다운로드할 출고 항목을 먼저 선택해주세요.");
        return;
    }

    // 각 체크박스의 data-inv-trans-idx 속성에서 출고 거래 ID를 추출
    const selectedInvTransIds = Array.from(checkedCheckboxes).map(cb => cb.dataset.invTransIdx);
    //console.log("[Excel] 선택된 출고 거래 ID:", selectedInvTransIds);

    try {
        const response = await fetch('/api/inv-transactions/download-excel-details', { // 입고/출고 공용 API 엔드포인트 사용 가능성
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invTransIds: selectedInvTransIds, transType: 'S' }), // transType 'S' (출고) 명시
        });

        if (!response.ok) {
            let errorData = { message: `엑셀 파일 생성에 실패했습니다. 상태: ${response.status}` };
            try {
                const errorResponse = await response.text();
                try {
                    errorData = JSON.parse(errorResponse);
                } catch (e) {
                    errorData.message = errorResponse;
                }
            } catch (e) {
                // Additional error during processing error response
            }
            throw new Error(errorData.message || `서버 오류: ${response.status}`);
        }

        const disposition = response.headers.get('Content-Disposition');
        let filename = 'outbound_details.xlsx'; // 기본 파일명
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
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        //console.log("[Excel] 파일 다운로드 시작:", filename);

    } catch (error) {
        console.error("[Excel] 엑셀 다운로드 중 오류 발생:", error);
        alert(`엑셀 다운로드 오류: ${error.message}`);
    }
}