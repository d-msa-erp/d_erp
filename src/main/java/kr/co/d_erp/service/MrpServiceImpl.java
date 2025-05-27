package kr.co.d_erp.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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
    // ... 필드 주입 ...
    private final ItemInvenRepository invenRepository; // 필드명이 invenRepository로 잘 되어 있음
    // ...
    @Override
    @Transactional(readOnly = true)
    public Long getCurrentStockByItemIdx(Long itemIdx) {
        if (itemIdx == null) {
            return 0L;
        }
        Optional<InvenDto> inventoryOpt = invenRepository.findByItem_ItemIdx(itemIdx); // 주입된 invenRepository 사용
        return inventoryOpt.map(InvenDto::getStockQty).orElse(0L);
    }

}