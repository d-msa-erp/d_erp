package kr.co.d_erp.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "VW_MRP_LACK_VIEW")
public class MrpLackView {
    @Id
    @Column(name = "MATERIAL_ITEM_IDX")
    private Long materialItemIdx;

    @Column(name = "MATERIAL_ITEM_CD")
    private String materialItemCd;

    @Column(name = "MATERIAL_ITEM_NM")
    private String materialItemNm;

    @Column(name = "REQUIRED_QTY")
    private Long requiredQty;

    @Column(name = "MATERIAL_STOCK_QTY")
    private Long materialStockQty;

    @Column(name = "MATERIAL_OPTIMAL_INV")
    private Long materialOptimalInv;
    
    @Column(name = "ITEM_COST")
    private Long itemCost;
}
