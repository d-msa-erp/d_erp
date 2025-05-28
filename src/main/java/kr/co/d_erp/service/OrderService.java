package kr.co.d_erp.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
	
import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.BomDtl;
import kr.co.d_erp.domain.Inventory;
import kr.co.d_erp.domain.Mrp;
import kr.co.d_erp.domain.Order;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
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
    
    private InvTransactionRequestDto invd;


    @Transactional
    public OrderResponseDto saveOrder(OrderDto dto) {
        Order order = new Order();

        // 필드 세팅
        order.setOrderCode(dto.getOrderCode());
        // order.setOrderType(dto.getOrderType());
        order.setOrderDate(dto.getOrderDate());
        order.setCustIdx(dto.getCustIdx());
        order.setItemIdx(dto.getItemIdx());
        order.setOrderQty(dto.getOrderQty());
        order.setUnitPrice(dto.getUnitPrice());
        order.setDeliveryDate(dto.getDeliveryDate());
        order.setOrderStatus(dto.getOrderStatus());
        order.setExpectedWhIdx(dto.getExpectedWhIdx());
        order.setUserIdx(dto.getUserIdx());
        order.setRemark(dto.getRemark());

        // 단가 * 수량
        if (dto.getOrderQty() != null && dto.getUnitPrice() != null) {
            order.setTotalAmount(dto.getUnitPrice() * dto.getOrderQty());
        } else {
            throw new IllegalArgumentException("단가 또는 수량이 null입니다.");
        }

        Timestamp dbNow = orderRepository.oracleTodayRaw();
        order.setCreatedDate(dbNow.toLocalDateTime());

        // 먼저 주문 저장 (→ orderIdx 생성됨)
        Order savedOrder = orderRepository.save(order);

        // 입출고 이력 생성
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

        // MRP 계산
        List<BomDtl> bomList = bomDtlRepository.findByParentItemIdxOrderBySeqNoAsc(savedOrder.getItemIdx());
        List<Mrp> mrpList = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        boolean hasMaterialShortage = false;
        
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

            BigDecimal stock = inventoryRepository.getTotalStockByItemIdx(bom.getSubItemIdx());
            
            if (stock == null || stock.compareTo(requiredQty) < 0) {
                hasMaterialShortage = true;
            }
            
            String itemNm = itemmstRepository
                    .findByItemIdx(bom.getSubItemIdx())
                    .map(Itemmst::getItemNm)
                    .orElse("알 수 없음");

            warnings.add(String.format("❗ 자재 부족: %s | 필요: %s | 보유: %s",
                itemNm, requiredQty, stock));
        }

        mrpRepository.saveAll(mrpList);

        if (!warnings.isEmpty()) {
            System.out.println("===== 자재 부족 경고 =====");
            warnings.forEach(System.out::println);
            System.out.println("=========================");
        } else {
            System.out.println("✅ 모든 자재 충분");
        }
        
        if (hasMaterialShortage) {
            order.setOrderStatus("S2"); // 자재 부족 → 생산 필요
        } else {
            order.setOrderStatus("S1"); // 자재 충분 → 입고 대기
        }
        
        return new OrderResponseDto(
                savedOrder.getOrderIdx(),
                savedOrder.getOrderCode(),
                warnings
            );
    }
    
    
}