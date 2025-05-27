package kr.co.d_erp.service;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.domain.BomDtl;
import kr.co.d_erp.dtos.Itemmst; //
import kr.co.d_erp.dtos.*;
import kr.co.d_erp.repository.oracle.BomDtlRepository; //
import kr.co.d_erp.repository.oracle.ItemmstRepository; //
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BomServiceImpl implements BomService {

    private final BomDtlRepository bomDtlRepository; //
    private final ItemmstRepository itemmstRepository; //

    @Override
    public List<BomSummaryDto> getBomSummaryList() {
        List<BomSummaryProjection> projections = itemmstRepository.findBomSummaries();
        return projections.stream()
            .map(p -> new BomSummaryDto(
                p.getItemIdx(),
                p.getPitemCd(),
                p.getPitemNm(),
                p.getCatNm(),
                p.getPunitNm(),
                p.getPtotalRawMaterialCost() != null ? p.getPtotalRawMaterialCost() : BigDecimal.ZERO
            ))
            .collect(Collectors.toList());
    }

    @Override
    public BomItemDetailDto getBomDetails(Long parentItemIdx) { //
        // 1. 리포지토리에서 프로젝션 리스트를 받습니다.
        List<BomListItemProjection> projections = bomDtlRepository.findBomListWithParentDetails(parentItemIdx);

        // 2. 하위 품목(projections)이 없는 경우 처리
        if (projections == null || projections.isEmpty()) {
            return itemmstRepository.findById(parentItemIdx)
                .map(parent -> { // parent는 Itemmst 객체
                    BomItemDetailDto dto = new BomItemDetailDto();
                    dto.setItemIdx(parent.getItemIdx());
                    dto.setItemCd(parent.getItemCd());
                    dto.setItemNm(parent.getItemNm());
                    dto.setItemFlag(parent.getItemFlag());
                    dto.setItemSpec(parent.getItemSpec());
                    dto.setItemCost(parent.getItemCost() != null ? BigDecimal.valueOf(parent.getItemCost()) : null); // Double to BigDecimal
                    // Itemmst 엔티티에 cycleTime, remark 필드가 있어야 합니다.
                    // dto.setCycleTime(parent.getCycleTime()); // Itemmst에 getCycleTime() 필요
                    // dto.setRemark(parent.getRemark());       // Itemmst에 getRemark() 필요
                    if (parent.getRemark() != null) { // Itemmst의 remark 사용
                        dto.setRemark(parent.getRemark());
                    }
                    // Itemmst에 cycleTime 필드 추가 후 아래 주석 해제
                    // if (parent.getCycleTime() != null) {
                    //    dto.setCycleTime(parent.getCycleTime());
                    // }
                    dto.setComponents(new ArrayList<>());
                    return dto;
                })
                .orElse(null);
        }

        // 3. 하위 품목이 있는 경우:
        BomListItemProjection firstProjection = projections.get(0);
        BomItemDetailDto detailDto = new BomItemDetailDto();

        // 3-1. 첫 번째 프로젝션에서 상위 품목 정보 설정
        detailDto.setItemIdx(firstProjection.getParentItemIdx());
        detailDto.setItemCd(firstProjection.getParentItemCd());
        detailDto.setItemNm(firstProjection.getParentItemNm());
        detailDto.setItemFlag(firstProjection.getParentItemFlag());
        detailDto.setItemSpec(firstProjection.getParentItemSpec());
        detailDto.setCycleTime(firstProjection.getParentCycleTime());
        detailDto.setRemark(firstProjection.getParentRemark());
        // 상위 품목의 itemCost는 BomItemDetailDto에 필드가 있으므로, Itemmst에서 가져온 값으로 채워야 합니다.
        // 이 값은 firstProjection에는 없으므로, itemmstRepository.findById로 다시 조회하거나,
        // Itemmst 엔티티에 있는 값을 활용 (위 '하위 품목 없는 경우'와 유사하게 처리)
        // 여기서는 간단히 null로 두거나, 필요시 Itemmst에서 조회하여 채웁니다.
        // (또는 ItemmstRepository.findById를 여기서 한번 더 호출하여 상위 품목의 itemCost를 명확히 가져올 수 있습니다)
        itemmstRepository.findById(firstProjection.getParentItemIdx()).ifPresent(parentFullInfo -> {
            if(parentFullInfo.getItemCost() != null) {
                detailDto.setItemCost(BigDecimal.valueOf(parentFullInfo.getItemCost()));
            }
        });


        // 3-2. 프로젝션 리스트를 BomListItemDto 리스트로 변환 (하위 품목 정보)
        List<BomListItemDto> components = projections.stream()
            .map(p -> new BomListItemDto(
                p.getBomIdx(),
                p.getSubItemIdx(),
                p.getSubItemCd(),
                p.getSubItemNm(),
                p.getUseQty(),
                p.getUnitNm(),
                p.getItemFlag(),    // 하위 품목 Flag
                p.getSeqNo(),
                p.getLossRt(),
                p.getItemPrice(),
                p.getRemark(),     // 하위 품목 비고
                p.getSubItemMasterCost()//하위 품목 마스터원가
            ))
            .collect(Collectors.toList());

        // 3-3. 변환된 DTO 리스트를 설정
        detailDto.setComponents(components);

        return detailDto;
    }

    @Override
    @Transactional
    public boolean updateBomSequence(Long parentItemIdx, List<BomSequenceUpdateDto> sequenceUpdates) { //
        System.out.println("Updating sequence for " + parentItemIdx);
        return true;
    }

    @Override
    public List<ItemSelectionDto> getItemsForSelectionByFlag(String itemFlag) {
        List<ItemSelectionProjection> projections = itemmstRepository.findItemsByFlagForSelection(itemFlag);
        return projections.stream()
            .map(p -> new ItemSelectionDto(
                p.getItemIdx(),
                p.getItemCd(),
                p.getItemNm(),
                p.getItemSpec(),
                p.getUnitNm(),
                p.getItemCost()// ★★★ 프로젝션에서 itemCost 매핑 ★★★
            ))
            .collect(Collectors.toList());
    }
    
    
    //Bom수정
    @Override
    @Transactional
    public boolean updateBom(Long parentItemIdx, BomUpdateRequestDto requestDto) {
        System.out.println("--- BomServiceImpl.updateBom 시작 ---");
        System.out.println("Parent Item IDX: " + parentItemIdx);
        System.out.println("Request DTO: " + requestDto.toString()); // DTO 내용 전체 로깅

        try {
            // 1. 상위 품목 정보 업데이트
            Itemmst parentItem = itemmstRepository.findById(parentItemIdx)
                    .orElseThrow(() -> {
                        System.err.println("오류: 수정할 상위 품목을 찾을 수 없습니다: " + parentItemIdx);
                        return new IllegalArgumentException("수정할 상위 품목을 찾을 수 없습니다: " + parentItemIdx);
                    });
            System.out.println("상위 품목 조회 성공: " + parentItem.getItemNm());

            if (requestDto.getParentCycleTime() != null) {
                parentItem.setCycleTime(requestDto.getParentCycleTime());
            }
            parentItem.setRemark(requestDto.getParentRemark());
            itemmstRepository.save(parentItem);
            System.out.println("상위 품목 정보 업데이트 성공.");

         // 2. 기존 하위 구성품 삭제
            List<BomDtl> existingChildren =
                bomDtlRepository.findByParentItemIdxOrderBySeqNoAsc(parentItemIdx);
            System.out.println("삭제할 기존 하위 구성품 수: " + existingChildren.size());
            bomDtlRepository.deleteAll(existingChildren);

            // ← 여기서 삭제 작업을 즉시 DB에 반영하도록 flush() 호출
            bomDtlRepository.flush();

            System.out.println("기존 하위 구성품 삭제 완료.");

            // 3. 새로운 하위 구성품 추가
            if (requestDto.getComponents() != null && !requestDto.getComponents().isEmpty()) {
                System.out.println("새로운 하위 구성품 추가 시도. 추가할 구성품 수: "
                                   + requestDto.getComponents().size());
                List<BomDtl> newChildren = new ArrayList<>();
                for (BomDtlRequestDto compDto : requestDto.getComponents()) {
                    System.out.println("  처리 중인 하위 품목 DTO: subItemIdx=" + compDto.getSubItemIdx() + ", seqNo=" + compDto.getSeqNo());
                    BomDtl newBomDtl = new BomDtl();
                    newBomDtl.setParentItemIdx(parentItemIdx);

                    Itemmst subItem = itemmstRepository.findById(compDto.getSubItemIdx())
                            .orElseThrow(() -> {
                                System.err.println("오류: 하위 품목을 찾을 수 없습니다 (ID: " + compDto.getSubItemIdx() + ")");
                                return new IllegalArgumentException("하위 품목을 찾을 수 없습니다: " + compDto.getSubItemIdx());
                            });
                    newBomDtl.setSubItemIdx(subItem.getItemIdx());
                    System.out.println("    하위 품목 조회 성공: " + subItem.getItemNm());

                    newBomDtl.setUseQty(compDto.getUseQty());
                    newBomDtl.setLossRt(compDto.getLossRate());
                    newBomDtl.setItemPrice(compDto.getItemPrice());
                    newBomDtl.setRemark(compDto.getRemark());
                    newBomDtl.setSeqNo(compDto.getSeqNo());
                    newChildren.add(newBomDtl);
                }
                System.out.println("DB에 저장할 newChildren 리스트: " + newChildren.size() + "개 항목");
                newChildren.forEach(c -> System.out.println("    -> P_IDX:" + c.getParentItemIdx() + ", S_IDX:" + c.getSubItemIdx() + ", Seq:" + c.getSeqNo()));

                bomDtlRepository.saveAll(newChildren); // 여기서 ORA-00001 발생 가능성
                System.out.println("새로운 하위 구성품 추가 완료.");
            } else {
                System.out.println("추가할 새로운 하위 구성품 없음.");
            }
            System.out.println("--- BomServiceImpl.updateBom 성공적으로 완료 ---");
            return true;
        } catch (Exception e) {
            System.err.println("★★★ BOM 업데이트 중 심각한 오류 발생 (catch 블록) ★★★");
            e.printStackTrace(); // 전체 스택 트레이스 출력
            // 가능하다면 더 구체적인 예외를 잡아서 로깅하는 것이 좋습니다.
            // 예: catch (DataIntegrityViolationException dive) { ... }
            //     catch (IllegalArgumentException iae) { ... }
            return false;
        }
    }
    //저장용
    @Override
    @Transactional // 데이터 일관성을 위해 트랜잭션 처리
    public boolean saveNewBom(BomSaveRequestDto bomSaveRequestDto) {
        System.out.println("--- BomServiceImpl.saveNewBom 시작 ---");
        System.out.println("Request DTO: " + bomSaveRequestDto.toString()); // DTO 내용 로깅

        try {
            // 1. 상위 품목(Itemmst) 엔티티 조회
            Long parentItemIdx = bomSaveRequestDto.getParentItemIdx();
            Itemmst parentItem = itemmstRepository.findById(parentItemIdx)
                    .orElseThrow(() -> {
                        String errorMsg = "신규 BOM 저장 실패: 상위 품목을 찾을 수 없습니다. ID: " + parentItemIdx;
                        System.err.println(errorMsg);
                        return new IllegalArgumentException(errorMsg); // 예외를 발생시켜 트랜잭션 롤백 유도
                    });
            System.out.println("상위 품목 조회 성공: " + parentItem.getItemNm());

            // 2. 상위 품목(Itemmst) 정보 업데이트 (CycleTime, Remark 등)
            // Itemmst 엔티티에 setCycleTime, setRemark 메소드가 BigDecimal, String 타입을 받도록 정의되어 있어야 합니다.
            if (bomSaveRequestDto.getParentCycleTime() != null) {
                // DTO의 parentCycleTime 타입(BigDecimal 또는 Double)과 Itemmst 엔티티의 cycleTime 필드 타입 일치 필요
                // 예시: parentItem.setCycleTime(bomSaveRequestDto.getParentCycleTime());
                // 만약 Itemmst의 cycleTime 타입이 Double이라면 변환 필요:
                // parentItem.setCycleTime(bomSaveRequestDto.getParentCycleTime().doubleValue());
                // 또는 Itemmst의 cycleTime 타입이 BigDecimal이라면 그대로 사용:
                parentItem.setCycleTime(bomSaveRequestDto.getParentCycleTime());
            }
            if (bomSaveRequestDto.getParentRemark() != null) {
                parentItem.setRemark(bomSaveRequestDto.getParentRemark());
            }
            itemmstRepository.save(parentItem); // 변경된 상위 품목 정보 저장
            System.out.println("상위 품목 정보 업데이트/저장 성공.");

            // 3. 해당 상위 품목(parentItemIdx)을 가지는 기존 BomDtl 데이터 삭제
            //    (updateBom 메소드의 로직을 참고하여, 신규 등록 시에도 기존 관계를 정리하고 새로 삽입하는 방식)
            List<BomDtl> existingChildren = bomDtlRepository.findByParentItemIdxOrderBySeqNoAsc(parentItemIdx);
            if (existingChildren != null && !existingChildren.isEmpty()) {
                System.out.println("신규 등록 전, parentItemIdx " + parentItemIdx + " 에 연결된 기존 BomDtl " + existingChildren.size() + "개 삭제 시도.");
                bomDtlRepository.deleteAll(existingChildren);
                bomDtlRepository.flush(); // DB에 즉시 반영 (JPA 최적화로 인해 실제 삭제는 flush/commit 시점에 이루어질 수 있음)
                System.out.println("기존 BomDtl 삭제 완료.");
            } else {
                System.out.println("parentItemIdx " + parentItemIdx + " 에 연결된 기존 BomDtl 없음.");
            }

            // 4. 새로운 BomDtl 엔티티 생성 및 저장 (하위 품목 구성 정보)
            List<BomDtl> bomDetailsToSave = new ArrayList<>();
            if (bomSaveRequestDto.getComponents() != null && !bomSaveRequestDto.getComponents().isEmpty()) {
                System.out.println("새로운 하위 구성품(BomDtl) 추가 시도. 추가할 구성품 수: " + bomSaveRequestDto.getComponents().size());

                for (BomSaveRequestDto.BomComponentSaveDto componentDto : bomSaveRequestDto.getComponents()) {
                    // 하위 품목(Itemmst) 엔티티 조회
                    Itemmst subItem = itemmstRepository.findById(componentDto.getSubItemIdx())
                            .orElseThrow(() -> {
                                String errorMsg = "신규 BOM 저장 실패: 하위 품목(원자재)을 찾을 수 없습니다. ID: " + componentDto.getSubItemIdx();
                                System.err.println(errorMsg);
                                return new IllegalArgumentException(errorMsg); // 예외 발생
                            });
                    System.out.println("  처리 중인 하위 품목: " + subItem.getItemNm() + " (ID: " + subItem.getItemIdx() + ")");

                    BomDtl bomDtl = new BomDtl();
                    bomDtl.setParentItemIdx(parentItemIdx);       // 상위 품목의 ID (Itemmst의 PK)
                    bomDtl.setSubItemIdx(subItem.getItemIdx());   // 하위 품목의 ID (Itemmst의 PK)

                    // DTO의 필드명을 BomDtl 엔티티 필드명 및 타입에 맞게 설정
                    // BomDtl 엔티티에 useQty, lossRt, itemPrice, remark, seqNo 필드와 setter가 적절한 타입으로 있어야 함
                    bomDtl.setUseQty(componentDto.getUseQty());     // 타입 확인 (BigDecimal or Double)
                    bomDtl.setLossRt(componentDto.getLossRate());   // 타입 확인 및 필드명 확인 (lossRt vs lossRate)
                    bomDtl.setItemPrice(componentDto.getItemPrice()); // 타입 확인
                    bomDtl.setRemark(componentDto.getRemark());
                    bomDtl.setSeqNo(componentDto.getSeqNo());
                    // bomDtl.setUseYn("Y"); // 등 필요한 기본값 설정이 있다면 추가

                    bomDetailsToSave.add(bomDtl);
                }

                if (!bomDetailsToSave.isEmpty()) {
                    System.out.println("DB에 저장할 new BomDtl 리스트: " + bomDetailsToSave.size() + "개 항목");
                    bomDetailsToSave.forEach(c -> System.out.println("    -> ParentItemIdx:" + c.getParentItemIdx() + ", SubItemIdx:" + c.getSubItemIdx() + ", SeqNo:" + c.getSeqNo()));
                    bomDtlRepository.saveAll(bomDetailsToSave); // 하위 품목들 일괄 저장
                    System.out.println("새로운 하위 구성품(BomDtl) 추가 완료.");
                }
            } else {
                System.out.println("추가할 하위 구성품(BomDtl) 없음.");
                // 하위 품목이 없는 BOM도 허용할 것인지, 아니면 여기서 오류/false를 반환할지 정책에 따라 결정
            }

            System.out.println("--- BomServiceImpl.saveNewBom 성공적으로 완료 ---");
            return true;

        } catch (IllegalArgumentException e) { // findById 등에서 발생한 예외 (품목 못 찾음 등)
            System.err.println("신규 BOM 저장 중 유효하지 않은 인자 오류: " + e.getMessage());
            // @Transactional에 의해 롤백됨
            return false;
        } catch (Exception e) { // 그 외 모든 예외
            System.err.println("★★★ 신규 BOM 저장 중 예상치 못한 심각한 오류 발생 ★★★");
            e.printStackTrace(); // 전체 스택 트레이스 출력
            // @Transactional에 의해 롤백됨
            return false;
        }
    }
    
    
    
}