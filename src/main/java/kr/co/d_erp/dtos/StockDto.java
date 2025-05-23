package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockDto {
	
	// 품목 정보
	private String itemCd;			//품목 코드
	private String itemNm;			//품목명
	private Integer itemCost;		//단가
	private Integer optimalInv;		//적정 재고량
	private Integer stockQty;		//재고량(TB_INVENTORY 참조)
	private Integer itemUnit;		//단위코드(TB_UNIT_MST 참조)
	private Integer itemCust;		//거래처코드(TB_CUSTMST 참조)
	
	
	//담당자 정보
	private String userNm;		//담당자 이름
	private String userTel;		//담당자 연락처(직통)
	private String userMail;	//담당자 이메일
	
	private String reMark;		//비고
	
	//참조
	private String userIdx;		//담당자고유번호
	private String whIdx;		//창고고유번호
	private String itemIdx;		//품목고유번호
	private Integer custIdx;	//거래처고유번호
	private String custNm;		//거래처명
	private Integer unitIdx;	//단위고유번호


}
