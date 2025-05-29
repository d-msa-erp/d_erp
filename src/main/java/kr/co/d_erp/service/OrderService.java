package kr.co.d_erp.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.BomDtl;
import kr.co.d_erp.domain.Mrp;
import kr.co.d_erp.domain.Order;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.Itemmst;
import kr.co.d_erp.dtos.OrderDto;
import kr.co.d_erp.dtos.OrderResponseDto;
import kr.co.d_erp.repository.oracle.BomDtlRepository;
import kr.co.d_erp.repository.oracle.InventoryRepository;
import kr.co.d_erp.repository.oracle.ItemmstRepository;
import kr.co.d_erp.repository.oracle.MrpRepository;
import kr.co.d_erp.repository.oracle.OrderRepository;
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

    @Transactional
    public OrderResponseDto saveOrder(OrderDto dto) {
    	// 주문 생성 및 필드 설정
        Order order = new Order();
        order.setOrderCode(dto.getOrderCode());
        order.setOrderType(dto.getOrderType());
        order.setOrderDate(dto.getOrderDate());
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

        // 단순 구매발주일 경우 바로 반환
        if ("P1".equals(dto.getOrderStatus())) {
            savedOrder.setOrderStatus("P1");
            return new OrderResponseDto(savedOrder.getOrderIdx(), savedOrder.getOrderCode(), List.of());
        }

        // 자재 재고 확인
        BigDecimal stockQty = inventoryRepository.getTotalStockByItemIdx(savedOrder.getItemIdx());
        boolean hasShortage = stockQty == null || stockQty.compareTo(BigDecimal.valueOf(savedOrder.getOrderQty())) < 0;

        List<String> warnings = new ArrayList<>();

        if (hasShortage) {
            // 자재 부족 시 MRP 생성
            List<BomDtl> bomList = bomDtlRepository.findByParentItemIdxOrderBySeqNoAsc(savedOrder.getItemIdx());
            List<Mrp> mrpList = new ArrayList<>();

            for (BomDtl bom : bomList) {
                BigDecimal requiredQty = BigDecimal.valueOf(savedOrder.getOrderQty())
                        .multiply(bom.getUseQty())
                        .multiply(BigDecimal.ONE.add(bom.getLossRt()));

                BigDecimal cost = requiredQty.multiply(bom.getItemPrice());

                Mrp mrp = Mrp.builder()
                        .orderIdx(savedOrder.getOrderIdx())
                        .itemIdx(bom.getSubItemIdx())
                        .unitIdx(1L)
                        .requiredQty(requiredQty)
                        .calculatedCost(cost)
                        .requireDate(savedOrder.getDeliveryDate())
                        .status("01")
                        .remark(bom.getRemark())
                        .createdDate(dbNow.toLocalDateTime())
                        .build();

                mrpList.add(mrp);

                BigDecimal subStock = inventoryRepository.getTotalStockByItemIdx(bom.getSubItemIdx());
                String itemNm = itemmstRepository.findByItemIdx(bom.getSubItemIdx())
                        .map(Itemmst::getItemNm).orElse("알 수 없음");

                warnings.add(String.format("❗ 자재 부족: %s | 필요: %s | 보유: %s", itemNm, requiredQty, subStock));
            }
            mrpRepository.saveAll(mrpList);
        }

        // 상태코드 설정 후 다시 저장
        savedOrder.setOrderStatus(hasShortage ? "S3" : "S1");
        savedOrder = orderRepository.save(savedOrder);

        // 입출고 기록
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

        invTransactionService.insertTransaction(invd);

        if (!warnings.isEmpty()) {
            System.out.println("===== 자재 부족 경고 =====");
            warnings.forEach(System.out::println);
            System.out.println("=========================");
        } else {
            System.out.println("✅ 모든 자재 충분");
        }

        return new OrderResponseDto(
                savedOrder.getOrderIdx(),
                savedOrder.getOrderCode(),
                warnings
        );
    }
}
