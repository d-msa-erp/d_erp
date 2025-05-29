package kr.co.d_erp.dtos; // 실제 프로젝트에 맞게 패키지 경로 조정

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitDto {
    private Integer unitIdx; 
    private String unitNm;   
    // 추가용 생성자
    public UnitDto(String unitNm) {
        this.unitNm = unitNm;
    }
 
    //희원 > Builder 어노테이션 추
}