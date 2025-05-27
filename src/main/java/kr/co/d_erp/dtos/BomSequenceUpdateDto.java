package kr.co.d_erp.dtos;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class BomSequenceUpdateDto {
    private Long subItemIdx; // 순서를 변경할 하위 품목의 IDX
    private Integer newSeqNo;  // 새롭게 부여할 순서 번호
}