package kr.co.d_erp.dtos;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Builder
public class CustomerDTO {
	private Long custIdx;
	private String custNm;

	public CustomerDTO(Long custIdx, String custNm) {
        this.custIdx = custIdx;
        this.custNm = custNm;
     }

	//희원 > builder 어노테이션 추가
}
