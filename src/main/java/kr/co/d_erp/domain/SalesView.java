package kr.co.d_erp.domain;

import java.time.LocalDate;

import com.mongodb.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.ToString;

@Entity
@Immutable // 읽기 전용 설정 (Hibernate-specific)
@Table(name = "SALES_VIEW")
@Getter
@ToString
public class SalesView {
	
    @Id
    @Column(name = "ORDER_IDX")
    private String orderIdx;
    
    @Column(name = "주문번호")
    private String orderCode;

    @Column(name = "품명")
    private String itemName;

    @Column(name = "품목코드")
    private String itemCode;

    @Column(name = "수량")
    private Integer quantity;

    @Column(name = "고객사")
    private String customerName;

    @Column(name = "납기일")
    private LocalDate deliveryDate;
    
    @Column(name = "발주일")
    private LocalDate orderDate;
    
    @Column(name = "총액")
    private Long totalPrice;
    
    @Column(name = "담당자명")
    private String userName;
    
    @Column(name = "상태")
    private String orderStatus;
    
    @Column(name = "주문구분")
    private String orderType;
}
