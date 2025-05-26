package kr.co.d_erp.dtos;

<<<<<<< Updated upstream
=======

import lombok.AllArgsConstructor;


import java.math.BigDecimal;


>>>>>>> Stashed changes
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class Item {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
	private Integer ITEM_IDX, ITEM_CAT1, ITEM_CAT2, ITEM_UNIT, ITEM_COST, OPTIMAL_INV, CYCLE_TIME, QTY;
=======
=======
>>>>>>> Stashed changes
    // 생성 요청 DTO
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest { // 외부 클래스 Item의 맥락 안에서는 ItemCreateRequestDto 보다 간결하게
        private String itemCd;
        private String itemNm;
        private String itemSpec;
        private String remark;
        private String itemFlag;
        private Integer custIdx;
        private Integer itemCat1Id; // 대분류 ID
        private Integer itemCat2Id; // 소분류 ID
        private Integer itemUnitId; // 단위 ID
        private Integer optimalInv; // 적정 재고
        private Double itemCost;   // 단가
    }

    // 수정 요청 DTO
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String itemNm;
        private String itemSpec;
        private String remark;
        private String itemFlag;
        private Integer custIdx;
        private Integer itemCat1Id;
        private Integer itemCat2Id;
        private Integer itemUnitId;
        private Integer optimalInv;
        private Double itemCost;
    }

    // 응답 DTO
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Integer itemIdx;
        private String itemCd;
        private String itemNm;
        private String itemFlag;
        private String itemSpec;
        private String remark;
        private Integer optimalInv;
        private Double itemCost;
        private Integer qty; // 현재고량

        private Integer custIdx;
        private String custNm; // 거래처명

        private Integer itemCat1Id;
        private String itemCat1Nm; // 대분류명

        private Integer itemCat2Id;
        private String itemCat2Nm; // 소분류명

        private Integer itemUnitId;
        private String unitNm;     // 단위명
    }

	private Integer ITEM_IDX, ITEM_CAT1, ITEM_CAT2, ITEM_UNIT, OPTIMAL_INV, QTY;
>>>>>>> Stashed changes
	private String ITEM_CD,ITEM_NM, ITEM_FLAG, ITEM_SPEC, REMARK, UNIT_NM;
	private String CAT_NM,ITEM_CATX1,ITEM_CATX2,CUST_NM;
	private Integer PARENT_IDX, CUST_IDX, CAT_IDX, UNIT_IDX;
	private long USERIDX;
	
}
