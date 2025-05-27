package kr.co.d_erp.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime; // InventoryService에서 LocalDateTime 사용하므로 추가
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

// CustmstRepository, ItemmstRepository는 현재 직접 사용되지 않으므로 주석 처리 또는 필요시 유지
// import kr.co.d_erp.repository.oracle.CustmstRepository;
// import kr.co.d_erp.repository.oracle.ItemmstRepository;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvTransactionService {

	private final TbInvTransRepository tbInvTransRepository;
	private final VInvTransactionDetailsRepository viewRepository;
	private final OrderRepository orderRepository;
	// private final CustmstRepository custmstRepository;
	// private final ItemmstRepository itemmstRepository;
	private final WhmstRepository whmstRepository;
	private final UsermstRepository usermstRepository;

    private final InventoryService inventoryService; // InventoryService 주입

	@Transactional
	public InvTransactionResponseDto insertTransaction(InvTransactionRequestDto requestDto) {
		Order orderToLink;

		if (requestDto.getOrderIdx() != null && requestDto.getOrderIdx() > 0) {
			orderToLink = orderRepository.findById(requestDto.getOrderIdx()).orElseThrow(
					() -> new EntityNotFoundException("요청된 주문 정보를 찾을 수 없습니다. ID: " + requestDto.getOrderIdx()));
		} else {
			Order newInternalOrder = new Order();
			newInternalOrder.setOrderCode(generateOrderCode(requestDto.getTransType()));
			newInternalOrder.setOrderType("R".equals(requestDto.getTransType()) ? "I" : "O");
			newInternalOrder.setOrderDate(requestDto.getTransDate() != null ? requestDto.getTransDate() : LocalDate.now());
			
            if (requestDto.getCustIdx() == null) throw new IllegalArgumentException("신규 주문 생성 시 거래처 ID(custIdx)는 필수입니다.");
			newInternalOrder.setCustIdx(requestDto.getCustIdx());
            if (requestDto.getItemIdx() == null) throw new IllegalArgumentException("신규 주문 생성 시 품목 ID(itemIdx)는 필수입니다.");
			newInternalOrder.setItemIdx(requestDto.getItemIdx());

			newInternalOrder.setOrderQty(requestDto.getTransQty() != null ? requestDto.getTransQty().intValue() : 0);
			newInternalOrder.setUnitPrice(requestDto.getUnitPrice() != null ? requestDto.getUnitPrice().longValue() : 0L);
			newInternalOrder.setTotalAmount( (long)newInternalOrder.getOrderQty() * newInternalOrder.getUnitPrice());
			newInternalOrder.setDeliveryDate(newInternalOrder.getOrderDate());
			newInternalOrder.setOrderStatus("R".equals(requestDto.getTransType()) ? "I1" : "O1");
			newInternalOrder.setExpectedWhIdx(requestDto.getWhIdx());
			newInternalOrder.setUserIdx(requestDto.getUserIdx());
			String remarkForOrder = "자동 생성된 " + ("I".equals(newInternalOrder.getOrderType()) ? "내부입고" : "내부출고") + "주문";
			if (requestDto.getRemark() != null && !requestDto.getRemark().isEmpty()) {
				remarkForOrder += " (원비고: " + requestDto.getRemark() + ")";
			}
			newInternalOrder.setRemark(remarkForOrder);
			orderToLink = orderRepository.saveAndFlush(newInternalOrder);
		}

		TbInvTrans invTransaction = new TbInvTrans();
		invTransaction.setTransType(requestDto.getTransType());
		invTransaction.setTbOrder(orderToLink);

		Whmst whmstForInvTrans = whmstRepository.findById(requestDto.getWhIdx())
				.orElseThrow(() -> new EntityNotFoundException("창고 정보를 찾을 수 없습니다. ID: " + requestDto.getWhIdx()));
		invTransaction.setWhmst(whmstForInvTrans);

		invTransaction.setTransDate(requestDto.getTransDate() != null ? requestDto.getTransDate() : LocalDate.now());
		invTransaction.setTransQty(requestDto.getTransQty()); // BigDecimal

		String invTransStatus = requestDto.getTransStatus();
		if (invTransStatus == null || invTransStatus.isBlank()) {
			invTransStatus = "R".equals(requestDto.getTransType()) ? "R1" : "S1";
		}
		invTransaction.setTransStatus(invTransStatus);
		invTransaction.setUnitPrice(requestDto.getUnitPrice()); // BigDecimal

		if (requestDto.getUserIdx() != null) {
			Usermst usermstForInvTrans = usermstRepository.findById(requestDto.getUserIdx()).orElse(null);
			invTransaction.setUsermst(usermstForInvTrans);
		}
		invTransaction.setRemark(requestDto.getRemark());

		TbInvTrans savedInvTransaction = tbInvTransRepository.saveAndFlush(invTransaction);
		TbInvTrans reloadedInvTransaction = tbInvTransRepository.findById(savedInvTransaction.getInvTransIdx())
				.orElseThrow(() -> new EntityNotFoundException(
						"저장된 트랜잭션 데이터 재조회 실패: " + savedInvTransaction.getInvTransIdx()));

        // === 재고 처리 로직 ===
        Long itemIdxForStock = orderToLink.getItemIdx();
        if (itemIdxForStock == null) { // DTO의 itemIdx가 더 우선순위가 높거나, 주문에 없을 경우를 대비
            itemIdxForStock = requestDto.getItemIdx();
        }
        if (itemIdxForStock == null) {
            throw new IllegalStateException("재고 처리를 위한 품목 ID를 확정할 수 없습니다. 거래 ID: " + reloadedInvTransaction.getInvTransIdx());
        }

        Long whIdxForStock = reloadedInvTransaction.getWhmst().getWhIdx();
        // InventoryService는 BigDecimal 타입을 받도록 수정되었거나, 혹은 여기서 BigDecimal로 전달
        BigDecimal quantityForStock = reloadedInvTransaction.getTransQty(); 
        if (quantityForStock == null) { // 수량이 null인 경우 방어
            quantityForStock = BigDecimal.ZERO;
        }
        Long currentUserIdForStock = requestDto.getUserIdx();

        if ("R3".equals(reloadedInvTransaction.getTransStatus())) { // 입고완료
            inventoryService.increaseStock(whIdxForStock, itemIdxForStock, quantityForStock, currentUserIdForStock);
            System.out.println("입고완료(R3) 재고 증가: 창고ID=" + whIdxForStock + ", 품목ID=" + itemIdxForStock + ", 수량=" + quantityForStock);
        } else if ("S2".equals(reloadedInvTransaction.getTransStatus())) { // 출고완료 (S2로 가정)
            inventoryService.decreaseStock(whIdxForStock, itemIdxForStock, quantityForStock, currentUserIdForStock);
            System.out.println("출고완료(S2) 재고 감소: 창고ID=" + whIdxForStock + ", 품목ID=" + itemIdxForStock + ", 수량=" + quantityForStock);
        }
        // =======================

		String message = ("S".equals(reloadedInvTransaction.getTransType()) ? "출고" : "입고") + " 등록 완료";
        if ("R3".equals(reloadedInvTransaction.getTransStatus()) || "S2".equals(reloadedInvTransaction.getTransStatus())) {
            message += " (재고 반영됨)";
        }

		return new InvTransactionResponseDto(reloadedInvTransaction.getInvTransIdx(),
				reloadedInvTransaction.getInvTransCode(), message);
	}

	private String generateOrderCode(String transType) {
		String prefix = "R".equals(transType) ? "I-" : "O-";
		return prefix + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000);
	}

	@Transactional
	public InvTransactionResponseDto updateTransaction(Long invTransIdx, InvTransactionRequestDto requestDto) {
		TbInvTrans existingInvTransaction = tbInvTransRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("수정할 거래 정보를 찾을 수 없습니다. ID: " + invTransIdx));

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

		existingInvTransaction.setTransDate(requestDto.getTransDate());
		existingInvTransaction.setTransQty(requestDto.getTransQty());
		existingInvTransaction.setTransStatus(requestDto.getTransStatus());
		existingInvTransaction.setUnitPrice(requestDto.getUnitPrice());
		existingInvTransaction.setRemark(requestDto.getRemark());

		Whmst newWhmstIfChanged = existingInvTransaction.getWhmst(); // 기본값은 기존 창고
		if (requestDto.getWhIdx() != null) {
			if (!requestDto.getWhIdx().equals(oldWhIdx)) { // 창고가 변경된 경우에만 새로 조회
				newWhmstIfChanged = whmstRepository.findById(requestDto.getWhIdx())
						.orElseThrow(() -> new EntityNotFoundException("새 창고 정보를 찾을 수 없습니다. ID: " + requestDto.getWhIdx()));
				existingInvTransaction.setWhmst(newWhmstIfChanged);
			}
		} else {
            throw new IllegalArgumentException("창고 ID(whIdx)는 수정 시 필수입니다.");
        }

		if (requestDto.getUserIdx() != null) {
			Usermst usermst = usermstRepository.findById(requestDto.getUserIdx()).orElse(null);
			existingInvTransaction.setUsermst(usermst);
		} else {
			existingInvTransaction.setUsermst(null);
		}

		TbInvTrans updatedInvTransaction = tbInvTransRepository.save(existingInvTransaction);

        String newStatus = updatedInvTransaction.getTransStatus();
        BigDecimal newQuantity = updatedInvTransaction.getTransQty() != null ? updatedInvTransaction.getTransQty() : BigDecimal.ZERO;
        Long newWhIdx = updatedInvTransaction.getWhmst().getWhIdx(); // newWhmstIfChanged.getWhIdx()와 동일
        Long currentUserIdForStock = requestDto.getUserIdx();

        boolean inventoryAdjusted = false; // 실제 재고 조정이 발생했는지 여부

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
            if (!"R3".equals(oldStatus) || inventoryAdjusted) { // inventoryAdjusted가 true라는 것은 이전 효과가 제거되었다는 의미
                inventoryService.increaseStock(newWhIdx, itemIdxForStock, newQuantity, currentUserIdForStock);
                System.out.println("신규/수정 입고완료(R3) 재고 증가: 창고ID=" + newWhIdx + ", 품목ID=" + itemIdxForStock + ", 새수량=" + newQuantity);
                inventoryAdjusted = true; // 최종적으로 재고가 반영되었음을 확실히 함
            }
        } else if ("S2".equals(newStatus)) {
            if (!"S2".equals(oldStatus) || inventoryAdjusted) {
                inventoryService.decreaseStock(newWhIdx, itemIdxForStock, newQuantity, currentUserIdForStock);
                System.out.println("신규/수정 출고완료(S2) 재고 감소: 창고ID=" + newWhIdx + ", 품목ID=" + itemIdxForStock + ", 새수량=" + newQuantity);
                inventoryAdjusted = true;
            }
        }
        
		String message = ("S".equals(updatedInvTransaction.getTransType()) ? "출고" : "입고") + " 정보 수정 완료";
        if (inventoryAdjusted) {
             if ("R3".equals(newStatus) || "S2".equals(newStatus)) {
                 message += " (재고 반영됨)";
             } else { // 완료 상태에서 다른 상태로 변경된 경우 (재고 조정이 있었음)
                 message += " (재고 조정됨)";
             }
        }


		return new InvTransactionResponseDto(updatedInvTransaction.getInvTransIdx(),
				updatedInvTransaction.getInvTransCode(), message);
	}

	@Transactional
	public void deleteTransactionById(Long invTransIdx) {
		TbInvTrans transaction = tbInvTransRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("삭제할 거래 정보를 찾을 수 없습니다. ID: " + invTransIdx));

        String transStatus = transaction.getTransStatus();
        if ("R3".equals(transStatus) || "S2".equals(transStatus)) {
            Long itemIdxForStock = transaction.getTbOrder() != null ? transaction.getTbOrder().getItemIdx() : null;
            if (itemIdxForStock == null) {
                System.err.println("경고: 삭제 대상 거래(ID:" + invTransIdx + ")에 연결된 주문에서 품목 ID를 찾을 수 없어 재고 조정을 건너뜁니다.");
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

		Order linkedOrder = transaction.getTbOrder();
		if (linkedOrder != null && ("I".equals(linkedOrder.getOrderType()) || "O".equals(linkedOrder.getOrderType()))) {
			orderRepository.delete(linkedOrder);
		}
		tbInvTransRepository.deleteById(invTransIdx);
	}

	@Transactional
	public void deleteTransactions(List<Long> invTransIdxes) {
		if (invTransIdxes == null || invTransIdxes.isEmpty()) {
			return;
		}
		List<TbInvTrans> transactionsToDelete = tbInvTransRepository.findAllById(invTransIdxes);

		for (TbInvTrans transaction : transactionsToDelete) {
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

			Order linkedOrder = transaction.getTbOrder();
			if (linkedOrder != null && ("I".equals(linkedOrder.getOrderType()) || "O".equals(linkedOrder.getOrderType()))) {
				orderRepository.delete(linkedOrder);
			}
		}
		tbInvTransRepository.deleteAllInBatch(transactionsToDelete);
	}

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

	public PageDto<VInvTransactionDetailsDto> findTransactions(InvTransactionSearchCriteria criteria,
			Pageable pageable) {
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
		List<VInvTransactionDetailsDto> dtoList = pageResult.getContent().stream().map(this::convertToDto)
				.collect(Collectors.toList());
		return new PageDto<>(pageResult, dtoList);
	}

	public VInvTransactionDetailsDto findTransactionById(Long invTransIdx) {
		VInvTransactionDetails entity = viewRepository.findById(invTransIdx)
				.orElseThrow(() -> new EntityNotFoundException("거래 상세 정보를 찾을 수 없습니다. ID: " + invTransIdx));
		return convertToDto(entity);
	}
}