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
    private List<String> warnings;
}
