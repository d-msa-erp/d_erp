package kr.co.d_erp.dtos;

import java.time.LocalDate;

import lombok.Data;

@Data
public class OrderDto {
	private String orderCode;
    private String orderType;
    private LocalDate orderDate;
    private Long custIdx;
    private Long itemIdx;
    private Integer orderQty;
    private Long unitPrice;
    private Long totalAmount;
    private LocalDate deliveryDate;
    private String orderStatus;
    private Long expectedWhIdx;
    private Long userIdx;
    private String remark;
}
