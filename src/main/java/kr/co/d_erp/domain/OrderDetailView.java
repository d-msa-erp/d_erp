package kr.co.d_erp.domain;

import java.time.LocalDateTime;

import com.mongodb.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.ToString;

@Entity
@Table(name = "VW_ORDER_DETAILS")
@Immutable
@Getter
@ToString
public class OrderDetailView {

    @Id
    @Column(name = "order_idx")
    private Long orderIdx;
    
    @Column(name = "order_qty")
    private Long orderQty;

    @Column(name = "order_code")
    private String orderCode;

    @Column(name = "order_date")
    private LocalDateTime orderDate; 

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @Column(name = "remark")
    private String remark;
    
    @Column(name = "item_cd")
    private String itemCode;
   
    @Column(name = "item_idx")
    private String itemIdx;
    
    @Column(name = "unit_price")
    private Long unitPrice;
    
    @Column(name = "customer_name")
    private String customerName;
    
    @Column(name = "customer_idx")
    private String customerIdx;

    @Column(name = "item_name")
    private String itemName;
    
    @Column(name = "cycle_time")
    private String cycleTime;
    
    @Column(name = "wh_nm")
    private String whNm;
    
    @Column(name = "wh_idx")
    private String whIdx;
    
    @Column(name = "manager_name")
    private String managerName;

    @Column(name = "manager_tel")
    private String managerTel;
}
