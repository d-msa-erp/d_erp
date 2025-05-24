package kr.co.d_erp.dtos;

import lombok.Getter;

@Getter
public class CustomerDTO {
	private Long custIdx;
	private String custNm;

	public CustomerDTO(Long custIdx, String custNm) {
        this.custIdx = custIdx;
        this.custNm = custNm;
     }
		
}
