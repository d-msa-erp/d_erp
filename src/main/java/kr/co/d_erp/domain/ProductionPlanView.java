package kr.co.d_erp.domain;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDate;

@Entity
@Table(name = "VW_PRODUCTION_PLAN")
@Getter
public class ProductionPlanView {

    @Id
    @Column(name = "ORDER_IDX")
    private Long orderIdx;

    @Column(name = "ORDER_CODE")
    private String orderCode;

    @Column(name = "ITEM_NM")
    private String itemNm;

    @Column(name = "ITEM_CD")
    private String itemCd;

    @Column(name = "ORDER_QTY")
    private Integer orderQty;

    @Column(name = "ORDER_DATE")
    private LocalDate orderDate;

    @Column(name = "DELIVERY_DATE")
    private LocalDate deliveryDate;

    @Column(name = "CUST_NM")
    private String custNm;
    
    @Column(name = "CUST_IDX")
    private String custIdx;

    @Column(name = "ITEM_IDX")
    private Long itemIdx;

    @Column(name = "UNIT_PRICE")
    private Integer unitPrice;

    @Column(name = "TOTAL_AMOUNT")
    private Integer totalAmount;
    
    @Column(name = "STOCK_QTY")
    private Long stockQty;

    @Column(name = "REMARK")
    private String remark;
    
    @Column(name = "WH_IDX")
    private String whIdx;
}
