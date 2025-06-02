package kr.co.d_erp.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.BomDtl;
import kr.co.d_erp.domain.Mrp;
import kr.co.d_erp.domain.Order;
import kr.co.d_erp.domain.TbInvTrans;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.Itemmst;
import kr.co.d_erp.dtos.OrderDto;
import kr.co.d_erp.dtos.OrderResponseDto;
import kr.co.d_erp.repository.oracle.BomDtlRepository;
import kr.co.d_erp.repository.oracle.InventoryRepository;
import kr.co.d_erp.repository.oracle.ItemmstRepository;
import kr.co.d_erp.repository.oracle.MrpRepository;
import kr.co.d_erp.repository.oracle.OrderRepository;
import kr.co.d_erp.repository.oracle.TbInvTransRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

	private final OrderRepository orderRepository;
	private final BomDtlRepository bomDtlRepository;
	private final InvTransactionService invTransactionService;
	private final InventoryRepository inventoryRepository;
	private final ItemmstRepository itemmstRepository;
	private final MrpRepository mrpRepository;
	private final TbInvTransRepository tbInvTransRepository;

	@Transactional
	public OrderResponseDto saveOrder(OrderDto dto) {
		// 주문 생성 및 필드 설정
		Order order = new Order();
		order.setOrderCode(dto.getOrderCode());
		order.setOrderType(dto.getOrderType());
		order.setOrderDate(dto.getOrderDate());
		order.setOrderStatus(dto.getOrderStatus());
		order.setCustIdx(dto.getCustIdx());
		order.setItemIdx(dto.getItemIdx());
		order.setOrderQty(dto.getOrderQty());
		order.setUnitPrice(dto.getUnitPrice());
		order.setDeliveryDate(dto.getDeliveryDate());
		order.setExpectedWhIdx(dto.getExpectedWhIdx());
		order.setUserIdx(dto.getUserIdx());
		order.setRemark(dto.getRemark());
		
		if (dto.getOrderQty() == null || dto.getUnitPrice() == null) {
			throw new IllegalArgumentException("단가 또는 수량이 null입니다.");
		}
		order.setTotalAmount(dto.getUnitPrice() * dto.getOrderQty());

		Timestamp dbNow = orderRepository.oracleTodayRaw();
		order.setCreatedDate(dbNow.toLocalDateTime());

		// 우선 임시 저장
		Order savedOrder = orderRepository.save(order);

		// 단순 구매발주일 경우 상태 설정 후 계속 진행 (insertTransaction 포함)
		if ("P1".equals(dto.getOrderStatus())) {
			savedOrder.setOrderStatus("P1");
		}

		// 완제품 재고 확인
		BigDecimal stockQty = inventoryRepository.getTotalStockByItemIdx(savedOrder.getItemIdx());
		boolean hasProductShortage = stockQty == null
				|| stockQty.compareTo(BigDecimal.valueOf(savedOrder.getOrderQty())) < 0;

		// 자재 부족 검사
		boolean hasMaterialShortage = false;
		List<String> warnings = new ArrayList<>();
		List<Mrp> mrpList = new ArrayList<>();

		List<BomDtl> bomList = bomDtlRepository.findByParentItemIdxOrderBySeqNoAsc(savedOrder.getItemIdx());
		for (BomDtl bom : bomList) {
			BigDecimal requiredQty = BigDecimal.valueOf(savedOrder.getOrderQty()).multiply(bom.getUseQty())
					.multiply(BigDecimal.ONE.add(bom.getLossRt()));

			BigDecimal cost = requiredQty.multiply(bom.getItemPrice());
			BigDecimal subStock = inventoryRepository.getTotalStockByItemIdx(bom.getSubItemIdx());
			String itemNm = itemmstRepository.findByItemIdx(bom.getSubItemIdx()).map(Itemmst::getItemNm)
					.orElse("알 수 없음");

			Itemmst subItem = itemmstRepository.findById(bom.getSubItemIdx())
					.orElseThrow(() -> new IllegalArgumentException("품목을 찾을 수 없습니다."));

			Long unitIdx = subItem.getUnitForItemDto().getUnitIdx();

			// 자재 부족 판별
			if (subStock == null || subStock.compareTo(requiredQty) < 0) {
				hasMaterialShortage = true;

				Mrp mrp = Mrp.builder().orderIdx(savedOrder.getOrderIdx()).itemIdx(bom.getSubItemIdx()).unitIdx(unitIdx)
						.requiredQty(requiredQty).calculatedCost(cost).requireDate(savedOrder.getDeliveryDate())
						.status("01").remark(bom.getRemark()).createdDate(dbNow.toLocalDateTime()).build();

				mrpList.add(mrp);
				warnings.add(String.format("❗ 자재 부족: %s | 필요: %s | 보유: %s", itemNm, requiredQty, subStock));
			}
		}

		if (!mrpList.isEmpty()) {
			mrpRepository.saveAll(mrpList);
		}

		// 상태코드 재설정
		if ("S".equals(savedOrder.getOrderType())) {
			boolean overallShortage = hasProductShortage || hasMaterialShortage;
			savedOrder.setOrderStatus(overallShortage ? "S1" : "S2");
			savedOrder = orderRepository.save(savedOrder);
		}

		// 입출고 기록 생성
		InvTransactionRequestDto invd = new InvTransactionRequestDto();
		invd.setCustIdx(savedOrder.getCustIdx());
		invd.setOrderIdx(savedOrder.getOrderIdx());
		invd.setWhIdx(savedOrder.getExpectedWhIdx());
		invd.setTransType(savedOrder.getOrderType().equals("S") ? "S" : "R");
		invd.setTransStatus(savedOrder.getOrderType().equals("S") ? "S1" : "R1");
		invd.setTransDate(savedOrder.getDeliveryDate());
		invd.setTransQty(BigDecimal.valueOf(savedOrder.getOrderQty()));
		invd.setUserIdx(savedOrder.getUserIdx());
		invd.setUnitPrice(BigDecimal.valueOf(savedOrder.getUnitPrice()));
		invd.setItemIdx(savedOrder.getItemIdx());
		invd.setRemark(savedOrder.getRemark());

		try {
			invTransactionService.insertTransaction(invd);
			System.out.println("저장 완료");
		} catch (Exception e) {
			System.out.println("저장 실패: " + e.getMessage());
			e.printStackTrace();
		}

		if (!warnings.isEmpty()) {
			System.out.println("===== 자재 부족 경고 =====");
			warnings.forEach(System.out::println);
			System.out.println("=========================");
		} else {
			System.out.println("✅ 모든 자재 충분");
		}

		return new OrderResponseDto(savedOrder.getOrderIdx(), savedOrder.getOrderCode(), hasProductShortage,
				hasMaterialShortage, warnings);
	}

	@Transactional
	public void updateOrderAndTransaction(OrderDto dto) {
		// 주문 수정
		Order order = orderRepository.findById(dto.getOrderIdx())
				.orElseThrow(() -> new RuntimeException("주문이 존재하지 않습니다."));

		order.setOrderQty(dto.getOrderQty());
		order.setUnitPrice(dto.getUnitPrice());
		order.setTotalAmount(dto.getOrderQty() * dto.getUnitPrice());
		order.setDeliveryDate(dto.getDeliveryDate());
		order.setRemark(dto.getRemark());
		order.setExpectedWhIdx(dto.getExpectedWhIdx());
		orderRepository.save(order);

		// Mrp 수정
		List<Mrp> mrpList = mrpRepository.findByOrderIdx(dto.getOrderIdx());
		for (Mrp mrp : mrpList) {
			mrp.setRequiredQty(BigDecimal.valueOf(dto.getOrderQty()));
			mrp.setRequireDate(dto.getDeliveryDate());
		}
		mrpRepository.saveAll(mrpList);

		// 연결된 입출고 수정
		TbInvTrans existingInvTransaction = tbInvTransRepository.findById(order.getOrderIdx())
				.orElseThrow(() -> new EntityNotFoundException("수정할 거래 정보를 찾을 수 없습니다. ID: " + order.getOrderIdx()));

		InvTransactionRequestDto transDto = new InvTransactionRequestDto();
		transDto.setTransQty(BigDecimal.valueOf(dto.getOrderQty()));
		transDto.setUnitPrice(BigDecimal.valueOf(dto.getUnitPrice()));
		transDto.setTransDate(dto.getOrderDate());
		transDto.setTransStatus(existingInvTransaction.getTransStatus()); // 기존 상태 유지
		transDto.setUserIdx(dto.getUserIdx());
		transDto.setRemark(dto.getRemark());
		transDto.setWhIdx(dto.getExpectedWhIdx());
		transDto.setItemIdx(dto.getItemIdx());
		transDto.setCustIdx(dto.getCustIdx());

		invTransactionService.updateTransaction(existingInvTransaction.getInvTransIdx(), transDto);
	}

	// 삭제
	@Transactional
	public void deleteOrderAndRelatedData(List<Long> orderIdxList) {
		for (Long orderIdx : orderIdxList) {
			// MRP 삭제
			List<Mrp> mrps = mrpRepository.findByOrderIdx(orderIdx);
			if (!mrps.isEmpty()) {
				mrpRepository.deleteAll(mrps);
			}

			// 입출고 삭제
			List<TbInvTrans> transList = tbInvTransRepository.findByTbOrder_OrderIdx(orderIdx);
			for (TbInvTrans trans : transList) {
				invTransactionService.deleteTransactionById(trans.getInvTransIdx());
			}

			// 주문 삭제
			orderRepository.deleteById(orderIdx);
		}
	}
}
