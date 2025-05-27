package kr.co.d_erp.dtos;

import java.math.BigDecimal;

public interface BomSummaryProjection {

    Long getItemIdx(); // as itemIdx 와 매칭

    String getPitemCd(); // as pitemCd 와 매칭

    String getPitemNm(); // as pitemNm 와 매칭

    String getCatNm();   // as catNm 와 매칭

    String getPunitNm(); // as punitNm 와 매칭

    BigDecimal getPtotalRawMaterialCost(); // as ptotalRawMaterialCost 와 매칭
    // ★ 주의: 네이티브 쿼리에서 0을 반환하므로, DB 타입이 NUMBER라도
    //   JPA가 BigDecimal로 변환 시도 가능. 안되면 Long 또는 Number로 변경 후 서비스에서 처리.
}