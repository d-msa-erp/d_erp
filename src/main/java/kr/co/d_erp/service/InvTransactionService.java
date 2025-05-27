package kr.co.d_erp.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import kr.co.d_erp.domain.Order;
import kr.co.d_erp.domain.TbInvTrans;
import kr.co.d_erp.domain.Usermst;
import kr.co.d_erp.domain.VInvTransactionDetails;
import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.InvTransactionSearchCriteria;
import kr.co.d_erp.dtos.PageDto;
import kr.co.d_erp.dtos.VInvTransactionDetailsDto;
import kr.co.d_erp.repository.oracle.CustmstRepository;
import kr.co.d_erp.repository.oracle.ItemmstRepository;
import kr.co.d_erp.repository.oracle.OrderRepository;
import kr.co.d_erp.repository.oracle.TbInvTransRepository;
import kr.co.d_erp.repository.oracle.UsermstRepository;
import kr.co.d_erp.repository.oracle.VInvTransactionDetailsRepository;
import kr.co.d_erp.repository.oracle.WhmstRepository;
import lombok.RequiredArgsConstructor;

/**
 * 입/출고 관련 비즈니스 로직을 처리하는 서비스 클래스
 * 신규 입/출고 등록 시, 요청 DTO에 orderIdx가 제공되면 해당 주문에 연결하고, 
 * orderIdx가 없으면 내부적으로 'I' 또는 'O' 타입의 신규 주문(Order)을 생성하여 연결
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvTransactionService {

	private final TbInvTransRepository tbInvTransRepository;
	private final VInvTransactionDetailsRepository viewRepository;
	private final OrderRepository orderRepository;
	// 아래 Repository들은 Order 또는 TbInvTrans 객체에 연관된 ID를 검증하거나,
	// 실제 객체를 연결해야 할 때 필요합니다. (현재 Order는 ID만 저장하는 필드도 있음)
	private final CustmstRepository custmstRepository;
	private final ItemmstRepository itemmstRepository;
	private final WhmstRepository whmstRepository;
	private final UsermstRepository usermstRepository;
	// private final EntityManager entityManager; // DB 즉시 반영 및 refresh 필요 시 사용

	/**
	 * 신규 입고 또는 출고 거래를 등록합니다. - DTO에 orderIdx가 제공되면: 해당 ID의 기존 주문(Order) 레코드에 이 거래를
	 * 연결합 - DTO에 orderIdx가 없으면: DTO의 transType에 따라 'I'(입고) 또는 'O'(출고) 타입의 새로운
	 * 주문(Order) 레코드를 생성하고, 이 신규 주문에 거래를 연결 후, 재고 트랜잭션(TbInvTrans) 레코드를 생성
	 *
	 * @param requestDto 신규 거래 생성을 위한 요청 데이터 DTO
	 * @return 생성된 재고 트랜잭션 정보(invTransIdx, invTransCode)와 처리 결과 메시지가 담긴 DTO
	 * @throws EntityNotFoundException 관련 엔티티(기존 주문, 창고 등) 조회 실패 시 발생
	 */
	@Transactional // 쓰기 작업이므로 클래스 레벨의 readOnly 설정을 오버라이드
	public InvTransactionResponseDto insertTransaction(InvTransactionRequestDto requestDto) {
		Order orderToLink; // 최종적으로 TbInvTrans에 연결될 Order 객체

		if (requestDto.getOrderIdx() != null && requestDto.getOrderIdx() > 0) {
			// 1-A. orderIdx가 DTO에 제공된 경우: 기존 주문을 찾아 연결
			orderToLink = orderRepository.findById(requestDto.getOrderIdx()).orElseThrow(
					() -> new EntityNotFoundException("요청된 주문 정보를 찾을 수 없습니다. ID: " + requestDto.getOrderIdx()));

		} else {
			// 1-B. orderIdx가 DTO에 제공되지 않은 경우: 새로운 'I' 또는 'O' 타입 주문 생성
			Order newInternalOrder = new Order();
			newInternalOrder.setOrderCode(generateOrderCode(requestDto.getTransType())); // 고유 주문 코드 생성
			newInternalOrder.setOrderType("R".equals(requestDto.getTransType()) ? "I" : "O");
			newInternalOrder
					.setOrderDate(requestDto.getTransDate() != null ? requestDto.getTransDate() : LocalDate.now());

			// Order 엔티티는 custIdx, itemIdx를 Long 타입으로 직접 가짐
			newInternalOrder.setCustIdx(requestDto.getCustIdx()); // DTO의 custIdx가 null이 아니어야 함 (DB 제약조건에 따라)
			newInternalOrder.setItemIdx(requestDto.getItemIdx()); // DTO의 itemIdx가 null이 아니어야 함 (DB 제약조건에 따라)

			if (requestDto.getTransQty() != null) {
				newInternalOrder.setOrderQty(requestDto.getTransQty().intValue());
			} else {
				newInternalOrder.setOrderQty(0); // @NotNull이므로 DTO에서 이미 검증됨
			}
			if (requestDto.getUnitPrice() != null) {
				newInternalOrder.setUnitPrice(requestDto.getUnitPrice().longValue());
			} else {
				newInternalOrder.setUnitPrice(0L); // @NotNull이므로 DTO에서 이미 검증됨
			}
			if (newInternalOrder.getOrderQty() != null && newInternalOrder.getUnitPrice() != null) {
				newInternalOrder
						.setTotalAmount((long) newInternalOrder.getOrderQty() * newInternalOrder.getUnitPrice());
			} else {
				newInternalOrder.setTotalAmount(0L);
			}
			newInternalOrder.setDeliveryDate(newInternalOrder.getOrderDate());
			// 'I'/'O' 타입 주문의 초기 상태 (예: 'I1' - 입고등록, 'O1' - 출고등록)
			// DB의 TB_ORDER.CK_ORDER_STATUS 제약조건에 이 값들이 포함되어야 함
			newInternalOrder.setOrderStatus("R".equals(requestDto.getTransType()) ? "I1" : "O1");

			newInternalOrder.setExpectedWhIdx(requestDto.getWhIdx());
			newInternalOrder.setUserIdx(requestDto.getUserIdx()); // Long ID (null 가능)
			// 자동 생성된 주문임을 나타내는 비고 추가
			String remarkForOrder = "자동 생성된 " + ("I".equals(newInternalOrder.getOrderType()) ? "내부입고" : "내부출고") + "주문";
			if (requestDto.getRemark() != null && !requestDto.getRemark().isEmpty()) {
				remarkForOrder += " (원비고: " + requestDto.getRemark() + ")";
			}
			newInternalOrder.setRemark(remarkForOrder);

			orderToLink = orderRepository.saveAndFlush(newInternalOrder);
		}

		// 2. TB_INV_TRANS 테이블에 실제 재고 변동 레코드 생성
		TbInvTrans invTransaction = new TbInvTrans();
		invTransaction.setTransType(requestDto.getTransType()); // 'R' 또는 'S'
		invTransaction.setTbOrder(orderToLink); // 위에서 준비된 Order 객체 연결

		// TbInvTrans에 설정될 Whmst 및 Usermst 객체는 ID로 조회 후 설정
		Whmst whmstForInvTrans = whmstRepository.findById(requestDto.getWhIdx())
				.orElseThrow(() -> new EntityNotFoundException("창고 정보를 찾을 수 없습니다. ID: " + requestDto.getWhIdx()));
		invTransaction.setWhmst(whmstForInvTrans);

		invTransaction.setTransDate(requestDto.getTransDate() != null ? requestDto.getTransDate() : LocalDate.now());
		invTransaction.setTransQty(requestDto.getTransQty()); // TbInvTrans의 transQty는 BigDecimal

		String invTransStatus = requestDto.getTransStatus();
		if (invTransStatus == null || invTransStatus.isBlank()) { // DTO에서 상태 값이 없으면 기본값 설정
			invTransStatus = "R".equals(requestDto.getTransType()) ? "R1" : "S1";
		}
		invTransaction.setTransStatus(invTransStatus);

		invTransaction.setUnitPrice(requestDto.getUnitPrice()); // TbInvTrans의 unitPrice는 BigDecimal
		if (requestDto.getUserIdx() != null) {
			Usermst usermstForInvTrans = usermstRepository.findById(requestDto.getUserIdx()).orElse(null);
			invTransaction.setUsermst(usermstForInvTrans);
		}
		invTransaction.setRemark(requestDto.getRemark()); // DTO의 원본 비고 사용

		// TbInvTrans 정보 저장 (saveAndFlush로 즉시 DB 반영 및 ID 할당)
		TbInvTrans savedInvTransaction = tbInvTransRepository.saveAndFlush(invTransaction);

		// DB 트리거 등으로 생성된 invTransCode를 포함한 최종 정보를 다시 로드
		TbInvTrans reloadedInvTransaction = tbInvTransRepository.findById(savedInvTransaction.getInvTransIdx())
				.orElseThrow(() -> new EntityNotFoundException(
						"저장된 트랜잭션 데이터 재조회 실패: " + savedInvTransaction.getInvTransIdx()));

		// 응답 메시지 동적 설정
		String message;
		if ("S".equals(reloadedInvTransaction.getTransType())) {
			message = "출고 등록 완료";
		} else if ("R".equals(reloadedInvTransaction.getTransType())) {
			message = "입고 등록 완료";
		} else {
			message = "거래 등록 완료"; // 예외적인 경우
		}

		return new InvTransactionResponseDto(reloadedInvTransaction.getInvTransIdx(),
				reloadedInvTransaction.getInvTransCode(), message);
	}

	// 임시 주문 코드 생성 로직 (실제 운영 환경에서는 DB 시퀀스 또는 더 정교한 채번 규칙 사용 권장)
	private String generateOrderCode(String transType) {
		String prefix = "R".equals(transType) ? "IO-I-" : "IO-O-";
		return prefix + System.currentTimeMillis();
	}

	/**
	 * 기존 입/출고 거래 정보(TB_INV_TRANS)를 수정
	 *
	 * @param invTransIdx 수정할 재고 트랜잭션의 고유 ID
	 * @param requestDto  수정할 내용을 담은 요청 DTO
	 * @return 수정된 재고 트랜잭션 정보 및 결과 메시지가 담긴 DTO
	 * @throws EntityNotFoundException 관련 엔티티 조회 실패 시 발생
	 */
	@Transactional // 쓰기 작업
	public InvTransactionResponseDto updateTransaction(Long invTransIdx, InvTransactionRequestDto requestDto) {
		TbInvTrans existingInvTransaction = tbInvTransRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("수정할 거래 정보를 찾을 수 없습니다. ID: " + invTransIdx));

		// 주문테이블 수정 추가?

		existingInvTransaction.setTransDate(requestDto.getTransDate());
		existingInvTransaction.setTransQty(requestDto.getTransQty());
		existingInvTransaction.setTransStatus(requestDto.getTransStatus());
		existingInvTransaction.setUnitPrice(requestDto.getUnitPrice());
		existingInvTransaction.setRemark(requestDto.getRemark());

		if (requestDto.getWhIdx() != null) {
			Whmst whmst = whmstRepository.findById(requestDto.getWhIdx())
					.orElseThrow(() -> new EntityNotFoundException("창고 정보를 찾을 수 없습니다. ID: " + requestDto.getWhIdx()));
			existingInvTransaction.setWhmst(whmst);
		}
		// UserIdx는 null일 수 있으므로 orElse(null) 처리 유지
		if (requestDto.getUserIdx() != null) {
			Usermst usermst = usermstRepository.findById(requestDto.getUserIdx()).orElse(null);
			existingInvTransaction.setUsermst(usermst);
		} else {
			existingInvTransaction.setUsermst(null); // 명시적으로 null 처리
		}

		TbInvTrans updatedInvTransaction = tbInvTransRepository.save(existingInvTransaction);

		String message;
		if ("S".equals(updatedInvTransaction.getTransType())) {
			message = "출고 정보 수정 완료";
		} else if ("R".equals(updatedInvTransaction.getTransType())) {
			message = "입고 정보 수정 완료";
		} else {
			message = "거래 정보 수정 완료";
		}
		return new InvTransactionResponseDto(updatedInvTransaction.getInvTransIdx(),
				updatedInvTransaction.getInvTransCode(), message);
	}

	/**
	 * 특정 ID의 입/출고 거래를 삭제 (단건 삭제) 이 거래가 'I' 또는 'O' 타입의 자동 생성된 주문과 연결된 경우, 해당 주문도 삭제
	 *
	 * @param invTransIdx 삭제할 재고 트랜잭션의 고유 ID
	 * @throws EntityNotFoundException 해당 ID의 거래 정보가 없을 경우 발생
	 */
	@Transactional // 쓰기 작업
	public void deleteTransactionById(Long invTransIdx) {
		TbInvTrans transaction = tbInvTransRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("삭제할 거래 정보를 찾을 수 없습니다. ID: " + invTransIdx));

		// 연결된 Order 함께 삭제
		Order linkedOrder = transaction.getTbOrder();
		if (linkedOrder != null && ("I".equals(linkedOrder.getOrderType()) || "O".equals(linkedOrder.getOrderType()))) {
			orderRepository.delete(linkedOrder);
		}

		tbInvTransRepository.deleteById(invTransIdx);
	}

	/**
	 * 여러 건의 입/출고 거래를 ID 리스트를 통해 삭제 참고: 각 거래에 연결된 자동 생성 주문('I' 또는 'O' 타입) 함께 삭제
	 *
	 * @param invTransIdxes 삭제할 재고 트랜잭션 ID 리스트
	 */
	@Transactional // 쓰기 작업
	public void deleteTransactions(List<Long> invTransIdxes) {
		if (invTransIdxes == null || invTransIdxes.isEmpty()) {
			return;
		}
		List<TbInvTrans> transactionsToDelete = tbInvTransRepository.findAllById(invTransIdxes);

		for (TbInvTrans transaction : transactionsToDelete) {
			Order linkedOrder = transaction.getTbOrder();
			if (linkedOrder != null
					&& ("I".equals(linkedOrder.getOrderType()) || "O".equals(linkedOrder.getOrderType()))) {
				orderRepository.delete(linkedOrder);
			}
		}

		tbInvTransRepository.deleteAllInBatch(transactionsToDelete);
	}

	// VInvTransactionDetails 엔티티를 VInvTransactionDetailsDto로 변환 (조회용)
	private VInvTransactionDetailsDto convertToDto(VInvTransactionDetails entity) {
		VInvTransactionDetailsDto dto = new VInvTransactionDetailsDto();
		dto.setInvTransIdx(entity.getInvTransIdx());
		dto.setInvTransCode(entity.getInvTransCode());
		dto.setTransType(entity.getTransType());
		dto.setTransDate(entity.getTransDate());
		dto.setTransQty(entity.getTransQty());
		dto.setUnitPrice(entity.getUnitPrice());
		dto.setTransStatus(entity.getTransStatus());
		dto.setInvTransRemark(entity.getInvTransRemark());
		dto.setOrderIdx(entity.getOrderIdx());
		dto.setWhIdx(entity.getWhIdx());
		dto.setWarehouseCode(entity.getWarehouseCode());
		dto.setWhNm(entity.getWhNm());
		dto.setUserIdx(entity.getUserIdx());
		dto.setEmployeeId(entity.getEmployeeId());
		dto.setUserNm(entity.getUserNm());
		dto.setItemIdx(entity.getItemIdx());
		dto.setItemCd(entity.getItemCd());
		dto.setItemNm(entity.getItemNm());
		dto.setItemUnitNm(entity.getItemUnitNm());
		dto.setCustIdx(entity.getCustIdx());
		dto.setCustCd(entity.getCustCd());
		dto.setCustNm(entity.getCustNm());
		dto.setOrderCode(entity.getOrderCode());
		return dto;
	}

	/**
	 * 검색 조건에 맞는 입/출고 거래 내역(뷰 VInvTransactionDetails 기반)을 페이징하여 조회 * @param criteria
	 * 검색 조건을 담은 객체
	 * 
	 * @param pageable 페이징 및 정렬 정보를 담은 객체
	 * @return 페이징된 거래 내역 DTO (PageDto)
	 */
	public PageDto<VInvTransactionDetailsDto> findTransactions(InvTransactionSearchCriteria criteria,
			Pageable pageable) {
		Specification<VInvTransactionDetails> spec = (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();

			if (criteria.getTransType() != null && !criteria.getTransType().isEmpty()) {
				predicates.add(criteriaBuilder.equal(root.get("transType"), criteria.getTransType()));
			}
			if (criteria.getTransDateFrom() != null) {
				predicates
						.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transDate"), criteria.getTransDateFrom()));
			}
			if (criteria.getTransDateTo() != null) {
				predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("transDate"), criteria.getTransDateTo()));
			}
			if (criteria.getItemIdx() != null) {
				predicates.add(criteriaBuilder.equal(root.get("itemIdx"), criteria.getItemIdx()));
			}
			if (criteria.getCustIdx() != null) {
				predicates.add(criteriaBuilder.equal(root.get("custIdx"), criteria.getCustIdx()));
			}
			if (criteria.getUserIdx() != null) {
				predicates.add(criteriaBuilder.equal(root.get("userIdx"), criteria.getUserIdx()));
			}
			if (criteria.getWhIdx() != null) {
				predicates.add(criteriaBuilder.equal(root.get("whIdx"), criteria.getWhIdx()));
			}
			if (criteria.getTransStatus() != null && !criteria.getTransStatus().isEmpty()) {
				predicates.add(criteriaBuilder.equal(root.get("transStatus"), criteria.getTransStatus()));
			}

			return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
		};

		Page<VInvTransactionDetails> pageResult = viewRepository.findAll(spec, pageable);
		List<VInvTransactionDetailsDto> dtoList = pageResult.getContent().stream().map(this::convertToDto)
				.collect(Collectors.toList());

		return new PageDto<>(pageResult, dtoList);
	}

	/**
	 * 특정 ID의 입/출고 거래 상세 정보(뷰 VInvTransactionDetails 기반)를 조회 * @param invTransIdx
	 * 조회할 재고 트랜잭션의 고유 ID
	 * 
	 * @return 거래 상세 정보 DTO (VInvTransactionDetailsDto)
	 * @throws EntityNotFoundException 해당 ID의 거래 정보가 없을 경우 발생
	 */
	public VInvTransactionDetailsDto findTransactionById(Long invTransIdx) {
		VInvTransactionDetails entity = viewRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("거래 상세 정보를 찾을 수 없습니다. ID: " + invTransIdx));
		return convertToDto(entity);
	}
}