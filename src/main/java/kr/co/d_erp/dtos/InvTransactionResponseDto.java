package kr.co.d_erp.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data // @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor 등을 포함
@NoArgsConstructor
@AllArgsConstructor
public class InvTransactionResponseDto {
 private Long invTransIdx;
 private String invTransCode;
 private String message; // 이 필드가 있어야 setMessage가 생성됩니다.
}