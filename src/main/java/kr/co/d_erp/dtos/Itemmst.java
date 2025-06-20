package kr.co.d_erp.dtos;

import java.math.BigDecimal;

import java.util.ArrayList;

import java.util.List;

import jakarta.persistence.*;
import lombok.*;
// import java.time.LocalDateTime; // 기존 필드 유지 시 필요
// import java.math.BigDecimal; // 기존 숫자 필드 유지 시 필요

@Entity
@Table(name = "TB_ITEMMST")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // 모든 필드 생성자가 필요하다면 유지
@Builder // Builder 패턴 사용 시 유지
public class Itemmst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)   
    @Column(name = "ITEM_IDX", nullable = false)
    private Long itemIdx;

    @Column(name = "ITEM_CD", unique = true, length = 10, nullable = false) // DDL 기준 length 10
    private String itemCd;

    @Column(name = "ITEM_NM", length = 100, nullable = false)
    private String itemNm;


    @Column(name = "ITEM_FLAG", nullable = false)
    private String itemFlag; 
    
    @Column(name = "ITEM_SPEC", length = 100)
    private String itemSpec;

    @Column(name = "ITEM_COST", nullable = false) // DDL 기준 NOT NULL
    private Double itemCost; // DDL은 NUMBER. Double 또는 BigDecimal 사용.

    @Column(name = "REMARK", length = 100) // DDL 기준 length 100
    private String remark;

    @Column(name = "OPTIMAL_INV")
    private Long optimalInv;

	  @ManyToOne(fetch = FetchType.LAZY) // 지연 로딩 
	  @JoinColumn(name = "CUST_IDX", referencedColumnName = "CUST_IDX") //TB_CUSTMST의 CUST_IDX와 조인 
	  private CustomerForItemDto CustomerForItemDto; // 거래처 엔티티 (아래에 정의 필요)
	  
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "ITEM_UNIT", referencedColumnName = "UNIT_IDX") // 단위 엔티티
	    private UnitForItemDto UnitForItemDto; // Unit 엔티티 (아래에 정의 필요)
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "ITEM_CAT1", referencedColumnName = "CAT_IDX") // 대분류 엔티티
	    private CatDto CatDto1; // ItemCategory 엔티티 (아래에 정의 필요)

	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "ITEM_CAT2", referencedColumnName = "CAT_IDX") // 소분류 엔티티
	    private CatDto CatDto2; // ItemCategory 엔티티
	    
	    @OneToMany(mappedBy = "item", fetch = FetchType.LAZY) // OneToOne >> OneToMany 변경 -민섭
	    // private InvenDto InvenDto // 원래 코드
	    private List<InvenDto> InvenDto;// Inventory 엔티티 (아래에 정의 필요) 
/*
	    @OneToMany(mappedBy = "item", fetch = FetchType.LAZY) // OneToOne -> OneToMany
	    private List<InvenDto> invenDtos = new ArrayList<>();
	    */
    //추가 선익
    @Column(name = "CYCLE_TIME", precision = 10, scale = 4)
    private BigDecimal cycleTime; 

    
}