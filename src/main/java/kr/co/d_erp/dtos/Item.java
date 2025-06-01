package kr.co.d_erp.dtos;


import lombok.AllArgsConstructor;


import java.math.BigDecimal;


import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class Item {
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
        private Long custIdx;
        private Long itemCat1Id; // 대분류 ID
        private Long itemCat2Id; // 소분류 ID
        private Long itemUnitId; // 단위 ID
        private Long optimalInv; // 적정 재고
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
        private Long custIdx;
        private Long itemCat1Id;
        private Long itemCat2Id;
        private Long itemUnitId;
        private Long optimalInv;
        private Double itemCost;
    }

    // 응답 DTO
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long itemIdx;
        private String itemCd;
        private String itemNm;
        private String itemFlag;
        private String itemSpec;
        private String remark;
        private Long optimalInv;
        private Double itemCost;
        private Long qty; // 현재고량

        private Long custIdx;
        private String custNm; // 거래처명

        private Long itemCat1Id;
        private String itemCat1Nm; // 대분류명

        private Long itemCat2Id;
        private String itemCat2Nm; // 소분류명

        private Long itemUnitId;
        private String unitNm;     // 단위명
        private BigDecimal cycleTime; // cycleTime 필드 추가
    }

	private Long ITEM_IDX, ITEM_CAT1, ITEM_CAT2, ITEM_UNIT, OPTIMAL_INV, QTY;
	private String ITEM_CD,ITEM_NM, ITEM_FLAG, ITEM_SPEC, REMARK, UNIT_NM;
	private String CAT_NM,ITEM_CATX1,ITEM_CATX2,CUST_NM;
	private Long PARENT_IDX, CUST_IDX, CAT_IDX, UNIT_IDX;
//	private Long CYCLE_TIME; // cycleTime 필요해서 Long > Long으로 변경했습니다 문제 생기면 삭제해주세요. -민섭
	private BigDecimal CYCLE_TIME; 
	private Double ITEM_COST; // Long > Double로 변경했습니다 문제 생기면 삭제해주세요. -민섭
	
}
