package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "VW_ITEM_INVENTORY") // 뷰 이름
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemInventoryView {

    @Id
    @Column(name = "ITEM_IDX")
    private Long itemIdx;

    @Column(name = "ITEM_CD")
    private String itemCd;

    @Column(name = "ITEM_NM")
    private String itemNm;

    @Column(name = "ITEM_FLAG")
    private String itemFlag;

    @Column(name = "ITEM_CAT1")
    private String itemCat1;

    @Column(name = "ITEM_CAT2")
    private String itemCat2;

    @Column(name = "CUST_IDX")
    private Long custIdx;
    
    @Column(name = "CUST_NM")
    private String custNm;

    @Column(name = "ITEM_SPEC")
    private String itemSpec;

    @Column(name = "ITEM_UNIT")
    private String itemUnit;

    @Column(name = "ITEM_COST")
    private Long itemCost;

    @Column(name = "OPTIMAL_INV")
    private Long optimalInv;

    @Column(name = "STOCK_QTY")
    private Long stockQty;

    @Column(name = "CYCLE_TIME")
    private Long cycleTime;

    @Column(name = "REMARK")
    private String remark;

    @Column(name = "WH_NM")
    private String whNm;
    
    @Column(name = "WH_IDX")
    private Long whIdx;
}
