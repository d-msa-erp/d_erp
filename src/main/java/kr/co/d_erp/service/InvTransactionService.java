package kr.co.d_erp.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
import kr.co.d_erp.repository.oracle.OrderRepository;
import kr.co.d_erp.repository.oracle.TbInvTransRepository;
import kr.co.d_erp.repository.oracle.UsermstRepository;
import kr.co.d_erp.repository.oracle.VInvTransactionDetailsRepository;
import kr.co.d_erp.repository.oracle.WhmstRepository;
import lombok.RequiredArgsConstructor;

/**
 * 재고 거래(입고/출고) 서비스
 * 재고 거래 등록, 수정, 삭제 및 조회 기능을 제공합니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvTransactionService {

	private final TbInvTransRepository tbInvTransRepository;
	private final VInvTransactionDetailsRepository viewRepository;
	private final OrderRepository orderRepository;
	private final WhmstRepository whmstRepository;
	private final UsermstRepository usermstRepository;
	private final InventoryService inventoryService;

	/**
	 * 재고 거래(입고/출고)를 등록합니다.
	 * 
	 * @param requestDto 재고 거래 등록 요청 DTO
	 * @return 등록 결과 DTO
	 */
	@Transactional
	public InvTransactionResponseDto insertTransaction(InvTransactionRequestDto requestDto) {
		Order orderToLink;

		// 기존 주문이 있으면 연결, 없으면 신규 생성
		if (requestDto.getOrderIdx() != null && requestDto.getOrderIdx() > 0) {
			orderToLink = orderRepository.findById(requestDto.getOrderIdx()).orElseThrow(
					() -> new EntityNotFoundException("요청된 주문 정보를 찾을 수 없습니다. ID: " + requestDto.getOrderIdx()));
		} else {
			orderToLink = createInternalOrder(requestDto);
		}

		// 재고 거래 엔티티 생성 및 저장
		TbInvTrans invTransaction = createInvTransaction(requestDto, orderToLink);
		TbInvTrans savedInvTransaction = tbInvTransRepository.saveAndFlush(invTransaction);
		TbInvTrans reloadedInvTransaction = tbInvTransRepository.findById(savedInvTransaction.getInvTransIdx())
				.orElseThrow(() -> new EntityNotFoundException(
						"저장된 트랜잭션 데이터 재조회 실패: " + savedInvTransaction.getInvTransIdx()));

		// 재고 처리 (입고완료/출고완료 상태인 경우)
		processInventory(reloadedInvTransaction, orderToLink, requestDto);

		String message = ("S".equals(reloadedInvTransaction.getTransType()) ? "출고" : "입고") + " 등록 완료";
		if ("R3".equals(reloadedInvTransaction.getTransStatus()) || "S2".equals(reloadedInvTransaction.getTransStatus())) {
			message += " (재고 반영됨)";
		}

		return new InvTransactionResponseDto(reloadedInvTransaction.getInvTransIdx(),
				reloadedInvTransaction.getInvTransCode(), message);
	}

	/**
	 * 내부 주문을 생성합니다 (창고 이동 등을 위한 임시 주문).
	 * 
	 * @param requestDto 재고 거래 요청 DTO
	 * @return 생성된 주문 엔티티
	 */
	private Order createInternalOrder(InvTransactionRequestDto requestDto) {
		Order newInternalOrder = new Order();
		newInternalOrder.setOrderCode(generateOrderCode(requestDto.getTransType()));
		newInternalOrder.setOrderType("R".equals(requestDto.getTransType()) ? "I" : "O");
		newInternalOrder.setOrderDate(requestDto.getTransDate() != null ? requestDto.getTransDate() : LocalDate.now());

		// 거래처 ID 설정 (창고 이동의 경우 null 가능)
		if (requestDto.getCustIdx() != null) {
			newInternalOrder.setCustIdx(requestDto.getCustIdx());
		}

		if (requestDto.getItemIdx() == null) {
			throw new IllegalArgumentException("신규 주문 생성 시 품목 ID(itemIdx)는 필수입니다.");
		}
		newInternalOrder.setItemIdx(requestDto.getItemIdx());

		newInternalOrder.setOrderQty(requestDto.getTransQty() != null ? requestDto.getTransQty().intValue() : 0);
		newInternalOrder.setUnitPrice(requestDto.getUnitPrice() != null ? requestDto.getUnitPrice().longValue() : 0L);
		newInternalOrder.setTotalAmount((long) newInternalOrder.getOrderQty() * newInternalOrder.getUnitPrice());
		newInternalOrder.setDeliveryDate(newInternalOrder.getOrderDate());
		newInternalOrder.setOrderStatus("R".equals(requestDto.getTransType()) ? "I1" : "O1");
		newInternalOrder.setExpectedWhIdx(requestDto.getWhIdx());
		newInternalOrder.setUserIdx(requestDto.getUserIdx());

		String remarkForOrder = "자동 생성된 " + ("I".equals(newInternalOrder.getOrderType()) ? "내부입고" : "내부출고") + "주문";
		if (requestDto.getRemark() != null && !requestDto.getRemark().isEmpty()) {
			remarkForOrder += " (원비고: " + requestDto.getRemark() + ")";
		}
		newInternalOrder.setRemark(remarkForOrder);

		return orderRepository.saveAndFlush(newInternalOrder);
	}

	/**
	 * 재고 거래 엔티티를 생성합니다.
	 * 
	 * @param requestDto 재고 거래 요청 DTO
	 * @param orderToLink 연결할 주문 엔티티
	 * @return 생성된 재고 거래 엔티티
	 */
	private TbInvTrans createInvTransaction(InvTransactionRequestDto requestDto, Order orderToLink) {
		TbInvTrans invTransaction = new TbInvTrans();
		invTransaction.setTransType(requestDto.getTransType());
		invTransaction.setTbOrder(orderToLink);

		Whmst whmstForInvTrans = whmstRepository.findById(requestDto.getWhIdx())
				.orElseThrow(() -> new EntityNotFoundException("창고 정보를 찾을 수 없습니다. ID: " + requestDto.getWhIdx()));
		invTransaction.setWhmst(whmstForInvTrans);

		invTransaction.setTransDate(requestDto.getTransDate() != null ? requestDto.getTransDate() : LocalDate.now());
		invTransaction.setTransQty(requestDto.getTransQty());

		String invTransStatus = requestDto.getTransStatus();
		if (invTransStatus == null || invTransStatus.isBlank()) {
			invTransStatus = "R".equals(requestDto.getTransType()) ? "R1" : "S1";
		}
		invTransaction.setTransStatus(invTransStatus);
		invTransaction.setUnitPrice(requestDto.getUnitPrice());

		if (requestDto.getUserIdx() != null) {
			Usermst usermstForInvTrans = usermstRepository.findById(requestDto.getUserIdx()).orElse(null);
			invTransaction.setUsermst(usermstForInvTrans);
		}
		invTransaction.setRemark(requestDto.getRemark());

		return invTransaction;
	}

	/**
	 * 재고 처리를 수행합니다 (입고/출고 완료 상태인 경우).
	 * 
	 * @param invTransaction 재고 거래 엔티티
	 * @param orderToLink 연결된 주문 엔티티
	 * @param requestDto 요청 DTO
	 */
	private void processInventory(TbInvTrans invTransaction, Order orderToLink, InvTransactionRequestDto requestDto) {
		Long itemIdxForStock = orderToLink.getItemIdx();
		if (itemIdxForStock == null) {
			itemIdxForStock = requestDto.getItemIdx();
		}
		if (itemIdxForStock == null) {
			throw new IllegalStateException("재고 처리를 위한 품목 ID를 확정할 수 없습니다. 거래 ID: " + invTransaction.getInvTransIdx());
		}

		Long whIdxForStock = invTransaction.getWhmst().getWhIdx();
		BigDecimal quantityForStock = invTransaction.getTransQty();
		if (quantityForStock == null) {
			quantityForStock = BigDecimal.ZERO;
		}
		Long currentUserIdForStock = requestDto.getUserIdx();

		if ("R3".equals(invTransaction.getTransStatus())) { // 입고완료
			inventoryService.increaseStock(whIdxForStock, itemIdxForStock, quantityForStock, currentUserIdForStock);
			System.out.println("입고완료(R3) 재고 증가: 창고ID=" + whIdxForStock + ", 품목ID=" + itemIdxForStock + ", 수량=" + quantityForStock);
		} else if ("S2".equals(invTransaction.getTransStatus())) { // 출고완료
			inventoryService.decreaseStock(whIdxForStock, itemIdxForStock, quantityForStock, currentUserIdForStock);
			System.out.println("출고완료(S2) 재고 감소: 창고ID=" + whIdxForStock + ", 품목ID=" + itemIdxForStock + ", 수량=" + quantityForStock);
		}
	}

	/**
	 * 주문 코드를 생성합니다.
	 * 
	 * @param transType 거래 유형 (R: 입고, S: 출고)
	 * @return 생성된 주문 코드
	 */
	private String generateOrderCode(String transType) {
		String prefix = "R".equals(transType) ? "I-" : "O-";
		return prefix + System.currentTimeMillis() + "-" + (int) (Math.random() * 1000);
	}

	/**
	 * 재고 거래 정보를 수정합니다.
	 * 
	 * @param invTransIdx 수정할 재고 거래 ID
	 * @param requestDto 수정 요청 DTO
	 * @return 수정 결과 DTO
	 */
	@Transactional
	public InvTransactionResponseDto updateTransaction(Long invTransIdx, InvTransactionRequestDto requestDto) {
		TbInvTrans existingInvTransaction = tbInvTransRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("수정할 거래 정보를 찾을 수 없습니다. ID: " + invTransIdx));

		// 기존 상태 정보 저장
		String oldStatus = existingInvTransaction.getTransStatus();
		BigDecimal oldQuantity = existingInvTransaction.getTransQty() != null ? existingInvTransaction.getTransQty() : BigDecimal.ZERO;
		Long oldWhIdx = existingInvTransaction.getWhmst().getWhIdx();

		Long itemIdxForStock = existingInvTransaction.getTbOrder().getItemIdx();
		if (itemIdxForStock == null) {
			itemIdxForStock = requestDto.getItemIdx();
		}
		if (itemIdxForStock == null) {
			throw new IllegalStateException("재고 처리를 위한 품목 ID를 확정할 수 없습니다. (수정) 거래 ID: " + invTransIdx);
		}

		// 거래 정보 업데이트
		updateTransactionFields(existingInvTransaction, requestDto);

		TbInvTrans updatedInvTransaction = tbInvTransRepository.save(existingInvTransaction);

		// 재고 조정 처리 (상태나 수량이 변경된 경우)
		boolean inventoryAdjusted = adjustInventoryOnUpdate(updatedInvTransaction, oldStatus, oldQuantity, oldWhIdx, itemIdxForStock, requestDto.getUserIdx());

		String message = ("S".equals(updatedInvTransaction.getTransType()) ? "출고" : "입고") + " 정보 수정 완료";
		if (inventoryAdjusted) {
			String newStatus = updatedInvTransaction.getTransStatus();
			if ("R3".equals(newStatus) || "S2".equals(newStatus)) {
				message += " (재고 반영됨)";
			} else {
				message += " (재고 조정됨)";
			}
		}

		return new InvTransactionResponseDto(updatedInvTransaction.getInvTransIdx(),
				updatedInvTransaction.getInvTransCode(), message);
	}

	/**
	 * 거래 정보 필드를 업데이트합니다.
	 * 
	 * @param existingInvTransaction 기존 거래 엔티티
	 * @param requestDto 수정 요청 DTO
	 */
	private void updateTransactionFields(TbInvTrans existingInvTransaction, InvTransactionRequestDto requestDto) {
		existingInvTransaction.setTransDate(requestDto.getTransDate());
		existingInvTransaction.setTransQty(requestDto.getTransQty());
		existingInvTransaction.setTransStatus(requestDto.getTransStatus());
		existingInvTransaction.setUnitPrice(requestDto.getUnitPrice());
		existingInvTransaction.setRemark(requestDto.getRemark());

		// 창고 변경 처리
		if (requestDto.getWhIdx() != null) {
			Long oldWhIdx = existingInvTransaction.getWhmst().getWhIdx();
			if (!requestDto.getWhIdx().equals(oldWhIdx)) {
				Whmst newWhmst = whmstRepository.findById(requestDto.getWhIdx())
						.orElseThrow(() -> new EntityNotFoundException("새 창고 정보를 찾을 수 없습니다. ID: " + requestDto.getWhIdx()));
				existingInvTransaction.setWhmst(newWhmst);
			}
		} else {
			throw new IllegalArgumentException("창고 ID(whIdx)는 수정 시 필수입니다.");
		}

		// 사용자 정보 업데이트
		if (requestDto.getUserIdx() != null) {
			Usermst usermst = usermstRepository.findById(requestDto.getUserIdx()).orElse(null);
			existingInvTransaction.setUsermst(usermst);
		} else {
			existingInvTransaction.setUsermst(null);
		}
	}

	/**
	 * 수정 시 재고 조정을 처리합니다.
	 * 
	 * @param updatedInvTransaction 수정된 거래 엔티티
	 * @param oldStatus 기존 상태
	 * @param oldQuantity 기존 수량
	 * @param oldWhIdx 기존 창고 ID
	 * @param itemIdxForStock 품목 ID
	 * @param currentUserIdForStock 현재 사용자 ID
	 * @return 재고 조정 여부
	 */
	private boolean adjustInventoryOnUpdate(TbInvTrans updatedInvTransaction, String oldStatus, 
			BigDecimal oldQuantity, Long oldWhIdx, Long itemIdxForStock, Long currentUserIdForStock) {
		
		String newStatus = updatedInvTransaction.getTransStatus();
		BigDecimal newQuantity = updatedInvTransaction.getTransQty() != null ? updatedInvTransaction.getTransQty() : BigDecimal.ZERO;
		Long newWhIdx = updatedInvTransaction.getWhmst().getWhIdx();
		boolean inventoryAdjusted = false;

		// 1. 이전 상태가 완료였고, 새 상태가 완료가 아니거나 주요 정보가 변경된 경우: 이전 재고 효과 제거
		if ("R3".equals(oldStatus)) {
			if (!"R3".equals(newStatus) || !oldWhIdx.equals(newWhIdx) || oldQuantity.compareTo(newQuantity) != 0) {
				inventoryService.decreaseStock(oldWhIdx, itemIdxForStock, oldQuantity, currentUserIdForStock);
				System.out.println("이전 입고완료(R3) 취소/조정: 창고ID=" + oldWhIdx + ", 품목ID=" + itemIdxForStock + ", 이전수량=" + oldQuantity);
				inventoryAdjusted = true;
			}
		} else if ("S2".equals(oldStatus)) {
			if (!"S2".equals(newStatus) || !oldWhIdx.equals(newWhIdx) || oldQuantity.compareTo(newQuantity) != 0) {
				inventoryService.increaseStock(oldWhIdx, itemIdxForStock, oldQuantity, currentUserIdForStock);
				System.out.println("이전 출고완료(S2) 취소/조정: 창고ID=" + oldWhIdx + ", 품목ID=" + itemIdxForStock + ", 이전수량=" + oldQuantity);
				inventoryAdjusted = true;
			}
		}

		// 2. 새 상태가 완료이고, (이전 상태가 완료가 아니었거나, 또는 주요 정보가 변경되어 위에서 이전 효과가 제거된 경우): 새 재고 효과 적용
		if ("R3".equals(newStatus)) {
			if (!"R3".equals(oldStatus) || inventoryAdjusted) {
				inventoryService.increaseStock(newWhIdx, itemIdxForStock, newQuantity, currentUserIdForStock);
				System.out.println("신규/수정 입고완료(R3) 재고 증가: 창고ID=" + newWhIdx + ", 품목ID=" + itemIdxForStock + ", 새수량=" + newQuantity);
				inventoryAdjusted = true;
			}
		} else if ("S2".equals(newStatus)) {
			if (!"S2".equals(oldStatus) || inventoryAdjusted) {
				inventoryService.decreaseStock(newWhIdx, itemIdxForStock, newQuantity, currentUserIdForStock);
				System.out.println("신규/수정 출고완료(S2) 재고 감소: 창고ID=" + newWhIdx + ", 품목ID=" + itemIdxForStock + ", 새수량=" + newQuantity);
				inventoryAdjusted = true;
			}
		}

		return inventoryAdjusted;
	}

	/**
	 * 재고 거래를 삭제합니다.
	 * 
	 * @param invTransIdx 삭제할 재고 거래 ID
	 */
	@Transactional
	public void deleteTransactionById(Long invTransIdx) {
		TbInvTrans transaction = tbInvTransRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("삭제할 거래 정보를 찾을 수 없습니다. ID: " + invTransIdx));

		// 완료 상태인 경우 재고 조정
		adjustInventoryOnDelete(transaction);

		// 연결된 내부 주문 삭제
		Order linkedOrder = transaction.getTbOrder();
		if (linkedOrder != null && ("I".equals(linkedOrder.getOrderType()) || "O".equals(linkedOrder.getOrderType()))) {
			orderRepository.delete(linkedOrder);
		}

		tbInvTransRepository.deleteById(invTransIdx);
	}

	/**
	 * 삭제 시 재고 조정을 처리합니다.
	 * 
	 * @param transaction 삭제할 거래 엔티티
	 */
	private void adjustInventoryOnDelete(TbInvTrans transaction) {
		String transStatus = transaction.getTransStatus();
		if ("R3".equals(transStatus) || "S2".equals(transStatus)) {
			Long itemIdxForStock = transaction.getTbOrder() != null ? transaction.getTbOrder().getItemIdx() : null;
			if (itemIdxForStock == null) {
				System.err.println("경고: 삭제 대상 거래(ID:" + transaction.getInvTransIdx() + ")에 연결된 주문에서 품목 ID를 찾을 수 없어 재고 조정을 건너뜁니다.");
			} else {
				Long whIdxForStock = transaction.getWhmst().getWhIdx();
				BigDecimal quantityForStock = transaction.getTransQty() != null ? transaction.getTransQty() : BigDecimal.ZERO;
				Long currentUserIdForStock = transaction.getUsermst() != null ? transaction.getUsermst().getUserIdx() : null;

				if ("R3".equals(transStatus)) {
					inventoryService.decreaseStock(whIdxForStock, itemIdxForStock, quantityForStock, currentUserIdForStock);
					System.out.println("입고완료(R3) 거래 삭제 - 재고 감소: 창고ID=" + whIdxForStock + ", 품목ID=" + itemIdxForStock + ", 수량=" + quantityForStock);
				} else if ("S2".equals(transStatus)) {
					inventoryService.increaseStock(whIdxForStock, itemIdxForStock, quantityForStock, currentUserIdForStock);
					System.out.println("출고완료(S2) 거래 삭제 - 재고 증가: 창고ID=" + whIdxForStock + ", 품목ID=" + itemIdxForStock + ", 수량=" + quantityForStock);
				}
			}
		}
	}

	/**
	 * 여러 재고 거래를 일괄 삭제합니다.
	 * 
	 * @param invTransIdxes 삭제할 재고 거래 ID 목록
	 */
	@Transactional
	public void deleteTransactions(List<Long> invTransIdxes) {
		if (invTransIdxes == null || invTransIdxes.isEmpty()) {
			return;
		}
		
		List<TbInvTrans> transactionsToDelete = tbInvTransRepository.findAllById(invTransIdxes);

		for (TbInvTrans transaction : transactionsToDelete) {
			// 완료 상태인 경우 재고 조정
			adjustInventoryOnDelete(transaction);

			// 연결된 내부 주문 삭제
			Order linkedOrder = transaction.getTbOrder();
			if (linkedOrder != null && ("I".equals(linkedOrder.getOrderType()) || "O".equals(linkedOrder.getOrderType()))) {
				orderRepository.delete(linkedOrder);
			}
		}
		
		tbInvTransRepository.deleteAllInBatch(transactionsToDelete);
	}

	/**
	 * 재고 거래 목록을 조건에 따라 조회합니다.
	 * 
	 * @param criteria 검색 조건
	 * @param pageable 페이징 정보
	 * @return 페이징된 재고 거래 목록
	 */
	public PageDto<VInvTransactionDetailsDto> findTransactions(InvTransactionSearchCriteria criteria, Pageable pageable) {
		Specification<VInvTransactionDetails> spec = (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			
			if (criteria.getTransType() != null && !criteria.getTransType().isEmpty()) {
				predicates.add(criteriaBuilder.equal(root.get("transType"), criteria.getTransType()));
			}
			if (criteria.getTransDateFrom() != null) {
				predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transDate"), criteria.getTransDateFrom()));
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
		List<VInvTransactionDetailsDto> dtoList = pageResult.getContent().stream()
				.map(this::convertToDto)
				.collect(Collectors.toList());
		
		return new PageDto<>(pageResult, dtoList);
	}

	/**
	 * 재고 거래 상세 정보를 조회합니다.
	 * 
	 * @param invTransIdx 재고 거래 ID
	 * @return 재고 거래 상세 DTO
	 */
	public VInvTransactionDetailsDto findTransactionById(Long invTransIdx) {
		VInvTransactionDetails entity = viewRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("거래 상세 정보를 찾을 수 없습니다. ID: " + invTransIdx));
		return convertToDto(entity);
	}

	/**
	 * VInvTransactionDetails 엔티티를 DTO로 변환합니다.
	 * 
	 * @param entity VInvTransactionDetails 엔티티
	 * @return 변환된 DTO
	 */
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
		dto.setOrderCode(entity.getOrderCode());
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
		return dto;
	}
}