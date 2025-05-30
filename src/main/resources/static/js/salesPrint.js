async function printByIds(ids, fetchUrlFn, columns, title) {
  if (!ids || ids.length === 0) {
    alert("인쇄할 항목을 선택해주세요.");
    return;
  }

  let html = `
  <html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
      .warehouse-container { page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; border-radius: 5px; background-color: #fff; }
      .warehouse-container h2 { font-size: 16pt; margin-top: 0; margin-bottom: 15px; color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; }
      .warehouse-info { margin-bottom: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; }
      .warehouse-info p { margin: 6px 0; font-size: 10.5pt; display: flex; align-items: center; }
      .warehouse-info strong { display: inline-block; width: 80px; color: #555; font-weight: bold; flex-shrink: 0; }
      .stock-title { font-size: 13pt; margin-top: 25px; margin-bottom: 10px; color: #283593; border-bottom: 1px dashed #7986cb; padding-bottom: 5px;}
      .stock-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      .stock-table th, .stock-table td { border: 1px solid #bbb; padding: 8px 10px; text-align: left; vertical-align: top; }
      .stock-table th { background-color: #e8eaf6; font-weight: bold; text-align: center; font-size: 10pt; }
      .stock-table td { font-size: 9.5pt; }
      .stock-table td:nth-child(5) { text-align: right; }
      .stock-table td:nth-child(6) { text-align: center; }
      .no-stock { font-style: italic; color: #777; margin-top:10px; }
      @media print {
        body { margin: 0; }
        .warehouse-container { border: none; box-shadow: none; margin-bottom: 20mm; }
        h1.print-main-title { display: block !important; font-size: 20pt; text-align: center; margin-bottom: 25px; }
      }
      h1.print-main-title { display: none; }
    </style>
  </head>
  <body>
    <h1 class="print-main-title">${title}</h1>
  `;

  const allItems = [];
  const seenOrderCodes = new Set();

  for (const id of ids) {
    const res = await fetch(fetchUrlFn(id));
    if (!res.ok) continue;

    const items = await res.json();
    if (items && items.length > 0) {
      allItems.push(...items);
    }
	
  }

  // ✅ 주문코드(orderCode) 기준으로 그룹핑
  const grouped = allItems.reduce((acc, item) => {
    const key = item.orderCode;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  
  

  for (const orderCode in grouped) {
    const orderItems = grouped[orderCode];
    const first = orderItems[0];

    html += `<div class="warehouse-container">
      <h2>주문번호: ${first.orderCode}</h2>
      <div class="warehouse-info">
        <p><strong>담당자:</strong> ${first.userName}</p>
        <p><strong>거래처:</strong> ${first.customerName}</p>
        <p><strong>착수일:</strong> ${first.orderDate}</p>
        <p><strong>납기일:</strong> ${first.deliveryDate}</p>
        <p><strong>총액:</strong> ${first.totalPrice}</p>
        <p><strong>상태:</strong> ${first.orderStatus === 'S1' ? '출고 대기' :
								  first.orderStatus === 'S2' ? '출고 완료' :
								  first.orderStatus === 'P1' ? '입고 대기' :
								  first.orderStatus === 'P3' ? '입고 완료' :
								  first.orderStatus}</p>
      </div>
      <div class="stock-title">주문 상세</div>
      <table class="stock-table">
        <thead><tr>`;

    for (const col of columns) {
      html += `<th>${col.label}</th>`;
    }

    html += `</tr></thead><tbody>`;

    // ✅ 여기서 중복 제거
    const uniqueItems = Array.from(new Map(orderItems.map(item => {
      const key = `${item.orderCode}-${item.itemName}-${item.deliveryDate}`;
      return [key, item];
    })).values());

    // ✅ 중복 제거된 항목만 출력
    for (const item of uniqueItems) {
      html += '<tr>';
      for (const col of columns) {
        const val = col.render ? col.render(item[col.key], item) : item[col.key] || '';
        html += `<td>${val}</td>`;
      }
      html += '</tr>';
    }

    html += `</tbody></table></div>`;
  }

  html += '</body></html>';

  const printWin = window.open('', '_blank');
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 500);
}
