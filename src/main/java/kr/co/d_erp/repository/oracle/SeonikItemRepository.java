package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.dtos.SeonikItemDto;
import kr.co.d_erp.domain.SeonikItem; // SeonikItem 엔티티
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SeonikItemRepository extends Repository<SeonikItem, Long> {

    @Query("""
        SELECT new kr.co.d_erp.dtos.SeonikItemDto(
            i.itemIdx,
            i.itemCd,
            i.itemNm,
            i.itemFlag,
            cat1.catIdx,    
            cat1.catNm,      
            cat2.catIdx,     
            cat2.catNm,     
            cust.custIdx,    
            cust.custNm,    
            i.itemSpec,
            unit.unitIdx,   
            unit.unitNm,    
            i.itemCost,
            i.optimalInv,
            i.cycleTime,
            i.remark,
            COALESCE((SELECT SUM(inv.stockQty) FROM Inventory inv WHERE inv.itemIdx = i.itemIdx), 0) 
        )
        FROM SeonikItem i
        JOIN i.itemCat1 cat1  
        JOIN i.itemCat2 cat2   
        JOIN i.customer cust   
        JOIN i.itemUnit unit  
        ORDER BY i.itemIdx DESC
        """)
    List<SeonikItemDto> findAllItemsWithJoins();

    @Query("""
        SELECT new kr.co.d_erp.dtos.SeonikItemDto(
            i.itemIdx,
            i.itemCd,
            i.itemNm,
            i.itemFlag,
            cat1.catIdx,
            cat1.catNm,
            cat2.catIdx,
            cat2.catNm,
            cust.custIdx,
            cust.custNm,
            i.itemSpec,
            unit.unitIdx,
            unit.unitNm,
            i.itemCost,
            i.optimalInv,
            i.cycleTime,
            i.remark,
            COALESCE((SELECT SUM(inv.stockQty) FROM Inventory inv WHERE inv.itemIdx = i.itemIdx), 0)
        )
        FROM SeonikItem i
        JOIN i.itemCat1 cat1
        JOIN i.itemCat2 cat2
        JOIN i.customer cust
        JOIN i.itemUnit unit
        WHERE i.itemFlag = :itemFlag
        ORDER BY i.itemIdx DESC
        """)
    List<SeonikItemDto> findItemsWithJoinsByFlag(@Param("itemFlag") String itemFlag);
}