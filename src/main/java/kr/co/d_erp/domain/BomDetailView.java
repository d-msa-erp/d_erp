package kr.co.d_erp.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

// VW_BOM_DETAIL_VIEW 뷰와 매핑되는 Entity
@Entity
// 뷰 이름 지정
@Table(name = "VW_BOM_DETAIL_VIEW")
// 복합 Primary Key 클래스 지정
@IdClass(BomDetailViewId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BomDetailView {

    // 복합 Primary Key의 첫 번째 컬럼
    @Id
    @Column(name = "P_ITEM_CD")
    private String pItemCd;

    // 복합 Primary Key의 두 번째 컬럼
    @Id
    @Column(name = "S_ITEM_CD")
    private String sItemCd;

    // 뷰의 다른 컬럼들과 매핑
    @Column(name = "P_ITEM_NM")
    private String pItemNm;

    @Column(name = "S_ITEM_NM")
    private String sItemNm;

    @Column(name = "CUST_NM")
    private String custNm;

    @Column(name = "CAT_NM")
    private String catNm;

    @Column(name = "UNIT_NM")
    private String unitNm;

    @Column(name = "ITEM_PRICE")
    private Double itemPrice; // DECIMAL/NUMERIC 타입에 따라 Double 또는 BigDecimal 사용

    // 기본 생성자, 모든 필드 생성자, getter, setter 필요
    // Lombok으로 대체
}