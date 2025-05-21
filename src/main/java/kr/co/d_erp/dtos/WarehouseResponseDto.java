package kr.co.d_erp.dtos;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponseDto {
 private Long whIdx;
 private String whCd;
 private String whNm;
 private String remark;
 private String whType1;
 private String whType2;
 private String whType3;
 private String useFlag;
 private String whLocation;
 private Long whUserIdx;
 private String whUserNm; // 뷰에서 가져올 담당자 이름
 private String whUserId; // 뷰에서 가져올 담당자 ID
}