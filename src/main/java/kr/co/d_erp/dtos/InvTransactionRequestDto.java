package kr.co.d_erp.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 입/출고 거래 생성 및 수정을 위한 요청 데이터를 담는 DTO 클래스 각 필드에 유효성 검사 적용
 */
@Data
public class InvTransactionRequestDto {

	// private Long invTransIdx; // 입/출고 거래의 기본 키(ID) 자동증가값

	private String invTransCode; // 입/출고 거래 코드. 신규 등록 시 이 값을 비워두거나 특정 값(예: "자동 생성")으로 보내면 트리거 발동

	@NotBlank(message = "거래 유형은 필수입니다.")
	private String transType; // 거래 유형 'R'(입고) 또는 'S'(출고)

	private Long orderIdx; // 관련 주문/발주 고유 번호(ID)

	@NotNull(message = "창고는 필수입니다.")
	private Long whIdx; // 거래가 발생하는 창고의 고유 번호(ID)

	@NotNull(message = "거래일자는 필수입니다.")
	private LocalDate transDate; // 거래 발생일 (입고일 또는 출고일)

	@NotNull(message = "거래 수량은 필수입니다.")
	@Positive(message = "거래 수량은 0보다 커야 합니다.")
	private BigDecimal transQty; // 거래 수량 (입고 또는 출고 수량)

	@NotNull(message = "단가는 필수입니다.")
	@PositiveOrZero(message = "단가는 0 이상이어야 합니다.")
	private BigDecimal unitPrice; // 거래 단가

	@NotBlank(message = "거래 상태는 필수입니다.")
	private String transStatus; // 거래의 진행 상태를 나타내는 코드

	private Long userIdx; // 해당 거래를 처리하거나 담당하는 사원의 고유 번호(ID)

	@NotNull(message = "품목은 필수입니다.")
	private Long itemIdx; // 거래되는 품목의 고유 번호(ID)

	private Long custIdx; // 거래처의 고유 번호(ID). 입고 시 매입처, 출고 시 매출처

	private String remark; // 비고
}