package kr.co.d_erp.dtos;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Table(name= "TB_ITEMMST")
@Getter
@Setter
public class ItemDto {
	@Id // 기본 키
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "item_seq") // 시퀀스 사용
    @SequenceGenerator(name = "item_seq", sequenceName = "ISEQ$$_74438", allocationSize = 1) // Oracle 시퀀스명
    @Column(name = "ITEM_IDX")
    private Long itemIdx;

    @Column(name = "ITEM_CD", unique = true, nullable = false) // 품목코드, 유니크하고 필수
    private String itemCd;

    @Column(name = "ITEM_NM", nullable = false)
    private String itemNm;

    @Column(name = "ITEM_FLAG")
    private String itemFlag;

    @Column(name = "ITEM_SPEC")
    private String itemSpec;

    @Column(name = "REMARK")
    private String remark;

    @Column(name = "OPTIMAL_INV")
    private Long optimalInv;

    @Column(name = "ITEM_COST")
    private Double itemCost; // Double 타입

	
	  // 연관 관계 매핑
	  
	  @ManyToOne(fetch = FetchType.LAZY) // 지연 로딩 
	  @JoinColumn(name = "CUST_IDX", referencedColumnName = "CUST_IDX") //TB_CUSTMST의 CUST_IDX와 조인 
	  private CustomerForItemDto CustomerForItemDto; // 거래처 엔티티 (아래에 정의 필요)
	 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_CAT1", referencedColumnName = "CAT_IDX") // 대분류 엔티티
    private CatDto CatDto1; // ItemCategory 엔티티 (아래에 정의 필요)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_CAT2", referencedColumnName = "CAT_IDX") // 소분류 엔티티
    private CatDto CatDto2; // ItemCategory 엔티티

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_UNIT", referencedColumnName = "UNIT_IDX") // 단위 엔티티
    private UnitForItemDto UnitForItemDto; // Unit 엔티티 (아래에 정의 필요)

    @OneToOne(mappedBy = "itemDto", fetch = FetchType.LAZY)
    private InvenDto InvenDto; // Inventory 엔티티 (아래에 정의 필요)
	
}
