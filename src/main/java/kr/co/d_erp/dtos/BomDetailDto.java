package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 프론트엔드로 전송할 BOM 상세 정보 DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BomDetailDto {

    // HTML 테이블의 '품목코드' 컬럼
    private String sItemCd;

    // HTML 테이블의 '품목명' 컬럼
    private String sItemNm;

    // HTML 테이블의 '고객사' 컬럼
    private String custNm;

    // HTML 테이블의 '대분류' 컬럼
    private String catNm;

    // HTML 테이블의 '단위' 컬럼
    private String unitNm;

    // HTML 테이블의 '단가' 컬럼
    private Double itemPrice; // Entity의 타입과 일치시킵니다.

    // 기본 생성자, 모든 필드 생성자, getter, setter 필요
    // Lombok으로 대체
}