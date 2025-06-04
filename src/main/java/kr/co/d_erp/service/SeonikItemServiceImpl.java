package kr.co.d_erp.service;

import kr.co.d_erp.domain.*; // Custmst, ItemCategory, Unit, Inventory, SeonikItem 등
import kr.co.d_erp.dtos.*;    // SeonikItemDto, CustomerDTO, CategoryDto, UnitDto
import kr.co.d_erp.repository.oracle.*; // 모든 관련 Repository import
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
// import java.util.Date; // Inventory 엔티티에서 @PrePersist 등으로 처리 시 직접 사용 안 함
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SeonikItemServiceImpl implements SeonikItemService {

    private final SeonikItemRepository seonikItemRepository;
    private final CustmstRepository custmstRepository;
    private final ItemCatRepository itemCatRepository;       // ItemCategory 엔티티를 다룸
    private final UnitRepository unitRepository;             // Unit 엔티티를 다룸
    private final InventoryRepository inventoryRepository;   // Inventory 엔티티를 다룸

    @PersistenceContext
    private final EntityManager em;

    @Override
    @Transactional(readOnly = true)
    public List<SeonikItemDto> getAllItems() {
        // SeonikItemRepository의 JPQL이 SeonikItemDto에 currentStockQty까지 채워서 반환
        return seonikItemRepository.findAllItemsWithJoins();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeonikItemDto> getItemsByFlag(String itemFlag) {
        // SeonikItemRepository의 JPQL이 SeonikItemDto에 currentStockQty까지 채워서 반환
        return seonikItemRepository.findItemsWithJoinsByFlag(itemFlag);
    }

    @Override
    public void createItem(SeonikItemDto dto) {
        // SeonikItemDto의 unitIdx는 Integer, ItemCategory 관련 Idx는 Long으로 가정
        Unit itemUnitRef = em.getReference(Unit.class, dto.getUnitIdx());
        ItemCategory cat1Ref = em.getReference(ItemCategory.class, dto.getItemCat1Idx());
        ItemCategory cat2Ref = em.getReference(ItemCategory.class, dto.getItemCat2Idx());

        SeonikItem item = SeonikItem.builder()
                .itemCd(dto.getItemCd())
                .itemNm(dto.getItemNm())
                .itemFlag(dto.getItemFlag())
                .itemCat1(cat1Ref)
                .itemCat2(cat2Ref)
                .customer(em.getReference(Custmst.class, dto.getCustIdx()))
                .itemSpec(dto.getItemSpec())
                .itemUnit(itemUnitRef)
                .itemCost(dto.getItemCost())
                .optimalInv(dto.getOptimalInv())
                .cycleTime(dto.getCycleTime())
                .remark(dto.getRemark())
                .build();
        em.persist(item); // item.itemIdx 자동 생성 (IDENTITY 전략 사용 시)


    }

    @Override
    public void updateItem(Long itemIdx, SeonikItemDto dto) {
        SeonikItem item = em.find(SeonikItem.class, itemIdx);
        if (item == null) {
            throw new IllegalArgumentException("품목 ID " + itemIdx + "에 해당하는 품목이 존재하지 않습니다.");
        }

        Unit itemUnitRef = em.getReference(Unit.class, dto.getUnitIdx());
        ItemCategory cat1Ref = em.getReference(ItemCategory.class, dto.getItemCat1Idx());
        ItemCategory cat2Ref = em.getReference(ItemCategory.class, dto.getItemCat2Idx());

        item.setItemCd(dto.getItemCd());
        item.setItemNm(dto.getItemNm());
        item.setItemFlag(dto.getItemFlag());
        item.setItemCat1(cat1Ref);
        item.setItemCat2(cat2Ref);
        item.setCustomer(em.getReference(Custmst.class, dto.getCustIdx()));
        item.setItemSpec(dto.getItemSpec());
        item.setItemUnit(itemUnitRef);
        item.setItemCost(dto.getItemCost());
        item.setOptimalInv(dto.getOptimalInv());
        item.setCycleTime(dto.getCycleTime());
        item.setRemark(dto.getRemark());
        // 현재고량은 이 DTO를 통해 직접 수정하지 않고, 별도의 입출고 트랜잭션으로 TB_INVENTORY에서 관리됨.
    }

    @Override
    public void deleteItem(Long itemIdx) {
        SeonikItem item = em.find(SeonikItem.class, itemIdx);
        if (item != null) {
            // 품목 삭제 전, 해당 품목과 관련된 모든 창고의 재고 정보를 먼저 삭제
            inventoryRepository.deleteByItemIdx(itemIdx);
            em.remove(item); // 그 후 품목 마스터에서 품목을 삭제
        } else {
            throw new IllegalArgumentException("품목 ID " + itemIdx + "에 해당하는 품목이 존재하지 않습니다.");
        }
    }

    // --- 모달 옵션 데이터 조회 메소드 구현 ---
    @Override
    @Transactional(readOnly = true)
    public List<CustomerDTO> getAllCustomerOptions(String bizFlag) {
        // CustmstRepository가 CustomerDTO 목록을 반환 (kr.co.d_erp.dtos.CustomerDTO 사용)
        return custmstRepository.findCustIdxAndCustNmByBizFlag(bizFlag);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getParentItemCategoryOptions() {
        // ItemCatRepository는 ItemCategory 엔티티 목록을 반환
        List<ItemCategory> parentCategories = itemCatRepository.findByParentCategoryIsNullOrderByCatNmAsc();
        // ItemCategory 엔티티 목록을 CategoryDto 목록으로 변환
        return parentCategories.stream()
                .map(cat -> new CategoryDto(
                        cat.getCatIdx() != null ? cat.getCatIdx().intValue() : null, // Long to Integer
                        cat.getCatCd(),
                        cat.getCatNm(),
                        null, // 부모 카테고리이므로 parentIdx는 null
                        cat.getRemark()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getChildItemCategoryOptions(Long parentCategoryIdx) {
        List<ItemCategory> childCategories = itemCatRepository.findByParentCategory_CatIdxOrderByCatNmAsc(parentCategoryIdx);
        return childCategories.stream()
                .map(cat -> new CategoryDto(
                        cat.getCatIdx() != null ? cat.getCatIdx().intValue() : null, // Long to Integer
                        cat.getCatCd(),
                        cat.getCatNm(),
                        // 자식의 parentIdx는 매개변수로 받은 parentCategoryIdx와 같음. CategoryDto의 parentIdx가 Integer이므로 변환.
                        parentCategoryIdx != null ? parentCategoryIdx.intValue() : null,
                        cat.getRemark()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitDto> getAllUnitOptions() {
        // UnitRepository는 Unit 엔티티 목록을 반환 (Unit PK는 Integer)
        List<Unit> units = unitRepository.findAll(); // 필요시 정렬 추가: unitRepository.findAll(Sort.by("unitNm"))
        // Unit 엔티티 목록을 UnitDto 목록으로 변환
        return units.stream()
                .map(unit -> new UnitDto(unit.getUnitIdx(), unit.getUnitNm())) // Unit 엔티티의 getter 가정
                .collect(Collectors.toList());
    }
}