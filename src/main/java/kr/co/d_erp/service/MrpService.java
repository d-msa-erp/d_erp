package kr.co.d_erp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import kr.co.d_erp.repository.oracle.BomDtlRepository;
import kr.co.d_erp.repository.oracle.CustmstRepository;
import kr.co.d_erp.repository.oracle.ItemInvenRepository;
import kr.co.d_erp.repository.oracle.ItemmstRepository;
import kr.co.d_erp.repository.oracle.MrpRepository;
import kr.co.d_erp.repository.oracle.OrderRepository;
import kr.co.d_erp.repository.oracle.UnitRepository;

@Service
public class MrpService {

    private final OrderRepository orderRepository;
    private final ItemmstRepository itemRepository; // 품목 정보 조회를 위해
    private final MrpRepository mrpRepository;   // TB_MRP 테이블 직접 접근
    private final BomDtlRepository bomRepository;     // BOM 정보 조회용	
    private final ItemInvenRepository invenRepository; // 현재고 조회용
    private final CustmstRepository custmstRepository;
    private final UnitRepository unitRepository;
    
    @PersistenceContext
    private EntityManager entityManager; // MRP_RESULT_DETAILS 뷰 조회를 위해

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

}