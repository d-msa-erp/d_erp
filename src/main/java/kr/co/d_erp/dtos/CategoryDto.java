package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
	private Integer catIdx;
	private String catCd;
	private String catNm;
	private Integer parentIdx;
	private String reMark;
    
	
}
