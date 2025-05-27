package kr.co.d_erp.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import kr.co.d_erp.dtos.InvenDto;
import kr.co.d_erp.repository.oracle.BomDtlRepository;
import kr.co.d_erp.repository.oracle.CustmstRepository;
import kr.co.d_erp.repository.oracle.ItemInvenRepository;
import kr.co.d_erp.repository.oracle.ItemmstRepository;
import kr.co.d_erp.repository.oracle.MrpRepository;
import kr.co.d_erp.repository.oracle.OrderRepository;
import kr.co.d_erp.repository.oracle.UnitRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MrpServiceImpl implements MrpService {

    private final OrderRepository orderRepository;
    private final ItemmstRepository itemmstRepository; // 품목 정보 조회를 위해
    private final MrpRepository mrpRepository;   // TB_MRP 테이블 직접 접근
    private final BomDtlRepository bomDtlRepository;     // BOM 정보 조회용	
    private final ItemInvenRepository itemInvenRepository ; // 현재고 조회용
    private final CustmstRepository custmstRepository;
    private final UnitRepository unitRepository;
    
    @PersistenceContext
    private EntityManager entityManager; // MRP_RESULT_DETAILS 뷰 조회를 위해

    
    @Override
    @Transactional(readOnly = true) // 실제 구현 메서드에 @Transactional 적용
    public Long getCurrentStockByItemIdx(Long itemIdx) {
        if (itemIdx == null) {
            // throw new IllegalArgumentException("Item ID cannot be null");
            return 0L; // 또는 null을 반환하거나 예외를 던지는 것을 고려
        }
        // 주입된 itemInvenRepository 인스턴스 사용
        Optional<InvenDto> inventoryOpt = itemInvenRepository.findByItem_ItemIdx(itemIdx);

        // InvenDto의 stockQty 필드가 Long 타입이라고 가정
        return inventoryOpt.map(InvenDto::getStockQty).orElse(0L); // 재고 없으면 0L 반환
    }
    
}  
    
    
    
    
    
    
    
    
    
    
    /*
    @Autowired
    public MrpService(OrderRepository orderRepository,
                      ItemmstRepository itemRepository,
                      MrpRepository mrpRepository,
                      BomDtlRepository bomRepository,
                      ItemInvenRepository invenRepository,
                      CustmstRepository custRepository,
                      UnitRepository unitRepository) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.mrpRepository = mrpRepository;
        this.bomRepository = bomRepository;
        this.invenRepository = invenRepository;
        this.custmstRepository = custRepository;
        this.unitRepository = unitRepository;
    }
    */

