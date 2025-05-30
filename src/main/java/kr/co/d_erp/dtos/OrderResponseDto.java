package kr.co.d_erp.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponseDto {
	private Long orderIdx;
    private String orderCode;
    private boolean productShortage;   // 재고 부족 여부
    private boolean materialShortage;  // 자재 부족 여부
    private List<String> warnings;
}
