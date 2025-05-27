package kr.co.d_erp.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvTransactionResponseDto {
	private Long invTransIdx;
	private String invTransCode;
	private String message; 
}