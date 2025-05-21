package kr.co.d_erp.dtos;

import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor; 

//창고 담당자 셀렉트에 사용 
@Getter
@Setter
@AllArgsConstructor
public class UserSelectDto {
    private Long userIdx;
    private String userId; 
    private String userNm;

}